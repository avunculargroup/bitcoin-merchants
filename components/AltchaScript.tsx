"use client";

import { useEffect } from "react";

export default function AltchaScript() {
  useEffect(() => {
    // Dynamically import ALTCHA to register the web component
    import("altcha").catch((error) => {
      console.error("Failed to load ALTCHA:", error);
    });
  }, []);

  return null;
}

