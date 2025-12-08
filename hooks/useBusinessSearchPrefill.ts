"use client";

import { useCallback, useState } from "react";
import type { FieldValues, UseFormSetValue } from "react-hook-form";
import { parseStreetAddress } from "@/lib/form-helpers";

export type BusinessSearchPlace = {
  name: string;
  address: string;
  addressComponents?: {
    street?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
  };
};

type AddressFields = {
  businessName: string;
  street?: string | null;
  housenumber?: string | null;
  suburb?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type UseBusinessSearchPrefillOptions<FormValues extends AddressFields & FieldValues> = {
  setValue: UseFormSetValue<FormValues>;
};

export function useBusinessSearchPrefill<FormValues extends AddressFields & FieldValues>({
  setValue,
}: UseBusinessSearchPrefillOptions<FormValues>) {
  const [geocoding, setGeocoding] = useState(false);
  const [geocodingAttribution, setGeocodingAttribution] = useState<string | null>(null);

  const handlePlaceSelect = useCallback(
    async (place: BusinessSearchPlace) => {
      setValue("businessName", place.name);

      if (place.addressComponents) {
        if (place.addressComponents.street?.trim()) {
          const parsed = parseStreetAddress(place.addressComponents.street.trim());
          if (parsed.houseNumber) {
            setValue("housenumber", parsed.houseNumber);
          }
          setValue("street", parsed.street);
        }
        if (place.addressComponents.suburb) {
          setValue("suburb", place.addressComponents.suburb);
        }
        if (place.addressComponents.city) {
          setValue("city", place.addressComponents.city);
        }
        if (place.addressComponents.state) {
          setValue("state", place.addressComponents.state);
        }
        if (place.addressComponents.postcode) {
          setValue("postcode", place.addressComponents.postcode);
        }
      }

      setGeocoding(true);
      setGeocodingAttribution(null);

      try {
        const response = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: place.address }),
        });

        if (response.ok) {
          const data = await response.json();
          const latitude = (typeof data.latitude === "number" ? data.latitude : undefined) as FormValues["latitude"];
          const longitude = (typeof data.longitude === "number" ? data.longitude : undefined) as FormValues["longitude"];
          setValue("latitude", latitude);
          setValue("longitude", longitude);

          if (data.attribution) {
            setGeocodingAttribution(data.attribution);
          }

          if (data.address) {
            if (!place.addressComponents?.street && data.address.street) {
              const parsed = parseStreetAddress(data.address.street);
              if (parsed.houseNumber) {
                setValue("housenumber", parsed.houseNumber);
              }
              setValue("street", parsed.street);
            }
            if (!place.addressComponents?.suburb && data.address.suburb) {
              setValue("suburb", data.address.suburb);
            }
            if (!place.addressComponents?.postcode && data.address.postcode) {
              setValue("postcode", data.address.postcode);
            }
            if (!place.addressComponents?.state && data.address.state) {
              setValue("state", data.address.state);
            }
            if (!place.addressComponents?.city && data.address.city) {
              setValue("city", data.address.city);
            }
          }
        }
      } catch {
        // Geocoding failures are non-blocking; allow manual entry.
      } finally {
        setGeocoding(false);
      }
    },
    [setValue]
  );

  return {
    handlePlaceSelect,
    geocoding,
    geocodingAttribution,
  };
}

