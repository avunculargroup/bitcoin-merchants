# Prompt Guide for Implementing the BTC Map Onboarding Portal

**Purpose:** You are an AI code assistant (e.g. Cursor AI) tasked with building a web portal that allows Australian businesses to register themselves as accepting Bitcoin and have that information published on BTC Map (which uses OpenStreetMap data). Use this guide to implement the project step by step. The portal uses **Next.js**, **Tailwind CSS** and **ShadUI** on the frontend, integrates with **Google Places Autocomplete** for business search, **Nominatim** for geocoding, and the **OpenStreetMap (OSM) v0.6 API** for creating/updating nodes using a dedicated company account. Follow OSM import guidelines to ensure compliance[\[1\]](https://wiki.openstreetmap.org/wiki/Fortaleza/PMF_Addresses_Import/Import_Guide#:~:text=,Fortaleza%20City%20Council).

## 1 Project setup

- **Bootstrap a Next.js project:** Use the latest Next.js version with the app router. Initialise Tailwind CSS and ShadUI (or another headless component library) following their installation guides. Configure ESLint and TypeScript for type safety.
- **Configure environment variables:** Create a .env.local file (not committed) with keys for:
- NEXT_PUBLIC_GOOGLE_PLACES_API_KEY - your Google Places API key.
- RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET_KEY - keys for Google reCAPTCHA.
- OSM_CLIENT_ID, OSM_CLIENT_SECRET, and a OSM_REFRESH_TOKEN - credentials for your dedicated OSM import account. This account's public profile should state that it is used for the BTC‑accepting businesses import and link to project documentation[\[1\]](https://wiki.openstreetmap.org/wiki/Fortaleza/PMF_Addresses_Import/Import_Guide#:~:text=,Fortaleza%20City%20Council).
- DATABASE_URL - connection string for a PostgreSQL/Supabase instance.

## 2 Frontend implementation

- **Home page and search component:** Build a page with a search input that uses Google Places Autocomplete to suggest existing business names. Do not persist Google coordinates; only the name and formatted address are used. When the user selects an option, call your backend to geocode the address via Nominatim (OSM‑licensed) and return lat/long.
- **Information form:** Create a multi‑section form that collects:
- Business name, description and category (shop=\*, amenity=\*, etc.).
- Address fields (addr:street, addr:suburb, addr:postcode, etc.) pre‑filled from Nominatim but editable.
- Contact details (contact:phone, contact:website, contact:email).
- Bitcoin acceptance details (e.g. payment:bitcoin=yes, payment:lightning=yes).
- Optional tags such as opening hours (opening_hours=\*) and wheelchair access (wheelchair=\*). Use ShadUI components for accessible inputs, dropdowns, toggles and validation messages.
- **Captcha integration:** Add a Google reCAPTCHA widget to the form. On submission, obtain the reCAPTCHA token and send it with the form payload.
- **Preview and confirmation:** Before sending data to the server, display a summary of the tags that will be uploaded to OSM. Provide an explicit confirmation button so users understand that the data will be shared publicly.

## 3 Backend implementation (API routes)

- **Geocoding endpoint (/api/geocode):** Accept a formatted address and call Nominatim to retrieve coordinates. Return latitude, longitude and address components. Cache results to minimise API calls.
- **Captcha verification (/api/verify-captcha):** Verify the reCAPTCHA token by making a POST request to Google's verification endpoint. Reject requests with invalid tokens.
- **Duplicate detection (/api/check-duplicate):** Given coordinates, query the Overpass API for existing nodes within a small radius (e.g. 25 m) that have payment:bitcoin or similar tags. If a duplicate is found, return its OSM ID; otherwise indicate that the entry is unique.
- **OSM changeset management:**
- Write a helper function to **open a changeset** via POST /api/0.6/changeset/create. The request body must be an &lt;osm&gt; XML with tags such as &lt;tag k="created_by" v="BTCMap onboarding portal"/&gt; and a comment describing the edit.
- To **create a node**, build an XML document wrapped in &lt;osm&gt; where the &lt;node&gt; element includes changeset, lat and lon attributes and nested &lt;tag&gt; elements for each OSM tag[\[2\]](https://wiki.openstreetmap.org/wiki/API_v0.6#:~:text=Creates%20a%20new%20element%20of,osm%3E%60%20element). Send a PUT /api/0.6/node/create request. Capture the response (the new node ID) and handle errors (e.g. missing changeset, closed changeset, out‑of‑bounds coordinates) according to the API spec[\[3\]](https://wiki.openstreetmap.org/wiki/API_v0.6#:~:text=The%20ID%20of%20the%20newly,text%2Fplain).
- To **update an existing node**, fetch the current node via GET /api/0.6/node/#id and include its version in the update XML when sending PUT /api/0.6/node/#id[\[4\]](https://wiki.openstreetmap.org/wiki/API_v0.6#:~:text=Updates%20data%20from%20a%20preexisting,the%20element%20in%20the%20database).
- After creating or updating the node, **close the changeset** using PUT /api/0.6/changeset/#id/close.
- **Submission handler (/api/submit):**
- Verify the reCAPTCHA token.
- Check for duplicates via the Overpass endpoint; if found, mark the submission as a duplicate and return a message to the client.
- If unique, open a changeset and create (or update) the node as described above.
- Save the submission and the resulting OSM node ID to your database. Include status values (pending, uploaded, duplicate, etc.).
- Respond to the client with success or error details.
- **Email/notification service:** Optionally send an email to the business confirming their submission and containing a link to the OSM node.

## 4 Database and models

Define models using an ORM such as Prisma or TypeORM. Tables include submissions (business details, status, timestamps), osm_nodes (linking submissions to OSM IDs), and admin_users for moderation. Implement migrations to create and update tables.

## 5 Admin interface

- Build a protected Next.js route (/admin) that lists pending or duplicate submissions. Only authenticated staff should access this route (use NextAuth.js or another authentication provider).
- Allow admins to view details, approve or reject submissions, and trigger uploads to OSM manually if needed.
- Provide search and filtering for submissions, and display logs of uploaded changesets.

## 6 Quality assurance and testing

- Write unit tests for API routes (mocking external services like Google, Nominatim, Overpass and OSM). Ensure correct handling of success and error conditions.
- Perform integration tests to verify the entire flow: search, form completion, duplicate detection and OSM upload.
- Use Cypress or Playwright for end‑to‑end tests simulating user interactions.

## 7 Compliance and guidelines

- **Licensing:** Do not import coordinates or data directly from Google Places; use Nominatim for geocoding to comply with OSM's ODbL requirements. Only upload user‑provided or OSM‑licensed data to OSM.
- **Import guidelines:** Use a **dedicated OSM account** for uploads and mention the project and data source in its profile[\[1\]](https://wiki.openstreetmap.org/wiki/Fortaleza/PMF_Addresses_Import/Import_Guide#:~:text=,Fortaleza%20City%20Council). Link to your project documentation and follow OSM's recommendations for naming, linking to the main account and using a separate email if necessary.[\[2\]](https://wiki.openstreetmap.org/wiki/API_v0.6#:~:text=Creates%20a%20new%20element%20of,osm%3E%60%20element). Upload each business as an individual changeset rather than bulk imports to respect community standards.
- **Error handling:** Respect API rate limits and handle HTTP errors gracefully. Log all OSM API responses for debugging and auditing.

## 8 Deployment and operations

- Configure your build pipeline to run linting, tests and type checks on every commit.
- Deploy the application to a cloud provider (e.g. Vercel, AWS Lambda or Cloud Run). Use environment variables for secrets and keep them out of version control.
- Monitor application performance and errors using tools such as Sentry or Datadog. Set up alerts for OSM API failures or database issues.
- Regularly backup the database and ensure you can restore data quickly.

By following this prompt guide, you will implement a full‑stack onboarding portal that allows Australian businesses to register themselves as Bitcoin‑accepting vendors on BTC Map. The system ensures data quality through geocoding, duplicate detection and manual moderation, and respects OpenStreetMap's licensing and import guidelines.

[\[1\]](https://wiki.openstreetmap.org/wiki/Fortaleza/PMF_Addresses_Import/Import_Guide#:~:text=,Fortaleza%20City%20Council) Fortaleza/PMF Addresses Import/Import Guide - OpenStreetMap Wiki

<https://wiki.openstreetmap.org/wiki/Fortaleza/PMF_Addresses_Import/Import_Guide>

[\[2\]](https://wiki.openstreetmap.org/wiki/API_v0.6#:~:text=Creates%20a%20new%20element%20of,osm%3E%60%20element) [\[3\]](https://wiki.openstreetmap.org/wiki/API_v0.6#:~:text=The%20ID%20of%20the%20newly,text%2Fplain) [\[4\]](https://wiki.openstreetmap.org/wiki/API_v0.6#:~:text=Updates%20data%20from%20a%20preexisting,the%20element%20in%20the%20database) API v0.6 - OpenStreetMap Wiki

<https://wiki.openstreetmap.org/wiki/API_v0.6>