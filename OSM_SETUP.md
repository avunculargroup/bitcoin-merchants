# OSM API Setup Guide

## Getting OAuth Credentials

To use the OSM API, you need to set up OAuth 2.0 credentials:

1. **Create an OAuth Application:**
   - Go to https://www.openstreetmap.org/oauth2/applications
   - Click "Register your application"
   - Fill in:
     - Name: "BTCMap Onboarding Portal"
     - Redirect URIs: `http://localhost:3000/api/auth/callback/osm` (for development)
     - Permissions: Check "modify the map"
   - Click "Register"

2. **Get Your Application Credentials:**
   - After creating the application, you'll see:
     - **Client ID** → Use for `OSM_CLIENT_ID`
     - **Client Secret** → Use for `OSM_CLIENT_SECRET` (this is different from the refresh token!)
   
   These identify your application to OSM.

3. **Get a Refresh Token:**
   - The **Client Secret** and **Refresh Token** are DIFFERENT:
     - **Client Secret** = Your app's password (from application settings)
     - **Refresh Token** = Authorization token (from OAuth flow)
   - You need to complete the OAuth authorization flow to get a refresh token
   - The refresh token is what you store in `OSM_REFRESH_TOKEN`
   - Access tokens expire quickly and are automatically refreshed by the code
   
   **To get a refresh token:**
   - You'll need to complete the OAuth authorization flow
   - This typically involves redirecting to OSM, authorizing your app, and receiving tokens
   - The refresh token is long-lived and allows your app to get new access tokens

## Important Notes

- **Refresh Token vs Access Token:**
  - **Access Token**: Short-lived (expires in hours), used for API calls
  - **Refresh Token**: Long-lived (expires in days/weeks), used to get new access tokens
  - The code automatically uses the refresh token to get access tokens when needed
  - **You need the REFRESH TOKEN in your environment variables**

- **Dedicated Import Account:**
  - As per OSM import guidelines, use a dedicated account for imports
  - The account's public profile should state it's used for BTCMap business imports
  - Link to project documentation in the profile

## Testing Your Credentials

Once you have the credentials set up in `.env.local`, the code will automatically:
1. Use the refresh token to get an access token
2. Cache the access token until it expires
3. Automatically refresh when needed

You can test by making a submission - if the OSM upload fails, check the logs for authentication errors.

