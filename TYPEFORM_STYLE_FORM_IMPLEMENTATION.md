# Typeform-Style Multi-Step Form — Build Plan

This document is the build-ready blueprint for replacing the legacy multi-field submission form (`app/submit/page.tsx`) with a Typeform-style wizard. It captures scope, architecture, step definitions, validation, rollout, and testing so engineers can implement confidently without reverse-engineering requirements mid-build.

---

## 1. Context & Objectives

- Deliver a one-question-per-screen wizard that maintains parity with today’s data capture while dramatically improving UX.
- Keep server contracts stable: `/api/submit` must receive identical payloads to the current form.
- Support keyboard navigation, inline validation, and responsive layouts out of the box.
- Phase 1 excludes animation polish (Framer Motion reserved for a later pass) and complex branching beyond existing “optional details.”

Non-goals remain: no full form builder, no pixel-perfect Typeform clone, no advanced conditional logic beyond optional sections.

---

## 2. Current State Audit

- `app/submit/page.tsx` handles every concern (form, validation, ALTCHA, BusinessSearch integration, review modal). Fields span business basics, address, bitcoin acceptance, optional contact/social info, accessibility, and notes.
- `BusinessSearch` + `/api/geocode` auto-populate address/coordinates; `OpeningHoursInput` manages structured hours; ALTCHA widget performs spam mitigation; submission hits `/api/submit`.
- Tests in `__tests__/` (api + integration) assume today’s payload shape and behavior (e.g., lightning operator dependency, acceptance method requirement).

Action: extract definitive field list and helper logic (house number parsing, website normalization, summary formatting) before coding the wizard so nothing is lost.

---

## 3. Success Criteria

1. Feature flag allows instant fallback to the legacy form.
2. All existing validations and backend expectations are satisfied; automated tests still pass.
3. Wizard UX supports keyboard-only flow, mobile responsiveness, and inline review step (no modal).
4. Optional “additional details” remain user-triggered but live inside the wizard.
5. “Other” bitcoin acceptance methods are exposed as a multi-select and included in payloads.

---

## 4. Feature Flag Strategy

- Add `NEXT_PUBLIC_TYPEFORM_WIZARD_ENABLED` (default `false`) to `env.ts` + `env.example`.
- In `app/submit/page.tsx`, render:
  - Legacy form when flag is false.
  - New wizard component (`TypeformLikeForm`) when flag is true.
- Keep both implementations until QA signs off; removal is a separate task after rollout confidence.

---

## 5. Data & Schema Work

### 5.1 Question Definitions (`lib/form-schema.ts`)

- Export `questions`: ordered configs with fields:
  - `id`, `section`, `title`, `description`, `type` (`text`, `textarea`, `select`, `checkbox`, `multi-select`, `custom`, etc.), `placeholder`, `options`, `defaultValue`, `isOptional`, `dependencies`.
  - `dependencies` supports `{ field: "lightning", equals: true }` style checks for conditional steps (lightning operator, other operator text, optional detail block, etc.).
- Tag optional block questions with `category: "optional"` so they can be conditionally injected when the user opts in.
- Provide metadata for custom components (`component: "businessSearch"`, `component: "openingHours"`, `component: "altcha"`).

### 5.2 Validation Schema (`lib/form-validation.ts`)

- Build Zod schema mirroring `questions`, exporting `formSchema` and `FormValues`.
- Rules to port:
  - `businessName`, `category`, `licenseAgreement` required.
  - `website` regex (normalize via shared helper) + optional blank email.
  - Lightning operator required when lightning toggled; “Other operator” text required when operator equals “other”.
  - Acceptance method refine: at least one of on-chain/lightning/lightningContactless/inStore/online/other[].
  - Coordinates optional, but maintain number types.
- Export `defaultValues` derived from schema/definitions to avoid duplication.

---

## 6. Step-by-Step Flow

