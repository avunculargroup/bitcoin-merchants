"use client";

import { useCallback, useState } from "react";
import type { FieldValues, Path, PathValue, UseFormSetValue } from "react-hook-form";
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

  const setFieldValue = useCallback(
    <K extends Path<FormValues>>(field: K, value: PathValue<FormValues, K>) => {
      setValue(field, value);
    },
    [setValue]
  );

  const handlePlaceSelect = useCallback(
    async (place: BusinessSearchPlace) => {
      setFieldValue("businessName", place.name as PathValue<FormValues, "businessName">);

      if (place.addressComponents) {
        if (place.addressComponents.street?.trim()) {
          const parsed = parseStreetAddress(place.addressComponents.street.trim());
          if (parsed.houseNumber) {
            setFieldValue("housenumber", parsed.houseNumber as PathValue<FormValues, "housenumber">);
          }
          setFieldValue("street", parsed.street as PathValue<FormValues, "street">);
        }
        if (place.addressComponents.suburb) {
          setFieldValue("suburb", place.addressComponents.suburb as PathValue<FormValues, "suburb">);
        }
        if (place.addressComponents.city) {
          setFieldValue("city", place.addressComponents.city as PathValue<FormValues, "city">);
        }
        if (place.addressComponents.state) {
          setFieldValue("state", place.addressComponents.state as PathValue<FormValues, "state">);
        }
        if (place.addressComponents.postcode) {
          setFieldValue("postcode", place.addressComponents.postcode as PathValue<FormValues, "postcode">);
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
          const latitude = (typeof data.latitude === "number" ? data.latitude : undefined) as PathValue<FormValues, "latitude">;
          const longitude = (typeof data.longitude === "number" ? data.longitude : undefined) as PathValue<FormValues, "longitude">;
          setFieldValue("latitude", latitude);
          setFieldValue("longitude", longitude);

          if (data.attribution) {
            setGeocodingAttribution(data.attribution);
          }

          if (data.address) {
            if (!place.addressComponents?.street && data.address.street) {
              const parsed = parseStreetAddress(data.address.street);
              if (parsed.houseNumber) {
                setFieldValue("housenumber", parsed.houseNumber as PathValue<FormValues, "housenumber">);
              }
              setFieldValue("street", parsed.street as PathValue<FormValues, "street">);
            }
            if (!place.addressComponents?.suburb && data.address.suburb) {
              setFieldValue("suburb", data.address.suburb as PathValue<FormValues, "suburb">);
            }
            if (!place.addressComponents?.postcode && data.address.postcode) {
              setFieldValue("postcode", data.address.postcode as PathValue<FormValues, "postcode">);
            }
            if (!place.addressComponents?.state && data.address.state) {
              setFieldValue("state", data.address.state as PathValue<FormValues, "state">);
            }
            if (!place.addressComponents?.city && data.address.city) {
              setFieldValue("city", data.address.city as PathValue<FormValues, "city">);
            }
          }
        }
      } catch {
        // Geocoding failures are non-blocking; allow manual entry.
      } finally {
        setGeocoding(false);
      }
    },
    [setFieldValue]
  );

  return {
    handlePlaceSelect,
    geocoding,
    geocodingAttribution,
  };
}

