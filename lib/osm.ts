import { env } from "./env";

interface OSMNode {
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

interface OSMChangeset {
  id: number;
}

let accessToken: string | null = null;

async function getAccessToken(): Promise<string> {
  // If we already have a token cached, use it
  // Note: OSM access tokens typically don't expire, so we can cache them indefinitely
  if (accessToken) {
    return accessToken;
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

