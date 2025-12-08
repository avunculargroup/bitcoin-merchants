"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

type AltchaHookReturn = {
  altchaReady: boolean;
  altchaVerified: boolean;
  altchaToken: string | null;
  altchaRef: RefObject<any>;
  resetAltcha: () => void;
};

/**
 * Shared ALTCHA verification hook used by both the legacy form and the new wizard.
 * Handles readiness polling, verification events, and token tracking.
 */
export function useAltchaVerification(): AltchaHookReturn {
  const [altchaReady, setAltchaReady] = useState(false);
  const [altchaVerified, setAltchaVerified] = useState(false);
  const [altchaToken, setAltchaToken] = useState<string | null>(null);
  const altchaRef = useRef<any>(null);

  // Wait for ALTCHA custom element to be defined
  useEffect(() => {
    const checkAltchaReady = () => {
      if (customElements.get("altcha-widget")) {
        setAltchaReady(true);
      } else {
        setTimeout(checkAltchaReady, 100);
      }
    };

    checkAltchaReady();

    customElements.whenDefined("altcha-widget").then(() => {
      setAltchaReady(true);
    });
  }, []);

  // Set up ALTCHA event listeners and polling
  useEffect(() => {
    if (!altchaReady) return;

    const handleAltchaVerify = (event: Event) => {
      const customEvent = event as CustomEvent;
      const target = event.target as any;
      const token =
        customEvent.detail?.solution ||
        target?.solution ||
        target?.value ||
        (target?.shadowRoot?.querySelector('input[type="hidden"]') as HTMLInputElement)?.value;

      if (token) {
        setAltchaToken(token);
        setAltchaVerified(true);
      }
    };

    const handleAltchaError = () => {
      setAltchaToken(null);
      setAltchaVerified(false);
    };

    const altchaElement = document.querySelector("altcha-widget") as any;

    if (altchaElement) {
      altchaElement.addEventListener("verify", handleAltchaVerify);
      altchaElement.addEventListener("error", handleAltchaError);
    }

    document.addEventListener("altcha:verify", handleAltchaVerify);
    document.addEventListener("altcha:error", handleAltchaError);

    const checkWidgetState = () => {
      const form = document.querySelector("form");
      const hiddenInput = form?.querySelector('input[name="altcha"][type="hidden"]') as HTMLInputElement;
      const solutionFromInput = hiddenInput?.value;

      let solutionFromWidget = null;
      if (altchaElement) {
        solutionFromWidget =
          altchaElement.solution ||
          altchaElement.getAttribute("solution") ||
          (altchaElement as any).value ||
          (altchaElement.shadowRoot?.querySelector('input[type="hidden"]') as HTMLInputElement)?.value;
      }

      const solution = solutionFromInput || solutionFromWidget;

      if (solution && solution !== altchaToken) {
        setAltchaToken(solution);
        setAltchaVerified(true);
      } else if (!solution && altchaVerified) {
        setAltchaToken(null);
        setAltchaVerified(false);
      }
    };

    const pollInterval = setInterval(checkWidgetState, 500);

    return () => {
      clearInterval(pollInterval);
      if (altchaElement) {
        altchaElement.removeEventListener("verify", handleAltchaVerify);
        altchaElement.removeEventListener("error", handleAltchaError);
      }
      document.removeEventListener("altcha:verify", handleAltchaVerify);
      document.removeEventListener("altcha:error", handleAltchaError);
    };
  }, [altchaReady, altchaToken, altchaVerified]);

  const resetAltcha = () => {
    setAltchaToken(null);
    setAltchaVerified(false);
  };

  return {
    altchaReady,
    altchaVerified,
    altchaToken,
    altchaRef,
    resetAltcha,
  };
}

