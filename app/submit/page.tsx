"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { env } from "@/lib/env";
import Breadcrumbs from "@/components/Breadcrumbs";
import BusinessSearch from "@/components/BusinessSearch";
import OpeningHoursInput from "@/components/OpeningHoursInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

const websiteDomainPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i;

const normalizeWebsite = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^http:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

const formSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  street: z.string().optional(),
  housenumber: z.string().optional(),
  suburb: z.string().optional(),
  postcode: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  website: z
    .string()
    .trim()
    .refine(
      (value) => {
        if (!value) return true;
        return websiteDomainPattern.test(value);
      },
      { message: "Must be a valid website (domain + TLD)" }
    )
    .optional(),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  onChain: z.boolean(),
  lightning: z.boolean(),
  lightningContactless: z.boolean(),
  lightningOperator: z.string().optional(),
  lightningOperatorOther: z.string().optional(),
  other: z.array(z.string()),
  inStore: z.boolean(),
  online: z.boolean(),
  openingHours: z.string().optional(),
  wheelchair: z.string().optional(),
  notes: z.string().optional(),
  licenseAgreement: z.boolean().refine((val) => val === true, {
    message: "You must agree to the license terms",
  }),
}).refine(
  (data) => {
    // At least one Bitcoin acceptance method must be selected
    return (
      data.onChain ||
      data.lightning ||
      data.lightningContactless ||
      data.inStore ||
      data.online ||
      (data.other && data.other.length > 0)
    );
  },
  {
    message: "Please select at least one Bitcoin acceptance method",
    path: ["onChain"], // This will show the error on the Bitcoin Acceptance section
  }
);

type FormData = z.infer<typeof formSchema>;

