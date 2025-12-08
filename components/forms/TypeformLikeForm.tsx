"use client";

import { type KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import BusinessSearch from "@/components/BusinessSearch";
import OpeningHoursInput from "@/components/OpeningHoursInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { defaultValues, formSchema, type FormValues } from "@/lib/form-validation";
import {
  CATEGORY_OPTIONS,
  LIGHTNING_OPERATOR_OPTIONS,
  OTHER_ACCEPTANCE_OPTIONS,
  OPTIONAL_FIELD_IDS,
  filterQuestions,
  questions,
  type QuestionDefinition,
  type QuestionId,
} from "@/lib/form-schema";
import { formatReviewData, normalizeWebsite, parseStreetAddress } from "@/lib/form-helpers";
import { useBusinessSearchPrefill } from "@/hooks/useBusinessSearchPrefill";
import { useAltchaVerification } from "@/hooks/useAltchaVerification";

const TypeformLikeForm = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [includeOptional, setIncludeOptional] = useState(defaultValues.includeOptionalDetails ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onBlur",
  });

  const {
    register,
    control,
    setValue,
    handleSubmit,
    trigger,
    watch,
    resetField,
    setFocus,
    formState: { errors },
  } = form;

  const formValues = watch();

  const { handlePlaceSelect, geocoding, geocodingAttribution } = useBusinessSearchPrefill<FormValues>({
    setValue,
  });

  const { altchaReady, altchaVerified, altchaToken, altchaRef } = useAltchaVerification();

  useEffect(() => {
    if (altchaVerified) {
      setSubmitError(null);
    }
  }, [altchaVerified]);

  useEffect(() => {
    setIncludeOptional(!!formValues.includeOptionalDetails);
  }, [formValues.includeOptionalDetails]);

  useEffect(() => {
    if (!includeOptional) {
      OPTIONAL_FIELD_IDS.forEach((field) => {
        resetField(field, { defaultValue: defaultValues[field] });
      });
    }
  }, [includeOptional, resetField]);

  useEffect(() => {
    if (!formValues.lightning && (formValues.lightningOperator || formValues.lightningOperatorOther)) {
      setValue("lightningOperator", "");
      setValue("lightningOperatorOther", "");
    }
  }, [formValues.lightning, formValues.lightningOperator, formValues.lightningOperatorOther, setValue]);

  useEffect(() => {
    if (formValues.lightningOperator !== "other" && formValues.lightningOperatorOther) {
      setValue("lightningOperatorOther", "");
    }
  }, [formValues.lightningOperator, formValues.lightningOperatorOther, setValue]);

  const activeQuestions = useMemo(
    () => filterQuestions({ includeOptional, values: formValues }),
    [includeOptional, formValues]
  );

  useEffect(() => {
    if (stepIndex > activeQuestions.length - 1) {
      setStepIndex(Math.max(activeQuestions.length - 1, 0));
    }
  }, [activeQuestions.length, stepIndex]);

  const currentQuestion = activeQuestions[stepIndex];

  useEffect(() => {
    if (currentQuestion?.fields?.length) {
      setFocus(currentQuestion.fields[0]);
    }
  }, [currentQuestion?.id, currentQuestion?.fields, setFocus]);

  const goToStep = useCallback(
    (id: QuestionId) => {
      const index = activeQuestions.findIndex((question) => question.id === id);
      if (index >= 0) {
        setStepIndex(index);
      }
    },
    [activeQuestions]
  );

  const handleNext = async () => {
    if (!currentQuestion) return;
    const fieldsToValidate = currentQuestion.fields ?? [];
    if (fieldsToValidate.length) {
      const isValid = await trigger(fieldsToValidate as (keyof FormValues)[]);
      if (!isValid) {
        return;
      }
    }
    setStepIndex((prev) => Math.min(prev + 1, activeQuestions.length - 1));
  };

  const handleBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleOptionalChoice = (choice: boolean) => {
    const updatedValues = { ...formValues, includeOptionalDetails: choice };
    setIncludeOptional(choice);
    setValue("includeOptionalDetails", choice);
    const nextQuestions = filterQuestions({ includeOptional: choice, values: updatedValues });
    const promptIndex = nextQuestions.findIndex((question) => question.id === "optionalPrompt");
    const targetIndex = Math.min(promptIndex + 1, nextQuestions.length - 1);
    setStepIndex(targetIndex);
  };

  const skipOptionalBlock = () => {
    const updatedValues = { ...formValues, includeOptionalDetails: false };
    setIncludeOptional(false);
    setValue("includeOptionalDetails", false);
    const nextQuestions = filterQuestions({ includeOptional: false, values: updatedValues });
    const licenseIndex = nextQuestions.findIndex((question) => question.id === "licenseAndAltcha");
    setStepIndex(licenseIndex >= 0 ? licenseIndex : nextQuestions.length - 1);
  };

  const toggleOtherOption = (value: string) => {
    const current = formValues.other || [];
    if (current.includes(value)) {
      setValue(
        "other",
        current.filter((item) => item !== value)
      );
    } else {
      setValue("other", [...current, value]);
    }
  };

  const submissionHandler = async (values: FormValues) => {
    if (!altchaVerified || !altchaToken) {
      setSubmitError("Please complete the ALTCHA verification before submitting.");
      goToStep("licenseAndAltcha");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const normalizedWebsite = normalizeWebsite(values.website);
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          website: normalizedWebsite,
          captchaToken: altchaToken,
          bitcoinDetails: {
            onChain: values.onChain,
            lightning: values.lightning,
            lightningContactless: values.lightningContactless,
            lightningOperator:
              values.lightningOperator === "other" ? values.lightningOperatorOther : values.lightningOperator,
            other: values.other,
            inStore: values.inStore,
            online: values.online,
          },
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitSuccess(result);
      } else {
        const errorMessage = result.error || result.message || result.details || "Failed to submit. Please try again or contact support if the problem persists.";
        setSubmitError(errorMessage);
        goToStep("review");
      }
    } catch (error: any) {
      setSubmitError(error.message || "An error occurred");
      goToStep("review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    const target = event.target as HTMLElement;
    if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON" || target.getAttribute("role") === "button") {
      return;
    }
    event.preventDefault();
    if (currentQuestion?.id === "review") {
      void handleSubmit(submissionHandler)();
    } else {
      void handleNext();
    }
  };

  const renderQuestionContent = (question: QuestionDefinition) => {
    switch (question.id) {
      case "businessSearch":
        return (
          <div className="space-y-3">
            <BusinessSearch onPlaceSelect={handlePlaceSelect} />
            {geocoding && (
              <p className="text-sm text-neutral-dark">
                <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                Geocoding address...
              </p>
            )}
            {geocodingAttribution && !geocoding && (
              <p className="text-xs text-neutral-dark italic">{geocodingAttribution}</p>
            )}
          </div>
        );
      case "businessName":
        return (
          <div>
            <Label className="sr-only" htmlFor="businessName-step">
              Business name
            </Label>
            <Input id="businessName-step" {...register("businessName")} placeholder={question.placeholder} className={errors.businessName ? "border-red-500" : ""} />
            {errors.businessName && <p className="text-sm text-red-500 mt-2">{errors.businessName.message}</p>}
          </div>
        );
      case "description":
        return (
          <div>
            <Textarea id="description-step" rows={4} {...register("description")} placeholder={question.placeholder} />
          </div>
        );
      case "category":
        return (
          <div>
            <select
              id="category-step"
              {...register("category")}
              className={clsx(
                "flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-base",
                errors.category ? "border-red-500" : ""
              )}
            >
              <option value="">Select a category</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-sm text-red-500 mt-2">{errors.category.message}</p>}
          </div>
        );
      case "addressStreet":
        return (
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <div>
              <Label htmlFor="housenumber-step" className="text-sm font-medium text-neutral-700">
                House number
              </Label>
              <Input id="housenumber-step" {...register("housenumber")} placeholder="123" />
            </div>
            <div>
              <Label htmlFor="street-step" className="text-sm font-medium text-neutral-700">
                Street
              </Label>
              <Input
                id="street-step"
                {...register("street")}
                placeholder="Bitcoin Ave"
                onBlur={(event) => {
                  const parsed = parseStreetAddress(event.target.value);
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
          </div>
        );
      case "addressLocation":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="suburb-step">Suburb</Label>
              <Input id="suburb-step" {...register("suburb")} />
            </div>
            <div>
              <Label htmlFor="city-step">City</Label>
              <Input id="city-step" {...register("city")} />
            </div>
            <div>
              <Label htmlFor="state-step">State</Label>
              <Input id="state-step" {...register("state")} />
            </div>
            <div>
              <Label htmlFor="postcode-step">Postcode</Label>
              <Input id="postcode-step" {...register("postcode")} />
            </div>
          </div>
        );
      case "bitcoinMethods":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
              <Checkbox id="onChain-step" checked={formValues.onChain} onCheckedChange={(checked) => setValue("onChain", checked === true)} />
              <Label htmlFor="onChain-step" className="text-base">
                On-chain Bitcoin
              </Label>
            </div>
            <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
              <Checkbox id="lightning-step" checked={formValues.lightning} onCheckedChange={(checked) => setValue("lightning", checked === true)} />
              <Label htmlFor="lightning-step" className="text-base">
                Lightning Network
              </Label>
            </div>
            <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
              <Checkbox
                id="lightningContactless-step"
                checked={formValues.lightningContactless}
                onCheckedChange={(checked) => setValue("lightningContactless", checked === true)}
              />
              <Label htmlFor="lightningContactless-step" className="text-base">
                Lightning Contactless (NFC)
              </Label>
            </div>
            {errors.onChain && <p className="text-sm text-red-500">{errors.onChain.message}</p>}
          </div>
        );
      case "lightningOperator":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="lightning-operator">Lightning operator</Label>
              <select
                id="lightning-operator"
                {...register("lightningOperator")}
                className={clsx(
                  "mt-2 flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-base",
                  errors.lightningOperator ? "border-red-500" : ""
                )}
              >
                <option value="">Select an operator</option>
                {LIGHTNING_OPERATOR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.lightningOperator && <p className="text-sm text-red-500 mt-2">{errors.lightningOperator.message}</p>}
            </div>
            {formValues.lightningOperator === "other" && (
              <div>
                <Label htmlFor="lightning-operator-other">Other operator</Label>
                <Input id="lightning-operator-other" {...register("lightningOperatorOther")} placeholder="Enter operator name" />
                {errors.lightningOperatorOther && <p className="text-sm text-red-500 mt-2">{errors.lightningOperatorOther.message}</p>}
              </div>
            )}
          </div>
        );
      case "acceptanceLocations":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
              <Checkbox id="inStore-step" checked={formValues.inStore} onCheckedChange={(checked) => setValue("inStore", checked === true)} />
              <Label htmlFor="inStore-step" className="text-base">
                In-store payments
              </Label>
            </div>
            <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
              <Checkbox id="online-step" checked={formValues.online} onCheckedChange={(checked) => setValue("online", checked === true)} />
              <Label htmlFor="online-step" className="text-base">
                Online / remote payments
              </Label>
            </div>
          </div>
        );
      case "otherAcceptance":
        return (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">Pick any extras that apply.</p>
            <div className="flex flex-wrap gap-2">
              {OTHER_ACCEPTANCE_OPTIONS.map((option) => {
                const selected = formValues.other?.includes(option.value);
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => toggleOtherOption(option.value)}
                    className={clsx(
                      "rounded-full border px-4 py-2 text-sm transition",
                      selected ? "border-primary bg-primary/10 text-primary" : "border-border text-neutral-700"
                    )}
                    aria-pressed={selected}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      case "optionalPrompt":
        return (
          <div className="space-y-4">
            <Button type="button" size="lg" className="w-full justify-between" onClick={() => handleOptionalChoice(true)}>
              Yes, include optional details
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="lg" className="w-full justify-between" onClick={() => handleOptionalChoice(false)}>
              Skip optional details for now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        );
      case "contactInfo":
        return (
          <div className="space-y-4">
            <Input {...register("phone")} placeholder="Phone" />
            <div>
              <Input {...register("website")} placeholder="Website" />
              {errors.website && <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>}
            </div>
            <div>
              <Input {...register("email")} placeholder="Email" type="email" />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
            </div>
          </div>
        );
      case "socialLinks":
        return (
          <div className="space-y-4">
            <Input {...register("facebook")} placeholder="https://facebook.com/..." />
            <Input {...register("instagram")} placeholder="https://instagram.com/..." />
          </div>
        );
      case "openingHours":
        return (
          <Controller
            control={control}
            name="openingHours"
            render={({ field }) => (
              <OpeningHoursInput value={field.value || ""} onChange={field.onChange} error={errors.openingHours?.message} />
            )}
          />
        );
      case "accessibility":
        return (
          <div>
            <select
              {...register("wheelchair")}
              className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-base"
            >
              <option value="">Not specified</option>
              <option value="yes">Yes</option>
              <option value="limited">Limited</option>
              <option value="no">No</option>
            </select>
          </div>
        );
      case "notes":
        return <Textarea rows={4} {...register("notes")} placeholder={question.placeholder} />;
      case "licenseAndAltcha":
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border px-4 py-3">
              <Checkbox
                id="licenseAgreement-step"
                checked={formValues.licenseAgreement}
                onCheckedChange={(checked) => setValue("licenseAgreement", checked === true)}
              />
              <Label htmlFor="licenseAgreement-step" className="text-sm">
                I agree that my submission will be released under the Open Database License (ODbL) and published on OpenStreetMap.
              </Label>
            </div>
            {errors.licenseAgreement && <p className="text-sm text-red-500">{errors.licenseAgreement.message}</p>}
            <div>
              <Label className="text-sm font-medium">Verification</Label>
              <div className="mt-3">
                {altchaReady ? (
                  <>
                    {/* @ts-ignore */}
                    <altcha-widget ref={altchaRef} name="altcha" challengeurl="/api/altcha/challenge" />
                    {altchaVerified ? (
                      <p className="text-sm text-green-600 font-medium mt-2">✓ Verification complete</p>
                    ) : (
                      <p className="text-sm text-neutral-dark mt-2">Please complete the verification above before submitting.</p>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border bg-neutral-light p-4 text-sm text-neutral-dark">Loading verification...</div>
                )}
              </div>
            </div>
          </div>
        );
      case "review": {
        const summary = formatReviewData(formValues);
        return (
          <div className="space-y-6">
            <div className="rounded-xl border bg-neutral-light/40 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Business summary</h3>
                <button type="button" className="text-sm text-primary" onClick={() => goToStep("businessName")}>
                  Edit
                </button>
              </div>
              <p className="text-neutral-700 mt-2">{summary.businessName}</p>
              <p className="text-neutral-600 text-sm">{summary.category}</p>
              <p className="text-neutral-600 text-sm">{summary.address}</p>
            </div>
            <div className="rounded-xl border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Bitcoin acceptance</h3>
                <button type="button" className="text-sm text-primary" onClick={() => goToStep("bitcoinMethods")}>
                  Edit
                </button>
              </div>
              <p className="text-neutral-700 text-sm">Methods: {summary.bitcoinMethods}</p>
              <p className="text-neutral-700 text-sm">Lightning operator: {summary.lightningOperator}</p>
              <p className="text-neutral-700 text-sm">Acceptance locations: {summary.acceptanceLocations}</p>
            </div>
            <div className="rounded-xl border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Contacts & socials</h3>
                <button type="button" className="text-sm text-primary" onClick={() => goToStep("contactInfo")}>
                  Edit
                </button>
              </div>
              <p className="text-neutral-700 text-sm">Phone: {summary.phone}</p>
              <p className="text-neutral-700 text-sm">Website: {summary.website}</p>
              <p className="text-neutral-700 text-sm">Email: {summary.email}</p>
              <p className="text-neutral-700 text-sm">Facebook: {summary.facebook}</p>
              <p className="text-neutral-700 text-sm">Instagram: {summary.instagram}</p>
            </div>
            <div className="rounded-xl border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Extras</h3>
                <button type="button" className="text-sm text-primary" onClick={() => goToStep("notes")}>
                  Edit
                </button>
              </div>
              <p className="text-neutral-700 text-sm">Opening hours: {summary.openingHours}</p>
              <p className="text-neutral-700 text-sm">Wheelchair access: {summary.wheelchair}</p>
              <p className="text-neutral-700 text-sm">Notes: {summary.notes}</p>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="rounded-3xl border bg-white p-8 shadow-sm text-center">
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

  const progressPercent = activeQuestions.length ? ((stepIndex + 1) / activeQuestions.length) * 100 : 0;
  const isReviewStep = currentQuestion?.id === "review";
  const isLicenseStep = currentQuestion?.id === "licenseAndAltcha";

  const primaryButtonLabel = isReviewStep ? (submitting ? "Submitting..." : "Submit") : "Next";
  const primaryButtonAction = isReviewStep ? handleSubmit(submissionHandler) : handleNext;
  const primaryDisabled =
    submitting ||
    (isLicenseStep && (!formValues.licenseAgreement || !altchaVerified)) ||
    (!currentQuestion && true);

  return (
    <form className="max-w-2xl mx-auto min-h-screen px-4 py-10" onKeyDown={handleKeyDown} onSubmit={(event) => event.preventDefault()}>
      <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" aria-hidden="true" />
          <p className="text-sm md:text-base">
            Please use this form only for businesses that customers can visit in person (shops, cafés, offices, etc.). If the business operates only online or by private appointment, please
            <a href="/contact" className="font-semibold text-primary underline ml-1">
              email us
            </a>
            instead.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm text-neutral-500">
            <span>
              Step {Math.min(stepIndex + 1, activeQuestions.length)} of {activeQuestions.length}
            </span>
            <span>{currentQuestion?.section}</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-200">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {currentQuestion && (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-wide text-neutral-500">{currentQuestion.section}</p>
              <h2 className="text-2xl font-semibold text-neutral-900">{currentQuestion.title}</h2>
              {currentQuestion.description && <p className="text-neutral-600">{currentQuestion.description}</p>}
            </div>
            <div>{renderQuestionContent(currentQuestion)}</div>
          </div>
        )}

        {submitError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleBack} disabled={stepIndex === 0 || submitting} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          {currentQuestion?.category === "optional" && (
            <button type="button" onClick={skipOptionalBlock} className="text-sm text-neutral-500 underline">
              Skip optional details
            </button>
          )}
          <Button type="button" onClick={primaryButtonAction} disabled={primaryDisabled} className="w-full sm:w-auto">
            {isReviewStep && submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            {primaryButtonLabel}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default TypeformLikeForm;