| # | Step ID | Purpose / Fields | Notes |
|---|---------|------------------|-------|
|0|`businessSearch`|Optional BusinessSearch + geocoding feedback|Skippable; populates address + coords|
|1|`businessName`|`businessName` text|Required|
|2|`description`|`description` textarea|Optional|
|3|`category`|Select with existing options|Required|
|4|`addressStreet`|`housenumber`, `street`|House number parsing logic reused|
|5|`addressCity`|`suburb`, `city`, `state`, `postcode`|Layout as grouped inputs|
|6|`bitcoinMethods`|Checkbox group for onChain/lightning/lightningContactless|Prompts at least one eventually|
|7|`lightningOperator`|Select + conditional text field|Only when lightning true|
|8|`acceptanceLocations`|Checkboxes for `inStore`, `online`|Part of refine|
|9|`otherAcceptance`|Multi-select writing to `other: string[]`|New UI for existing schema|
|10|`optionalPrompt`|Yes/No toggle for optional block|Controls inclusion of later steps|
|11+|Optional steps (contact info, socials, opening hours, wheelchair, notes)|Respect existing inputs|Rendered only when user opts in|
|Final-2|`licenseAndAltcha`|License checkbox + ALTCHA widget|Submit disabled until verified|
|Final-1|`review`|Inline summary with edit jumps|Replaces modal|
|Final|`success`|Existing success copy inline|Shown after API success|

Notes:
- If user declines optional details, skip to license step directly.
- Success step keeps CTA to `/map`.

---

## 7. Wizard Architecture (`components/forms/TypeformLikeForm.tsx`)

1. Initialize `react-hook-form` with `zodResolver(formSchema)` and `defaultValues`.
2. Local state:
   - `stepIndex`, `includeOptional`, `altchaState` (`ready`, `verified`, `token`), `submitting`, `submitError`, `submitSuccess`.
3. Derived data:
   - `activeQuestions = useMemo(() => filterByDependencies(questions, includeOptional, formValues))`.
   - `currentQuestion = activeQuestions[stepIndex]`.
   - Progress = `(stepIndex + 1) / activeQuestions.length`.
4. Navigation:
   - `handleNext`: `trigger(currentQuestion.fields)` then `setStepIndex((i) => i + 1)`.
   - `handleBack`: decrement unless at first step.
   - `jumpToStep(id)` for “Edit” buttons on review step.
5. Keyboard support:
   - Global handler: Enter → Next (unless `textarea` without `Shift`), Shift+Enter inserts newline, `Escape` could close optional section (optional).
6. Focus management:
   - `useEffect` to focus the primary input each time `currentQuestion` changes.
7. Submission:
   - `handleSubmit` (RHF) called from review step; ensure ALTCHA verified before POST.
   - POST payload replicates legacy structure (including `bitcoinDetails` union object, normalized website).
   - On success, store response in `submitSuccess` and advance to success step; errors render inline banner and keep on review step for edits/resubmit.

---

## 8. UI & Styling Requirements

- Container: `max-w-xl mx-auto min-h-screen flex flex-col px-4 py-10`.
- Progress: thin bar + “Step X of Y” text; animate width instantly (Phase 2 adds motion).
- Card: use shadcn `Card` primitives or bespoke div with `rounded-xl border bg-background`.
- Inputs: reuse existing shadcn components (`Input`, `Textarea`, `Select`, `Checkbox`, `Button`). Multi-select can use checkbox chips or badges; ensure accessible labels.
- Navigation footer: sticky within card bottom, `Back` secondary button (disabled on first step), `Next/Submit` primary button; include “Skip optional details” when inside optional block.
- Inline error text styled consistent with existing forms (`text-sm text-red-500`).
- Geocoding indicator + attribution remain near BusinessSearch step.
- Review step formatting reuses existing summary logic but inline; include sections for clarity.
- Success step uses existing copy (list of next steps, CTA button).

---

## 9. Integrations & Shared Logic

### 9.1 Business Search & Geocoding
- Extract `handlePlaceSelect` + `parseStreetAddress` + geocode fetch into shared util/hook (e.g., `useBusinessSearchPrefill`) used by both forms during transition.
- Maintain asynchronous geocode call, storing attribution + coordinates just like legacy implementation.