export default function SubmitPage() {
  const [selectedPlace, setSelectedPlace] = useState<{ name: string; address: string } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodingAttribution, setGeocodingAttribution] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<any>(null);
  const [altchaToken, setAltchaToken] = useState<string | null>(null);
  const [altchaVerified, setAltchaVerified] = useState(false);
  const [altchaReady, setAltchaReady] = useState(false);
  const [showMoreDetail, setShowMoreDetail] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState<FormData | null>(null);
  const altchaRef = useRef<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      onChain: false,
      lightning: false,
      lightningContactless: false,
      lightningOperator: "",
      lightningOperatorOther: "",
      other: [],
      inStore: false,
      online: false,
      licenseAgreement: false,
    },
  });

  // Wait for ALTCHA custom element to be defined
  useEffect(() => {
    const checkAltchaReady = () => {
      if (customElements.get('altcha-widget')) {
        setAltchaReady(true);
      } else {
        // Check again after a short delay
        setTimeout(checkAltchaReady, 100);
      }
    };

    // Start checking
    checkAltchaReady();

    // Also listen for when the element is defined
    customElements.whenDefined('altcha-widget').then(() => {
      setAltchaReady(true);
    });
  }, []);

  // Set up ALTCHA event listeners and polling
  useEffect(() => {
    if (!altchaReady) return;

    const handleAltchaVerify = (event: Event) => {
      const customEvent = event as CustomEvent;
      // ALTCHA solution can be in event.detail or event.target.solution
      const token = customEvent.detail?.solution || 
                   (customEvent.target as any)?.solution ||
                   (event.target as any)?.solution;
      if (token) {
        setAltchaToken(token);
        setAltchaVerified(true);
        setSubmitError(null); // Clear any previous errors
      }
    };

    const handleAltchaError = () => {
      setAltchaVerified(false);
      setAltchaToken(null);
    };

    // ALTCHA widget emits events on the element itself
    // Listen for both element-specific and document-level events
    const altchaElement = document.querySelector('altcha-widget') as any;
    
    if (altchaElement) {
      altchaElement.addEventListener("verify", handleAltchaVerify);
      altchaElement.addEventListener("error", handleAltchaError);
    }

    // Also listen at document level as fallback
    document.addEventListener("altcha:verify", handleAltchaVerify);
    document.addEventListener("altcha:error", handleAltchaError);

    // Poll the widget element and form to check for solution
    // This is a fallback in case events aren't firing
    const checkWidgetState = () => {
      // Check the hidden input field that ALTCHA adds to the form
      const form = document.querySelector('form');
      const hiddenInput = form?.querySelector('input[name="altcha"][type="hidden"]') as HTMLInputElement;
      const solutionFromInput = hiddenInput?.value;
      
      // Also try to access from the widget element
      let solutionFromWidget = null;
      if (altchaElement) {
        solutionFromWidget = 
          altchaElement.solution ||
          altchaElement.getAttribute('solution') ||
          (altchaElement as any).value ||
          (altchaElement.shadowRoot?.querySelector('input[type="hidden"]') as HTMLInputElement)?.value;
      }
      
      const solution = solutionFromInput || solutionFromWidget;
      
      if (solution && solution !== altchaToken) {
        setAltchaToken(solution);
        setAltchaVerified(true);
        setSubmitError(null);
      } else if (!solution && altchaVerified) {
        // If we had a solution but it's gone, reset state
        setAltchaToken(null);
        setAltchaVerified(false);
      }
    };

    // Poll every 500ms to check widget state
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

  // Parse street address to extract house number
  const parseStreetAddress = (streetValue: string): { houseNumber: string; street: string } => {
    if (!streetValue || !streetValue.trim()) {
      return { houseNumber: "", street: "" };
    }

    const trimmed = streetValue.trim();
    
    // Pattern to match house numbers at the start:
    // - Can be digits with optional letters (e.g., "123", "45A", "12B")
    // - Can be ranges (e.g., "218-220", "12-14")
    // - Can include units (e.g., "123/45", "12A/14")
    // Matches: "218-220", "123", "45A", "12-14", "123/45", etc. followed by space and street name
    const houseNumberPattern = /^(\d+[A-Za-z]?(?:\s*[-/]\s*\d+[A-Za-z]?)?)\s+(.+)$/;
    const match = trimmed.match(houseNumberPattern);
    
    if (match && match[1] && match[2]) {
      return {
        houseNumber: match[1].trim(),
        street: match[2].trim(),
      };
    }
    
    // If no house number pattern found, return the whole thing as street
    return { houseNumber: "", street: trimmed };
  };

  const handlePlaceSelect = async (place: { name: string; address: string; addressComponents?: any }) => {
    setSelectedPlace(place);
    setValue("businessName", place.name);

    // First, populate address fields from Google Places components (if available)
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

    // Then geocode the address to get OSM-licensed coordinates
    // Note: This is non-blocking - if geocoding fails, user can still submit
    // Rate limiting is now handled in the API route
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
        setValue("latitude", data.latitude);
        setValue("longitude", data.longitude);
        
        // Store attribution for display
        if (data.attribution) {
          setGeocodingAttribution(data.attribution);
        }
        
        // Use Nominatim address components if Google Places didn't provide them
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
      } else {
        // Geocoding failed, but it's non-critical - continue without coordinates
      }
    } catch (error) {
      // Geocoding error is non-critical - continue without coordinates
    } finally {
      setGeocoding(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    // Validate ALTCHA is verified
    if (!altchaVerified || !altchaToken) {
      setSubmitError("Please complete the ALTCHA verification");
      return;
    }

    // Show review modal instead of submitting directly
    setReviewData(data);
    setShowReviewModal(true);
    setSubmitError(null);
  };

  // Helper function to format data for review
  const formatReviewData = (data: FormData) => {
    const bitcoinMethods = [];
    if (data.onChain) bitcoinMethods.push("On-chain Bitcoin");
    if (data.lightning) bitcoinMethods.push("Lightning Network");
    if (data.lightningContactless) bitcoinMethods.push("Lightning Contactless");
    if (data.other && data.other.length > 0) bitcoinMethods.push(...data.other);
    
    const acceptanceLocations = [];
    if (data.inStore) acceptanceLocations.push("In-store");
    if (data.online) acceptanceLocations.push("Online");

    const addressParts = [
      data.housenumber,
      data.street,
      data.suburb,
      data.city,
      data.state,
      data.postcode,
    ].filter(Boolean);

    // Format category - remove prefix if present (e.g., "shop=cafe" -> "cafe")
    const formatCategory = (category?: string) => {
      if (!category) return "Not provided";
      if (category.startsWith("shop=")) {
        return category.replace("shop=", "");
      }
      if (category.startsWith("amenity=")) {
        return category.replace("amenity=", "");
      }
      return category;
    };

    return {
      businessName: data.businessName,
      description: data.description,
      category: formatCategory(data.category),
      address: addressParts.length > 0 ? addressParts.join(", ") : "Not provided",
      coordinates: data.latitude && data.longitude 
        ? `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`
        : "Not provided",
      phone: data.phone || "Not provided",
      website: data.website || "Not provided",
      email: data.email || "Not provided",
      facebook: data.facebook || "Not provided",
      instagram: data.instagram || "Not provided",
      bitcoinMethods: bitcoinMethods.length > 0 ? bitcoinMethods.join(", ") : "None selected",
      lightningOperator: data.lightningOperator === "other" 
        ? data.lightningOperatorOther 
        : data.lightningOperator || "Not provided",
      acceptanceLocations: acceptanceLocations.length > 0 ? acceptanceLocations.join(", ") : "None selected",
      openingHours: data.openingHours || "Not provided",
      wheelchair: data.wheelchair || "Not provided",
      notes: data.notes || "Not provided",
    };
  };

  const confirmSubmit = async () => {
    if (!reviewData) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    setShowReviewModal(false);

    try {
      const captchaToken = altchaToken;
      const normalizedWebsite = normalizeWebsite(reviewData.website);

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reviewData,
          website: normalizedWebsite,
          captchaToken,
          bitcoinDetails: {
            onChain: reviewData.onChain,
            lightning: reviewData.lightning,
            lightningContactless: reviewData.lightningContactless,
            lightningOperator: reviewData.lightningOperator === "other" ? reviewData.lightningOperatorOther : reviewData.lightningOperator,
            other: reviewData.other,
            inStore: reviewData.inStore,
            online: reviewData.online,
          },
          housenumber: reviewData.housenumber,
          facebook: reviewData.facebook,
          instagram: reviewData.instagram,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitSuccess(result);
      } else {
        // Show more detailed error message
        const errorMessage = result.error || result.message || result.details || "Failed to submit. Please try again or contact support if the problem persists.";
        setSubmitError(errorMessage);
      }
    } catch (error: any) {
      setSubmitError(error.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="container py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4 text-secondary">Submission Received!</h1>
          <p className="text-lg mb-6">{submitSuccess.message}</p>
          <div className="bg-neutral-light p-6 rounded-lg mb-6 text-left">
            <h3 className="font-semibold mb-2">What happens next?</h3>
            <ul className="list-disc list-inside space-y-2 text-neutral-dark">
              <li>Your submission will be reviewed by our team (usually within 4 business hours).</li>
              <li>Once approved, it will be published to OpenStreetMap.</li>
              <li>After publication, it will soon appear on <a href="https://btcmap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BTCMap.org</a> and other apps.</li>
            </ul>
          </div>
          <Button asChild>
            <a href="/map">Return Home</a>
          </Button>
        </div>
      </div>
    );
  }

  const baseUrl = env.appUrl;
  
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Business Registration Service",
    "description": "Free service to register Australian businesses accepting Bitcoin payments on OpenStreetMap and BTCMap",
    "provider": {
      "@type": "Organization",
      "name": "Aussie Bitcoin Merchants",
      "url": baseUrl,
    },
    "areaServed": {
      "@type": "Country",
      "name": "Australia",
    },
    "serviceType": "Business Listing",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "AUD",
    },
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Add Your Business", href: "/submit" },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      {/* Review Modal */}
      {showReviewModal && reviewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b flex-shrink-0">
              <h2 className="text-2xl font-bold">Review Your Submission</h2>
              <p className="text-sm text-neutral-dark mt-1">Please review your information before submitting</p>
            </div>

            {/* Scrollable Content */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {(() => {
                const formatted = formatReviewData(reviewData);
                return (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-neutral-dark mb-1">Business Name</h3>
                      <p className="text-neutral-dark">{formatted.businessName}</p>
                    </div>

                    {formatted.description && (
                      <div>
                        <h3 className="font-semibold text-neutral-dark mb-1">Description</h3>
                        <p className="text-neutral-dark">{formatted.description}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-neutral-dark mb-1">Category</h3>
                      <p className="text-neutral-dark">{formatted.category}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-neutral-dark mb-1">Address</h3>
                      <p className="text-neutral-dark">{formatted.address}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-neutral-dark mb-1">Coordinates</h3>
                      <p className="text-neutral-dark text-sm">{formatted.coordinates}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-neutral-dark mb-1">Contact Information</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-neutral-dark">Phone:</span> {formatted.phone}</p>
                        <p><span className="text-neutral-dark">Website:</span> {formatted.website}</p>
                        <p><span className="text-neutral-dark">Email:</span> {formatted.email}</p>
                        <p><span className="text-neutral-dark">Facebook:</span> {formatted.facebook}</p>
                        <p><span className="text-neutral-dark">Instagram:</span> {formatted.instagram}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-neutral-dark mb-1">Bitcoin Payment Methods</h3>
                      <p className="text-neutral-dark">{formatted.bitcoinMethods}</p>
                    </div>

                    {formatted.lightningOperator !== "Not provided" && (
                      <div>
                        <h3 className="font-semibold text-neutral-dark mb-1">Lightning Operator</h3>
                        <p className="text-neutral-dark">{formatted.lightningOperator}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-neutral-dark mb-1">Acceptance Locations</h3>
                      <p className="text-neutral-dark">{formatted.acceptanceLocations}</p>
                    </div>

                    {formatted.openingHours !== "Not provided" && (
                      <div>
                        <h3 className="font-semibold text-neutral-dark mb-1">Opening Hours</h3>
                        <p className="text-neutral-dark">{formatted.openingHours}</p>
                      </div>
                    )}

                    {formatted.wheelchair !== "Not provided" && (
                      <div>
                        <h3 className="font-semibold text-neutral-dark mb-1">Wheelchair Access</h3>
                        <p className="text-neutral-dark">{formatted.wheelchair}</p>
                      </div>
                    )}

                    {formatted.notes !== "Not provided" && (
                      <div>
                        <h3 className="font-semibold text-neutral-dark mb-1">Additional Notes</h3>
                        <p className="text-neutral-dark">{formatted.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer with buttons */}
            <div className="px-6 py-4 border-t flex-shrink-0 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewData(null);
                }}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmSubmit}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Confirm & Submit"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container py-20">
        <div className="max-w-3xl mx-auto">
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" aria-hidden="true" />
            <p className="text-sm md:text-base">
              Please use this form only for businesses that customers can visit in person (shops, cafés, offices, etc.).{" "}
              If the business operates only online or by private appointment, please{" "}
              <a href="/contact" className="font-semibold text-primary underline">
                email us
              </a>{" "}
              instead.
            </p>
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-8">Add Your Business</h1>

        <form 
          onSubmit={handleSubmit(
            (data) => {
              onSubmit(data);
            },
            (errors) => {
              setSubmitError("Please fix the errors in the form before submitting. Check the form for highlighted fields.");
            }
          )} 
          className="space-y-8"
        >
          {/* Business Search */}
          <div>
            <Label htmlFor="search">Search for your business (optional)</Label>
            <BusinessSearch onPlaceSelect={handlePlaceSelect} />
            {geocoding && (
              <p className="text-sm text-neutral-dark mt-2">
                <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                Geocoding address...
              </p>
            )}
            {geocodingAttribution && !geocoding && (
              <p className="text-xs text-neutral-dark mt-2 italic">
                {geocodingAttribution}
              </p>
            )}
          </div>

          {/* Business Details */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Business Details</h2>
            <div>
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                {...register("businessName")}
                className={errors.businessName ? "border-red-500" : ""}
              />
              {errors.businessName && (
                <p className="text-sm text-red-500 mt-1">{errors.businessName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                {...register("category")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a category</option>
                <option value="shop=retail">Retail</option>
                <option value="amenity=cafe">Cafe</option>
                <option value="amenity=restaurant">Restaurant</option>
                <option value="shop=supermarket">Supermarket</option>
                <option value="shop=clothes">Clothing</option>
                <option value="shop=electronics">Electronics</option>
                <option value="amenity=bar">Bar</option>
                <option value="amenity=pub">Pub</option>
                <option value="shop=convenience">Convenience Store</option>
                <option value="other">Other</option>
              </select>
              {errors.category && (
                <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="housenumber">House Number</Label>
                <Input id="housenumber" {...register("housenumber")} />
              </div>
              <div>
                <Label htmlFor="street">Street</Label>
                <Input
                  id="street"
                  {...register("street")}
                  onBlur={(e) => {
                    const value = e.target.value;
                    const parsed = parseStreetAddress(value);
                    // Only auto-fill house number if it's currently empty and we found one
                    const currentHouseNumber = watch("housenumber");
                    if (parsed.houseNumber && !currentHouseNumber) {
                      setValue("housenumber", parsed.houseNumber);
                    }
                    // Update street field to remove house number if it was parsed
                    if (parsed.houseNumber && parsed.street) {
                      setValue("street", parsed.street, { shouldValidate: false });
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="suburb">Suburb</Label>
                <Input id="suburb" {...register("suburb")} />
              </div>
              <div>
                <Label htmlFor="postcode">Postcode</Label>
                <Input id="postcode" {...register("postcode")} />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" {...register("state")} />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register("city")} />
              </div>
            </div>
          </div>

          {/* Bitcoin Acceptance */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Bitcoin Acceptance *</h2>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="onChain"
                  checked={watch("onChain")}
                  onCheckedChange={(checked) => setValue("onChain", checked === true)}
                />
                <Label htmlFor="onChain">On-chain Bitcoin</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lightning"
                  checked={watch("lightning")}
                  onCheckedChange={(checked) => setValue("lightning", checked === true)}
                />
                <Label htmlFor="lightning">Lightning Network</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lightningContactless"
                  checked={watch("lightningContactless")}
                  onCheckedChange={(checked) => setValue("lightningContactless", checked === true)}
                />
                <Label htmlFor="lightningContactless">Lightning Contactless (NFC)</Label>
              </div>
              {watch("lightning") && (
                <div>
                  <Label htmlFor="lightningOperator">Lightning Operator</Label>
                  <select
                    id="lightningOperator"
                    {...register("lightningOperator")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                  >
                    <option value="">Not specified</option>
                    <option value="square">Square</option>
                    <option value="wos">WOS</option>
                    <option value="bitaroo">Bitaroo</option>
                    <option value="other">Other</option>
                  </select>
                  {watch("lightningOperator") === "other" && (
                    <div className="mt-2">
                      <Label htmlFor="lightningOperatorOther">Other Lightning Operator</Label>
                      <Input
                        id="lightningOperatorOther"
                        {...register("lightningOperatorOther")}
                        placeholder="Enter operator name"
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inStore"
                  checked={watch("inStore")}
                  onCheckedChange={(checked) => setValue("inStore", checked === true)}
                />
                <Label htmlFor="inStore">Accept in-store</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="online"
                  checked={watch("online")}
                  onCheckedChange={(checked) => setValue("online", checked === true)}
                />
                <Label htmlFor="online">Accept online</Label>
              </div>
            </div>
            {errors.onChain && (
              <p className="text-sm text-red-500 mt-2">{errors.onChain.message}</p>
            )}
          </div>

          {/* More Detail Section - Collapsible */}
          <div className="border-t pt-8">
            {!showMoreDetail ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMoreDetail(true)}
                className="w-full justify-between"
                aria-expanded="false"
              >
                <span>Optional details</span>
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <button
                type="button"
                onClick={() => setShowMoreDetail(false)}
                className="w-full flex items-center justify-between py-4 text-left hover:bg-neutral-light/50 transition-colors rounded-md px-2 -mx-2"
                aria-expanded="true"
              >
                <h2 className="text-2xl font-semibold">More Detail</h2>
                <ChevronUp className="h-5 w-5 text-neutral-dark" aria-hidden="true" />
              </button>
            )}

            {showMoreDetail && (
              <div className="space-y-8 mt-6">
                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Contact Information (Optional)</h3>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...register("phone")} />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" type="text" {...register("website")} />
                    {errors.website && (
                      <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register("email")} />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input id="facebook" {...register("facebook")} placeholder="https://facebook.com/..." />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input id="instagram" {...register("instagram")} placeholder="https://instagram.com/..." />
                  </div>
                </div>

                {/* Additional Tags */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Additional Information</h3>
                  <div>
                    <OpeningHoursInput
                      id="openingHours"
                      name="openingHours"
                      value={watch("openingHours") || ""}
                      onChange={(value) => setValue("openingHours", value)}
                      onBlur={() => {
                        // Trigger validation - openingHours is handled by the component
                      }}
                      error={errors.openingHours?.message}
                    />
                  </div>
                  <div>
                    <Label htmlFor="wheelchair">Wheelchair Access</Label>
                    <select
                      id="wheelchair"
                      {...register("wheelchair")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Not specified</option>
                      <option value="yes">Yes</option>
                      <option value="limited">Limited</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea id="notes" {...register("notes")} rows={3} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* License Agreement */}
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="licenseAgreement"
                checked={watch("licenseAgreement")}
                onCheckedChange={(checked) => setValue("licenseAgreement", checked === true)}
              />
              <Label htmlFor="licenseAgreement" className="text-sm">
                I agree that my submission will be released under the Open Database License (ODbL) and published on OpenStreetMap.
              </Label>
            </div>
            {errors.licenseAgreement && (
              <p className="text-sm text-red-500">{errors.licenseAgreement.message}</p>
            )}
          </div>

          {/* ALTCHA Verification */}
          <div className="space-y-2">
            <Label>Verification</Label>
            {altchaReady ? (
              <>
                {/* @ts-ignore - altcha-widget is a web component */}
                <altcha-widget
                  ref={altchaRef}
                  name="altcha"
                  challengeurl="/api/altcha/challenge"
                />
                {altchaVerified ? (
                  <p className="text-sm text-green-600 font-medium">
                    ✓ Verification complete
                  </p>
                ) : (
                  <p className="text-sm text-neutral-dark">
                    Please complete the verification above before submitting.
                  </p>
                )}
              </>
            ) : (
              <div className="border border-input rounded-md p-4 bg-neutral-light">
                <p className="text-sm text-neutral-dark">
                  Loading verification...
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {submitError}
            </div>
          )}
          
          {/* Show form validation errors summary */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded">
              <p className="font-medium mb-2">Please fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.businessName && <li>{errors.businessName.message}</li>}
                {errors.category && <li>{errors.category.message}</li>}
                {errors.onChain && <li>{errors.onChain.message}</li>}
                {errors.licenseAgreement && <li>{errors.licenseAgreement.message}</li>}
              </ul>
            </div>
          )}

          <Button 
            type="submit" 
            size="lg" 
            disabled={submitting || !altchaVerified} 
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Business"
            )}
          </Button>
        </form>
      </div>
    </div>
    </>
  );
}

