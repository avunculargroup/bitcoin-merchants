# BTCMap Onboarding Portal for Australian Businesses - Detailed Implementation Plan

## 1 Introduction

The goal of this project is to build a **self‑service onboarding portal** that allows Australian vendors and retail businesses to register themselves as accepting Bitcoin and to have that information published on [BTC Map](https://btcmap.org), which uses OpenStreetMap (OSM) data. The portal will be implemented with **Next.js**, **Tailwind CSS** and **ShadUI** for the frontend and will integrate with the **OSM v0.6 API** via a dedicated import account. This document expands on the high‑level design by specifying assumptions about data sources, API integrations, authentication flows, and a proposed deployment architecture.

## 2 Assumptions and Decisions

- **Business search provider:** To make it easy for businesses to find themselves, the portal will use the **Google Places Autocomplete** API for search suggestions. Only the business name and address strings will be used; no proprietary coordinates will be copied into OSM. Once the user selects a place, the address information will be geocoded via the **Nominatim** API (which provides OSM‑licensed geocoding) to obtain coordinates.
- **OSM editing account:** A single **dedicated import account** managed by the company will perform all edits. The public profile of this account will state that it is used for the BTC‑accepting businesses import and link to project documentation, as recommended by OSM import guides[\[1\]](https://wiki.openstreetmap.org/wiki/Fortaleza/PMF_Addresses_Import/Import_Guide#:~:text=,Fortaleza%20City%20Council). The account will authenticate via **OAuth 2.0** using client credentials issued by OSM.
- **Database:** The portal will use a relational database (e.g., **PostgreSQL** via **Supabase** or a managed service) to store submissions, verification tokens and logs. No personally identifiable information about submitters will be written to OSM; only business‑relevant tags will be uploaded.
- **Anti‑spam measures:** The portal will integrate **Google reCAPTCHA** v3 on the client side and verify tokens server‑side. Rate limiting by IP and email‑address verification will be employed.
- **Licensing:** Because Google Places data is not compatible with OSM's ODbL, the portal will use it only for discovery; coordinates and other details stored in OSM will come from user input or OSM‑licensed geocoding. Businesses will grant permission for their submissions to be released under the ODbL.

## 3 System Architecture

### 3.1 Client‑side application

The frontend will be built with **Next.js** (React) using **Server Components** where appropriate. **Tailwind CSS** and **ShadUI** will provide styling and accessible UI components. Key client‑side responsibilities include:

- **Business search and selection:** The home page presents a search input with Google Places Autocomplete. As the user types, the component queries the Google Places API for name suggestions and displays them. When a place is selected, its name and formatted address are populated into the form but no coordinates are used.
- **Geocoding and form pre‑fill:** A call to the server API triggers Nominatim geocoding for the selected address to obtain coordinates. The form pre‑fills the address fields (street, suburb, postcode) and the lat/long fields. The user can adjust details manually.
- **Information collection:** The form collects:
- Business name, description, category (shop=retail, amenity=cafe, etc.).
- Address and contact info (phone, website, email, opening hours).
- Bitcoin acceptance details (on‑chain, Lightning, other networks; whether payments are accepted in store, online, or both).
- Additional tags (e.g., wheelchair access, notes).
- **Captcha and verification:** Before submission, the reCAPTCHA widget obtains a token which is sent to the backend for verification.
- **Confirmation page:** A summary of the data is presented to the user for final review. Upon confirmation, the data is POSTed to the backend endpoint /api/submit.

### 3.2 Server‑side application

Backend logic can reside in Next.js API routes or a separate Node.js service. The server performs several tasks:

- **Verification of Captcha tokens** against Google's reCAPTCHA API. If verification fails, the submission is rejected.
- **Duplicate detection** using the **Overpass API** (an interface for querying OSM). Given the geocoded coordinates, the server will query for existing nodes within a radius (e.g., 25 m) tagged with payment:bitcoin=\* or bitcoin:accepts=yes. If a nearby node exists, the submission is flagged for manual review to avoid duplicates.
- **Changeset creation:** If there is no conflict, the server creates a new OSM **changeset** using the OSM API. A changeset requires an &lt;osm&gt; wrapper and must contain metadata tags such as comment=Added Bitcoin‑accepting business via BTCMap[\[2\]](https://wiki.openstreetmap.org/wiki/API_v0.6#:~:text=Creates%20a%20new%20element%20of,osm%3E%60%20element). The server will open a changeset via POST /api/0.6/changeset/create and receive an ID.
- **Node creation or update:** Within the changeset, the server will create a node with the appropriate latitude and longitude by sending a PUT /api/0.6/node/create request (deprecated synonyms exist). The node XML must be wrapped in an &lt;osm&gt; element and include the changeset attribute[\[2\]](https://wiki.openstreetmap.org/wiki/API_v0.6#:~:text=Creates%20a%20new%20element%20of,osm%3E%60%20element). For example:

&lt;osm&gt;  
&lt;node changeset="123456" lat="-37.8136" lon="144.9631"&gt;  
&lt;tag k="name" v="Sample Shop"/&gt;  
&lt;tag k="shop" v="clothes"/&gt;  
&lt;tag k="payment:bitcoin" v="yes"/&gt;  
&lt;tag k="payment:lightning" v="yes"/&gt;  
&lt;tag k="addr:street" v="Sample Street"/&gt;  
&lt;tag k="addr:city" v="Melbourne"/&gt;  
&lt;tag k="addr:postcode" v="3000"/&gt;  
&lt;!-- additional tags --&gt;  
&lt;/node&gt;  
&lt;/osm&gt;

According to the API documentation, the response returns the new element ID in plain text[\[3\]](https://wiki.openstreetmap.org/wiki/API_v0.6#:~:text=The%20ID%20of%20the%20newly,text%2Fplain); errors such as missing changeset, out‑of‑bounds coordinates or closed changesets are reported via specific status codes[\[4\]](https://wiki.openstreetmap.org/wiki/API_v0.6#:~:text=HTTP%20status%20code%20400%20,exist%2C%20or%20are%20not%20visible). To update an existing node (identified via Overpass), the server will issue a PUT /api/0.6/node/#id request containing the full node representation with updated tags and a version attribute matching the current version[\[5\]](https://wiki.openstreetmap.org/wiki/API_v0.6#:~:text=Updates%20data%20from%20a%20preexisting,the%20element%20in%20the%20database). 5. **Changeset closure:** After creating or updating the node, the server closes the changeset using PUT /api/0.6/changeset/#id/close. Closing is important to avoid leaving open changesets that accumulate multiple unrelated edits. 6. **Database logging:** The submission and the OSM element ID are stored in the internal database for audit and potential future updates. Fields include user email (if collected), submission timestamp, status (pending, uploaded, duplicate), and link to the OSM node. 7. **Email confirmations and notifications:** If optional email verification is enabled, the server sends a confirmation link to the business's email address. Only after the link is clicked will the changeset be created. Additionally, a confirmation email summarises the OSM node link and thanks the business.

### 3.3 Admin and moderation tools

Although the aim is self‑service, moderation is necessary to ensure data quality and adherence to OSM policies. An admin dashboard will allow authorised staff to:

- Review pending submissions flagged as duplicates or suspicious.
- Edit or reject submissions before uploading to OSM.
- Track changesets, submission stats and errors.
- Export logs for compliance audits.

The dashboard can be implemented as a secured Next.js route protected via role‑based authentication (e.g., using **NextAuth.js** with GitHub or Google sign‑in for staff). The admin tool should not expose OSM authentication tokens in the client; all sensitive actions occur server‑side.

### 3.4 Data model and database schema

A minimal relational schema might include tables:

| Table | Key fields | Description |
| --- | --- | --- |
| **submissions** | id (UUID), status, business_name, category, address fields, coordinates, bitcoin_details (JSON), user_email (optional), created_at | Stores each submission before OSM upload. Status values: pending, duplicate, uploaded, rejected. |
| **osm_nodes** | id (serial), osm_id (bigint), submission_id (UUID), version, changeset_id, uploaded_at | Links OSM elements to submissions. |
| **admin_users** | id (serial), email, password_hash, role | Authorised staff for moderation. |

### 3.5 Feature Flag: Typeform Wizard

- A Typeform-style multi-step wizard replaces the legacy all-in-one form when `NEXT_PUBLIC_TYPEFORM_WIZARD_ENABLED=true`.
- The submit page renders `components/forms/TypeformLikeForm` behind the flag and falls back to the existing legacy experience via `LegacySubmitForm` otherwise.
- Both implementations post to `/api/submit` with identical payloads to preserve backend compatibility and enable phased rollout/rollback.

Additional tables (e.g., audit logs, email verifications, rate limits) can be added as needed.

## 4 User Experience Flow

- **Landing page:** Business owners see a simple explanation of BTC Map and a search box. They type their business name, receive suggestions, and select the correct listing.
- **Form completion:** After geocoding, the business information form is presented. The user fills in or confirms details, selects Bitcoin payment methods, agrees to the licence terms, and completes the reCAPTCHA.
- **Preview and submit:** A summary shows the tags that will be added to OSM. The user confirms the submission. The server validates the reCAPTCHA, checks for duplicates, and stores the submission.
- **Verification (optional):** If email verification is enabled, the user must click a link in their email. After verification, the server uploads the data to OSM and returns the new OSM node ID.
- **Success page:** The user receives a thank‑you page with a link to the OSM node and instructions to view their business on BTC Map once the data has propagated. If the submission is a duplicate, the page explains that no changes were made.

## 5 Security, Privacy and Compliance

- **Authentication:** OSM tokens are stored securely on the server. Environment variables or a secrets manager must be used to prevent leaking credentials.
- **Rate limiting:** Use middleware (e.g., express-rate-limit) to prevent abuse. Coupled with reCAPTCHA and email verification, this discourages bots and spammers.
- **Input sanitisation:** All user input should be validated and escaped to prevent injection attacks. Because the portal creates XML for the OSM API, special characters must be safely encoded.
- **GDPR/privacy:** Collect only minimal data (business information and optional email). Provide a privacy policy explaining how data is used, stored and shared. Allow businesses to request deletion or updates via email.
- **OSM licence compliance:** Only user‑provided information and OSM‑licensed geocodes are uploaded. Google Places data is used solely for suggestion and never directly copied to OSM. Each business is uploaded individually (not as a bulk import) to respect OSM's guidelines[\[2\]](https://wiki.openstreetmap.org/wiki/API_v0.6#:~:text=Creates%20a%20new%20element%20of,osm%3E%60%20element).

## 6 Deployment Considerations

- **Hosting:** A cloud provider like **Vercel** or **AWS** can host the Next.js frontend. API routes can run in the same environment or be deployed separately in **AWS Lambda** or **Google Cloud Run** for scalability.
- **Environment configuration:** The following secrets must be configured per environment:
- GOOGLE_PLACES_API_KEY - For search suggestions.
- RECAPTCHA_SECRET_KEY - For server‑side captcha validation.
- OSM_CLIENT_ID, OSM_CLIENT_SECRET, OSM_REFRESH_TOKEN - For OAuth 2.0 access to the OSM API.
- DATABASE_URL - For connecting to the database.
- **Monitoring and logging:** Integrate with services like **Sentry** for error tracking and **Prometheus**/**Grafana** for performance monitoring. Log all OSM API responses for audit.
- **Continuous integration:** Set up automated testing (unit tests for form validation, API route tests), code linting, and deploy preview environments for changes.

## 7 Future Enhancements

- **Multiple search providers:** Add Mapbox or Algolia as alternative search providers to reduce reliance on Google and respect licensing.
- **Dynamic duplication check:** Use machine‑learning or fuzzy string matching to detect duplicates by name and address in addition to geospatial proximity.
- **Multi‑country support:** Expand the portal to other regions by enabling country selection and loading local categories and address formats.
- **User accounts:** Allow repeat submitters to create accounts, saving their business information for easier updates.
- **Community feedback:** Integrate a comment or review mechanism so the community can flag outdated or incorrect entries.

## 8 Conclusion

This detailed implementation plan provides a roadmap for building a robust BTC Map onboarding portal using Next.js, Tailwind CSS and ShadUI. By leveraging Google Places for discovery, Nominatim for geocoding, and the OSM API for editing, the portal empowers business owners to self‑register while ensuring data accuracy and compliance with OSM policies. The proposed architecture emphasises security, data integrity, and user experience, laying the groundwork for a scalable and extensible system.

[\[1\]](https://wiki.openstreetmap.org/wiki/Fortaleza/PMF_Addresses_Import/Import_Guide#:~:text=,Fortaleza%20City%20Council) Fortaleza/PMF Addresses Import/Import Guide - OpenStreetMap Wiki

<https://wiki.openstreetmap.org/wiki/Fortaleza/PMF_Addresses_Import/Import_Guide>

[\[2\]](https://wiki.openstreetmap.org/wiki/API_v0.6#:~:text=Creates%20a%20new%20element%20of,osm%3E%60%20element) [\[3\]](https://wiki.openstreetmap.org/wiki/API_v0.6#:~:text=The%20ID%20of%20the%20newly,text%2Fplain) [\[4\]](https://wiki.openstreetmap.org/wiki/API_v0.6#:~:text=HTTP%20status%20code%20400%20,exist%2C%20or%20are%20not%20visible) [\[5\]](https://wiki.openstreetmap.org/wiki/API_v0.6#:~:text=Updates%20data%20from%20a%20preexisting,the%20element%20in%20the%20database) API v0.6 - OpenStreetMap Wiki

<https://wiki.openstreetmap.org/wiki/API_v0.6>