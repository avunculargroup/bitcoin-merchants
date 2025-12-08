# Feature: Typeform-Style Multi-Step Form

## 1\. Overview

We’re replacing the existing multi-field webform with a Typeform-style, one-question-per-screen flow built on Next.js, react-hook-form, zod, shadcn/ui, and TailwindCSS. Framer Motion will be introduced in phase 2 for smooth transitions. The new flow enhances UX while maintaining backend compatibility.

## 2\. Goals & Non-Goals

Goals:

\- Provide an improved one-question-per-step user experience.

\- Implement robust validation using react-hook-form and zod.

\- Maintain backend API contract stability.

\- Support keyboard navigation and a clean UI.

Non-Goals:

\- Creating a full drag-and-drop form builder.

\- Replicating Typeform pixel-perfect UI.

\- Supporting complex conditional logic beyond basic dependencies.

## 3\. User Experience

Flow:

1\. Load form page.

2\. Show centered card containing progress, question, and input.

3\. Allow navigation with Back/Next and keyboard shortcuts.

4\. Validate per-step.

5\. Submit final step to API and show success confirmation.

Keyboard Features:

\- Enter = Next

\- Shift+Enter = newline in textarea

Error Handling:

\- Inline field errors (react-hook-form)

\- Global submission errors

## 4\. Architecture & Components

Main files:

\- lib/form-schema.ts: Data-driven question definitions.

\- lib/form-validation.ts: zod schema.

\- components/forms/TypeformLikeForm.tsx: Multi-step form logic.

\- API route for POST submission.

Data Model:

\- Questions include id, label, type, placeholder, options, and optional conditional logic.

## 5\. UI Implementation Details

Key responsibilities of TypeformLikeForm:

\- Manage step index.

\- Validate per-step using RHF trigger().

\- Render input dynamically based on field type.

\- Submit data via fetch POST.

\- Provide Back/Next navigation and progress bar.

Keyboard handling and conditional field rendering included.

## 6\. API Contract

POST /api/form/submit

Body: JSON matching FormValues (from zod schema)

Response: 200 OK or error with message

## 7\. Phase 2: Framer Motion Enhancements

Add <AnimatePresence> + <motion.div> for smooth step transitions.

Animate progress bar updates.

Add subtle fade/scale animations on load and success screens.

## 8\. Edge Cases & Considerations

\- State persistence via localStorage (optional).

\- Conditional questions (future enhancement).

\- Accessibility and focus management.

\- Mobile-friendly layout.

## 9\. Implementation Plan

Step 1: Create schema + questions.

Step 2: Build wizard with RHF + zod.

Step 3: Add UX polish.

Step 4: Integrate Framer Motion.

Step 5: QA and rollout.
