"use client";

import Script from "next/script";

export default function GoogleMapsScript() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    return null;
  }

  return (
    <Script
      src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`}
      strategy="lazyOnload"
      onLoad={() => {
        // Dispatch a custom event when Google Maps base API is loaded
        // The Places library will be loaded dynamically via importLibrary
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("google-maps-loaded"));
        }
      }}
    />
  );
}

