import { env } from "./env";

interface OSMNode {
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

interface OSMWay {
  tags: Record<string, string>;
  nodes: number[];
}

interface OSMFetchedNode {
  id: number;
  version: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

interface OSMFetchedWay {
  id: number;
  version: number;
  tags: Record<string, string>;
  nodes: number[];
}

interface OSMChangeset {
  id: number;
}

let accessToken: string | null = null;

async function getAccessToken(): Promise<string> {
  // If we already have a token cached, use it
  // Note: OSM access tokens typically don't expire, so we can cache them indefinitely
  if (accessToken) {
    return accessToken; // TypeScript knows accessToken is string here due to the if check
  }

  // OSM credentials check
  if (!env.osmClientId || !env.osmClientSecret || !env.osmRefreshToken) {
    throw new Error("OSM credentials not configured");
  }

  // Try to exchange refresh token for access token
  // OSM OAuth2 requires Basic Authentication with client_id:client_secret
  const basicAuth = Buffer.from(`${env.osmClientId}:${env.osmClientSecret}`).toString('base64');
  
  // First, try using refresh_token grant type
  let response = await fetch("https://www.openstreetmap.org/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: env.osmRefreshToken,
    }),
  });

  // If refresh_token grant type is not supported, try using the refresh token as an access token
  // (OSM access tokens don't expire, so the refresh token might actually be the access token)
  if (!response.ok) {
    const errorText = await response.text();
    const errorData = JSON.parse(errorText);
    
    if (errorData.error === "unsupported_grant_type") {
      console.warn("OSM refresh_token grant type not supported. Using refresh token as access token.");
      // If OSM doesn't support refresh_token grant type, use the refresh token directly
      // This works if OSM access tokens don't expire
      accessToken = env.osmRefreshToken;
      return accessToken;
    }
    
    console.error("OSM token exchange error:", {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
      hasClientId: !!env.osmClientId,
      hasClientSecret: !!env.osmClientSecret,
      hasRefreshToken: !!env.osmRefreshToken,
    });
    throw new Error(`Failed to exchange OSM token: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  accessToken = data.access_token || data.accessToken || env.osmRefreshToken;
  
  // OSM access tokens typically don't expire, so we don't need to track expiry
  // But if expires_in is provided, we can use it
  // tokenExpiry is not needed if tokens don't expire

  if (!accessToken) {
    throw new Error("Failed to obtain OSM access token");
  }

  return accessToken;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createNodeXml(node: OSMNode, changesetId: number): string {
  const tags = Object.entries(node.tags)
    .map(([k, v]) => `    <tag k="${escapeXml(k)}" v="${escapeXml(v)}"/>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="Aussie-Bitcoin-Merchants">
  <node changeset="${changesetId}" lat="${node.lat}" lon="${node.lon}">
${tags}
  </node>
</osm>`;
}

export async function openChangeset(comment: string): Promise<number> {
  const token = await getAccessToken();

  const changesetXml = `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="Aussie-Bitcoin-Merchants">
  <changeset>
    <tag k="created_by" v="Aussie Bitcoin Merchants"/>
    <tag k="comment" v="${escapeXml(comment)}"/>
    <tag k="hashtags" v="#btcmap"/>
  </changeset>
</osm>`;

  const response = await fetch("https://api.openstreetmap.org/api/0.6/changeset/create", {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/xml",
    },
    body: changesetXml,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create changeset: ${response.status} ${text}`);
  }

  const changesetId = parseInt(await response.text(), 10);
  return changesetId;
}

