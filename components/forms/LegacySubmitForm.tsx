"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import BusinessSearch from "@/components/BusinessSearch";
import OpeningHoursInput from "@/components/OpeningHoursInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { defaultValues, formSchema, type FormValues } from "@/lib/form-validation";
import { formatReviewData, normalizeWebsite, parseStreetAddress } from "@/lib/form-helpers";
import { useBusinessSearchPrefill } from "@/hooks/useBusinessSearchPrefill";
import { useAltchaVerification } from "@/hooks/useAltchaVerification";

export default function LegacySubmitForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<any>(null);
  const [showMoreDetail, setShowMoreDetail] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState<FormValues | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { handlePlaceSelect, geocoding, geocodingAttribution } = useBusinessSearchPrefill<FormValues>({
    setValue,
  });

  const { altchaReady, altchaVerified, altchaToken, altchaRef } = useAltchaVerification();

  useEffect(() => {
    if (altchaVerified) {
      setSubmitError(null);
    }
  }, [altchaVerified]);

  const onSubmit = (data: FormValues) => {
    if (!altchaVerified || !altchaToken) {
      setSubmitError("Please complete the ALTCHA verification");
      return;
    }

    setReviewData(data);
    setShowReviewModal(true);
    setSubmitError(null);
  };

  const confirmSubmit = async () => {
    if (!reviewData) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    setShowReviewModal(false);

    try {
      const normalizedWebsite = normalizeWebsite(reviewData.website);

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reviewData,
          website: normalizedWebsite,
          captchaToken: altchaToken,
          bitcoinDetails: {
            onChain: reviewData.onChain,
            lightning: reviewData.lightning,
            lightningContactless: reviewData.lightningContactless,
            lightningOperator:
              reviewData.lightningOperator === "other"
                ? reviewData.lightningOperatorOther
                : reviewData.lightningOperator,
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
              <li>
                After publication, it will soon appear on <a href="https://btcmap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BTCMap.org</a> and other apps.
              </li>
            </ul>
          </div>
          <Button asChild>
            <a href="/map">Return Home</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-20">
      {showReviewModal && reviewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex-shrink-0">
              <h2 className="text-2xl font-bold">Review Your Submission</h2>
              <p className="text-sm text-neutral-dark mt-1">Please review your information before submitting</p>
            </div>
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
              <Button onClick={confirmSubmit} disabled={submitting} className="w-full sm:w-auto">
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
            (data) => onSubmit(data),
            () => {
              setSubmitError("Please fix the errors in the form before submitting. Check the form for highlighted fields.");
            }
          )}
          className="space-y-8"
        >
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
              <p className="text-xs text-neutral-dark mt-2 italic">{geocodingAttribution}</p>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Business Details</h2>
            <div>
              <Label htmlFor="businessName">Business Name *</Label>
              <Input id="businessName" {...register("businessName")} className={errors.businessName ? "border-red-500" : ""} />
              {errors.businessName && <p className="text-sm text-red-500 mt-1">{errors.businessName.message}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} rows={3} />
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
              {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>}
            </div>
          </div>

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
                    const currentHouseNumber = watch("housenumber");
                    if (parsed.houseNumber && !currentHouseNumber) {
                      setValue("housenumber", parsed.houseNumber);
                    }
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

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Bitcoin Acceptance *</h2>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="onChain" checked={watch("onChain")} onCheckedChange={(checked) => setValue("onChain", checked === true)} />
                <Label htmlFor="onChain">On-chain Bitcoin</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="lightning" checked={watch("lightning")} onCheckedChange={(checked) => setValue("lightning", checked === true)} />
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
                    <option value="">Select an operator</option>
                    <option value="square">Square</option>
                    <option value="wos">WOS</option>
                    <option value="bitaroo">Bitaroo</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.lightningOperator && <p className="text-sm text-red-500 mt-1">{errors.lightningOperator.message}</p>}
                  {watch("lightningOperator") === "other" && (
                    <div className="mt-2">
                      <Label htmlFor="lightningOperatorOther">Other Lightning Operator</Label>
                      <Input id="lightningOperatorOther" {...register("lightningOperatorOther")} placeholder="Enter operator name" />
                      {errors.lightningOperatorOther && <p className="text-sm text-red-500 mt-1">{errors.lightningOperatorOther.message}</p>}
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox id="inStore" checked={watch("inStore")} onCheckedChange={(checked) => setValue("inStore", checked === true)} />
                <Label htmlFor="inStore">Accept in-store</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="online" checked={watch("online")} onCheckedChange={(checked) => setValue("online", checked === true)} />
                <Label htmlFor="online">Accept online</Label>
              </div>
            </div>
            {errors.onChain && <p className="text-sm text-red-500 mt-2">{errors.onChain.message}</p>}
          </div>

          <div className="border-t pt-8">
            {!showMoreDetail ? (
              <Button type="button" variant="outline" onClick={() => setShowMoreDetail(true)} className="w-full justify-between" aria-expanded="false">
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
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Contact Information (Optional)</h3>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...register("phone")} />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" type="text" {...register("website")} />
                    {errors.website && <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register("email")} />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
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

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Additional Information</h3>
                  <div>
                    <OpeningHoursInput
                      id="openingHours"
                      name="openingHours"
                      value={watch("openingHours") || ""}
                      onChange={(value) => setValue("openingHours", value)}
                      onBlur={() => {}}
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

          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox id="licenseAgreement" checked={watch("licenseAgreement")} onCheckedChange={(checked) => setValue("licenseAgreement", checked === true)} />
              <Label htmlFor="licenseAgreement" className="text-sm">
                I agree that my submission will be released under the Open Database License (ODbL) and published on OpenStreetMap.
              </Label>
            </div>
            {errors.licenseAgreement && <p className="text-sm text-red-500">{errors.licenseAgreement.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Verification</Label>
            {altchaReady ? (
              <>
                {/* @ts-ignore - altcha-widget is a web component */}
                <altcha-widget ref={altchaRef} name="altcha" challengeurl="/api/altcha/challenge" />
                {altchaVerified ? (
                  <p className="text-sm text-green-600 font-medium">✓ Verification complete</p>
                ) : (
                  <p className="text-sm text-neutral-dark">Please complete the verification above before submitting.</p>
                )}
              </>
            ) : (
              <div className="border border-input rounded-md p-4 bg-neutral-light">
                <p className="text-sm text-neutral-dark">Loading verification...</p>
              </div>
            )}
          </div>

          {submitError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{submitError}</div>}

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

          <Button type="submit" size="lg" disabled={submitting || !altchaVerified} className="w-full">
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
  );
}
