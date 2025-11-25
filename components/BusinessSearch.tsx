"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

// Type alias for PlacesLibrary to avoid namespace resolution issues
type PlaceInstance = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  addressComponents?: Array<{
    longName: string;
    shortName: string;
    types: string[];
  }>;
  fetchFields(request: { fields: string[] }): Promise<void>;
};

type PlaceConstructor = {
  new (options: { id: string }): PlaceInstance;
  searchByText(request: {
    textQuery: string;
    maxResultCount?: number;
    fields?: string[];
  }): Promise<{ places: any[] }>;
};

type PlacesLibrary = {
  Place: PlaceConstructor;
};

interface PlacePrediction {
  id: string;
  displayName: { text: string };
}

interface BusinessSearchProps {
  onPlaceSelect: (place: { 
    name: string; 
    address: string; 
    addressComponents?: {
      street: string;
      suburb: string;
      city: string;
      state: string;
      postcode: string;
    };
  }) => void;
}

export default function BusinessSearch({ onPlaceSelect }: BusinessSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const PlaceClass = useRef<PlaceConstructor | null>(null);
  const isGoogleMapsReady = useRef(false);

  useEffect(() => {
    const initializePlacesLibrary = async () => {
      if (typeof window === "undefined" || !window.google?.maps) {
        return false;
      }

      try {
        // Check if importLibrary is available (new loader)
        if (!google.maps.importLibrary) {
          console.warn("importLibrary not available - Google Maps API may need new loader");
          return false;
        }
        
        // Load the Places library dynamically using the new importLibrary method
        const placesLibrary = await google.maps.importLibrary("places") as PlacesLibrary;
        const { Place } = placesLibrary;
        PlaceClass.current = Place;
        isGoogleMapsReady.current = true;
        console.log("Places library initialized successfully");
        return true;
      } catch (error) {
        console.error("Failed to initialize Places library:", error);
        return false;
      }
    };

    // Try to initialize immediately (in case script is already loaded)
    initializePlacesLibrary();

    // Poll for Google Maps API to be available
    let checkCount = 0;
    const maxChecks = 100; // 10 seconds max (100 * 100ms)
    const checkInterval = setInterval(() => {
      checkCount++;
      initializePlacesLibrary().then((success) => {
        if (success) {
          clearInterval(checkInterval);
        } else if (checkCount >= maxChecks) {
          console.error("Failed to initialize Places library after", checkCount, "attempts");
          clearInterval(checkInterval);
        }
      });
    }, 100);

    // Also listen for the script load event (backup)
    const handleLoad = async () => {
      console.log("Google Maps loaded event received");
      const success = await initializePlacesLibrary();
      if (success) {
        clearInterval(checkInterval);
      }
    };
    window.addEventListener("google-maps-loaded", handleLoad);

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener("google-maps-loaded", handleLoad);
    };
  }, []);

  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!PlaceClass.current || !isGoogleMapsReady.current) {
      console.log("Places library not ready yet, query:", query);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        // Use the new Place.searchByText() method with Promises
        // The new API requires fields to be specified as an array
        const request: {
          textQuery: string;
          maxResultCount?: number;
          fields?: string[];
        } = {
          textQuery: `${query} Australia`, // Add Australia to query for country restriction
          maxResultCount: 5, // Limit results
          fields: ["id", "displayName"], // Required: specify which fields to return
        };

        const { places } = await PlaceClass.current!.searchByText(request);
        
        setLoading(false);
        if (places && places.length > 0) {
          // Debug: log the structure of the first place
          if (places[0]) {
            console.log("Place object structure:", places[0]);
            console.log("Place displayName:", places[0].displayName);
          }
          
          // Map places to our PlacePrediction interface
          // Handle different possible structures
          const mappedPlaces = places.map((place: any) => {
            let displayText = "Unknown";
            if (place.displayName?.text) {
              displayText = place.displayName.text;
            } else if (place.displayName) {
              displayText = String(place.displayName);
            } else if (place.formattedAddress) {
              displayText = place.formattedAddress;
            } else if (place.name) {
              displayText = place.name;
            }
            
            return {
              id: place.id,
              displayName: { text: displayText },
            };
          });
          setSuggestions(mappedPlaces);
          setShowSuggestions(true);
        } else {
          console.log("No places found for query:", query);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error("Error searching places:", error);
        setLoading(false);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handlePlaceSelect = async (placeId: string, displayName: string) => {
    // Immediately hide dropdown and clear suggestions
    setShowSuggestions(false);
    setSuggestions([]);
    
    if (!PlaceClass.current || !isGoogleMapsReady.current) {
      console.error("Places library not available");
      // Fallback: use displayName as-is
      onPlaceSelect({
        name: displayName.split(",")[0],
        address: displayName,
      });
      setQuery(displayName);
      return;
    }

    try {
      // Use the new Place.fetchFields() method with Promises
      const place = new PlaceClass.current({ id: placeId });
      
      const request: {
        fields: string[];
      } = {
        fields: ["displayName", "formattedAddress", "addressComponents"],
      };

      await place.fetchFields(request);

      // Access fields using camelCase (new API format)
      const addressComponents = place.addressComponents || [];
      const getComponent = (type: string) => {
        const component = addressComponents.find((c: any) => c.types.includes(type));
        return component?.longName || "";
      };
      const streetNumber = getComponent("street_number");
      const route = getComponent("route");
      const street = [streetNumber, route].filter(Boolean).join(" ").trim();
      
      const placeName = place.displayName?.text || (typeof displayName === 'string' ? displayName.split(",")[0] : "Unknown");
      const placeAddress = place.formattedAddress || (typeof displayName === 'string' ? displayName : "Unknown");
      
      onPlaceSelect({
        name: placeName,
        address: placeAddress,
        addressComponents: {
          street: street || "",
          suburb: getComponent("locality") || getComponent("sublocality") || "",
          city: getComponent("locality") || getComponent("administrative_area_level_2") || "",
          state: getComponent("administrative_area_level_1") || "",
          postcode: getComponent("postal_code") || "",
        },
      });
      setQuery(placeAddress);
    } catch (error) {
      console.error("Error fetching place details:", error);
      // Fallback: use displayName as-is (with safety check)
      const fallbackName = typeof displayName === 'string' ? displayName.split(",")[0] : "Unknown";
      const fallbackAddress = typeof displayName === 'string' ? displayName : "Unknown";
      onPlaceSelect({
        name: fallbackName,
        address: fallbackAddress,
      });
      setQuery(fallbackAddress);
    }
  };

  // Close dropdown when clicking outside
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  return (
    <div className="relative" ref={containerRef}>
      <Input
        type="text"
        placeholder="Search for your business..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={(e) => {
          // Delay hiding to allow click events to fire first
          setTimeout(() => {
            if (!containerRef.current?.contains(document.activeElement)) {
              setShowSuggestions(false);
            }
          }, 200);
        }}
        className="w-full"
      />
      {loading && (
        <div className="absolute right-3 top-3">
          <Loader2 className="h-4 w-4 animate-spin text-neutral-dark" />
        </div>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-neutral-dark/20 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => {
            const displayText = suggestion.displayName?.text || "Unknown";
            return (
              <li
                key={suggestion.id}
                onMouseDown={(e) => {
                  // Prevent onBlur from firing before onClick
                  e.preventDefault();
                }}
                onClick={() => handlePlaceSelect(suggestion.id, displayText)}
                className="px-4 py-2 hover:bg-neutral cursor-pointer text-sm"
              >
                {displayText}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