### 9.2 ALTCHA
- Keep readiness polling + event listeners from current form; integrate into dedicated step component.
- Submission blocked until `altchaVerified === true` and token stored.

### 9.3 API Submission
- Reuse `normalizeWebsite` helper to send https-prefixed URLs.
- Request body stays identical:
  ```ts
  {
    ...formValues,
    website: normalizeWebsite(formValues.website),
    captchaToken: altchaToken,
    bitcoinDetails: {
      onChain,
      lightning,
      lightningContactless,
      lightningOperator: lightningOperator === "other" ? lightningOperatorOther : lightningOperator,
      other,
      inStore,
      online,
    },
  }
  ```
- Handle success vs error responses exactly as today (message in success card, error banner otherwise).

---

## 10. Optional Details & Conditional Logic

- Optional block triggered by explicit yes/no step (`includeOptionalDetails` stored in form state or component state).
- Questions inside optional block:
  1. Contact info (`phone`, `website`, `email`).
  2. Social links (`facebook`, `instagram`).
  3. Opening hours (`OpeningHoursInput` custom component).
  4. Accessibility (`wheelchair` select).
  5. Additional notes (`notes` textarea).
- Dependencies on other toggles:
  - `lightningOperator` and `lightningOperatorOther`.
  - `other` multi-select visible regardless of lightning status.
- When dependency turns false (e.g., user unchecks lightning), clear dependent field values to avoid stale data.

---

## 11. Accessibility & Responsive Behavior

- Each step uses a semantic heading (`h2`) and descriptive text.
- Associate inputs via `htmlFor` + `aria-describedby`; errors announced via `aria-live="polite"`.
- Ensure focus is trapped within wizard card in modal-less view (first focusable element on mount, `tabindex` cycle optional but nice-to-have).
- Buttons sized for touch; maintain safe-area padding on mobile (especially bottom nav).
- Provide skip links or allow pressing `Back` on optional block to return to previous steps easily.

---

## 12. Testing Strategy

1. **Unit Tests**
   - `form-schema` integrity (every question maps to schema fields).
   - `form-validation` edge cases (website normalization, acceptance refine, lightning dependencies).
   - Utilities: `parseStreetAddress`, `formatReviewData`, `normalizeWebsite`.
2. **Component Tests (React Testing Library)**
   - Step advancement blocked when validation fails.
   - Lightning operator conditional visibility.
   - Optional block toggling and skipping.
   - `other` multi-select writes array correctly.
   - ALTCHA gating: submit disabled until verified.
   - Feature flag toggles legacy vs wizard render.
3. **Integration / E2E (Playwright or Cypress)**
   - Happy path including optional details.
   - Path skipping optional details.
   - Validation failure (missing business name) surfaces inline error and prevents progress.
   - Server error (mock 500) shows error banner on review step.
4. **Regression**
   - Existing API tests remain valid; adjust only if helper locations change.
   - Legacy form path still works with flag off during rollout.

---

## 13. Rollout Checklist

1. Land schema + validation + wizard component behind flag.
2. Add documentation references (`PLAN.md`, `IMPLEMENTATION_STATUS.md`) noting feature flag.
3. Deploy to staging with flag enabled; QA runs through acceptance checklist (desktop/mobile, keyboard-only, ALTCHA).
4. Once approved, enable flag in production environment variables. Monitor submissions/metrics.
5. After confidence window, remove legacy form and flag (follow-up PR).
6. Plan Phase 2 enhancements (Framer Motion animations, analytics instrumentation) after base rollout stabilizes.

---

## 14. Known Follow-Ups / Future Enhancements

- Phase 2: add Framer Motion transitions for step content + progress bar.
- Consider gentle localStorage persistence if user abandonment remains high.
- Optional analytics instrumentation for step drop-off once privacy requirements clarified.

---

## 15. Open Items (None)

All previously raised questions are resolved:
- Review modal becomes inline review step.
- “Other” acceptance methods exposed via UI.
- Feature flag confirmed and planned.

No further blockers identified. Engineers can begin implementation using this plan. If new requirements emerge, update this document before coding to keep alignment.