export async function createNode(node: OSMNode, changesetId: number): Promise<number> {
  const token = await getAccessToken();

  const nodeXml = createNodeXml(node, changesetId);

  const response = await fetch("https://api.openstreetmap.org/api/0.6/node/create", {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/xml",
    },
    body: nodeXml,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create node: ${response.status} ${text}`);
  }

  const nodeId = parseInt(await response.text(), 10);
  return nodeId;
}

export async function updateNode(nodeId: number, node: OSMNode, version: number, changesetId: number): Promise<void> {
  const token = await getAccessToken();

  const tags = Object.entries(node.tags)
    .map(([k, v]) => `    <tag k="${escapeXml(k)}" v="${escapeXml(v)}"/>`)
    .join("\n");

  const nodeXml = `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="Aussie-Bitcoin-Merchants">
  <node id="${nodeId}" version="${version}" changeset="${changesetId}" lat="${node.lat}" lon="${node.lon}">
${tags}
  </node>
</osm>`;

  const response = await fetch(`https://api.openstreetmap.org/api/0.6/node/${nodeId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/xml",
    },
    body: nodeXml,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to update node: ${response.status} ${text}`);
  }
}

/**
 * Update a way in OSM (tags only, nodes/geometry unchanged)
 */
export async function updateWay(wayId: number, way: OSMWay, version: number, changesetId: number): Promise<void> {
  const token = await getAccessToken();

  const tags = Object.entries(way.tags)
    .map(([k, v]) => `    <tag k="${escapeXml(k)}" v="${escapeXml(v)}"/>`)
    .join("\n");

  // Include existing node references (geometry unchanged)
  const nodeRefs = way.nodes.map(nodeId => `    <nd ref="${nodeId}"/>`).join("\n");

  const wayXml = `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="Aussie-Bitcoin-Merchants">
  <way id="${wayId}" version="${version}" changeset="${changesetId}">
${nodeRefs}
${tags}
  </way>
</osm>`;

  const response = await fetch(`https://api.openstreetmap.org/api/0.6/way/${wayId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/xml",
    },
    body: wayXml,
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 409) {
      throw new Error(`Version conflict: Way ${wayId} was modified by another user`);
    }
    throw new Error(`Failed to update way: ${response.status} ${text}`);
  }
}

export async function closeChangeset(changesetId: number): Promise<void> {
  const token = await getAccessToken();

  const response = await fetch(`https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/close`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to close changeset: ${response.status} ${text}`);
  }
}

/**
 * Fetch a node from OSM API
 * Returns the node data including version, coordinates, and tags
 */
export async function fetchNode(nodeId: number): Promise<OSMFetchedNode> {
  const token = await getAccessToken();

  const response = await fetch(`https://api.openstreetmap.org/api/0.6/node/${nodeId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 410) {
      throw new Error(`Node ${nodeId} has been deleted`);
    }
    throw new Error(`Failed to fetch node: ${response.status} ${text}`);
  }

  const xmlText = await response.text();
  
  // Parse XML to extract node data - attributes can be in any order
  const idMatch = xmlText.match(/<node[^>]*\s+id="(\d+)"/);
  const versionMatch = xmlText.match(/<node[^>]*\s+version="(\d+)"/);
  const latMatch = xmlText.match(/<node[^>]*\s+lat="([\d.-]+)"/);
  const lonMatch = xmlText.match(/<node[^>]*\s+lon="([\d.-]+)"/);
  
  if (!idMatch || !versionMatch || !latMatch || !lonMatch) {
    throw new Error(`Failed to parse node XML: ${xmlText}`);
  }

  const id = parseInt(idMatch[1], 10);
  const version = parseInt(versionMatch[1], 10);
  const lat = parseFloat(latMatch[1]);
  const lon = parseFloat(lonMatch[1]);

  // Extract tags
  const tags: Record<string, string> = {};
  const tagMatches = xmlText.matchAll(/<tag k="([^"]+)" v="([^"]+)"/g);
  for (const match of tagMatches) {
    // Unescape XML entities
    const key = match[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    const value = match[2]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    tags[key] = value;
  }

  return {
    id,
    version,
    lat,
    lon,
    tags,
  };
}

/**
 * Fetch a way from OSM API
 * Returns the way data including version, tags, and node references
 */
export async function fetchWay(wayId: number): Promise<OSMFetchedWay> {
  const token = await getAccessToken();

  const response = await fetch(`https://api.openstreetmap.org/api/0.6/way/${wayId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 410) {
      throw new Error(`Way ${wayId} has been deleted`);
    }
    throw new Error(`Failed to fetch way: ${response.status} ${text}`);
  }

  const xmlText = await response.text();
  
  // Parse XML to extract way data - attributes can be in any order
  const idMatch = xmlText.match(/<way[^>]*\s+id="(\d+)"/);
  const versionMatch = xmlText.match(/<way[^>]*\s+version="(\d+)"/);
  
  if (!idMatch || !versionMatch) {
    throw new Error(`Failed to parse way XML: ${xmlText}`);
  }

  const id = parseInt(idMatch[1], 10);
  const version = parseInt(versionMatch[1], 10);

  // Extract node references
  const nodes: number[] = [];
  const nodeMatches = xmlText.matchAll(/<nd ref="(\d+)"/g);
  for (const match of nodeMatches) {
    nodes.push(parseInt(match[1], 10));
  }

  // Extract tags
  const tags: Record<string, string> = {};
  const tagMatches = xmlText.matchAll(/<tag k="([^"]+)" v="([^"]+)"/g);
  for (const match of tagMatches) {
    // Unescape XML entities
    const key = match[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    const value = match[2]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    tags[key] = value;
  }

  return {
    id,
    version,
    tags,
    nodes,
  };
}

