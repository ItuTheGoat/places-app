# NxtUp Design Spec

## Product Context
NxtUp is a mobile-first app for deciding what to do next. The UI should feel like a native app: focused screens, clear actions, quick feedback.

## Responsive Strategy
- Build mobile-first and scale up for tablet/desktop.
- Keep content readable and touch-friendly at small sizes.
- Preserve app-like vertical rhythm and spacing across breakpoints.

## Typography
- Font family: Inter with SF Pro as acceptable platform fallback.
- Headings: semibold emphasis.
- Body: regular weight with generous line-height.
- Avoid decorative fonts.

## Color System
- Background: `#0F172A`
- Surface: `#1E293B`
- Primary Accent: `#22C55E`
- Secondary Accent: `#38BDF8`
- Text Primary: `#F8FAFC`
- Text Secondary: `#94A3B8`

Use semantic theme classes and tokens in components instead of raw hex values.

## Component Conventions

### Cards
- Radius: `rounded-2xl`
- Padding: generous (`p-4` to `p-6` depending on density)
- Shadow: soft and subtle
- Purpose: group related information with easy scanning

### Buttons
- Primary:
  - Filled with primary accent
  - `rounded-xl`
  - Press animation with slight scale reduction
- Secondary:
  - Outline or ghost style
  - Maintain strong contrast against dark surfaces

## Interaction Patterns
- Make primary action obvious on each screen.
- Keep critical actions reachable by thumb.
- Use subtle transitions for tap feedback and state changes.

## Content Hierarchy
- One dominant action per view.
- Secondary metadata should not compete with primary labels.
- Keep filters concise and legible.

## Performance Expectations
- Core views should appear quickly.
- Capture flow should remain short and predictable.
- Avoid complex UI behaviors that delay decision-making.
