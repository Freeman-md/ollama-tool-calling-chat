---
name: freemancodz-motion
description: Produce, prototype, or revise Freemancodz product motion in Remotion from a free-form brief. Own choreography, implementation, rendering, and evidence-based review.
---

Use the user's message and supplied assets as the brief. In Codex, invoke with `$freemancodz-motion <brief>` or select the skill in `/skills`. The brief does not need flags or a template.

## Scope

- **Production** is the default. Deliver the requested film with editable Remotion source and the assets needed to reproduce it.
- **Prototype** applies when the brief asks for a motion study. Prove the highest-risk handoff first, inspect it, then complete the short rendered study.
- **Revision** is a scope modifier in either mode. Inspect the existing composition, assets, timing and requested changes. Keep the original available and edit only the relevant range or components. For an encoded-only revision, use the supplied footage and disclose the editability limit.

Resolve audience, intended takeaway, platform, runtime, aspect ratio, branding and audio from the brief and available project context. Use reasonable defaults for the rest. Ask only for a missing decision that would materially change the result. Preserve applicable authorization boundaries, and distinguish conceptual interfaces from live capabilities.

## Production sequence

1. Inspect the existing composition or product and its brand sources. Reuse the verified mark, type and assets. Read [design principles and reference research](references/design.md) for a new direction or significant choreography work.
2. Read [supporting skill routing](references/routing.md). Select only the production guidance that applies. This skill owns the brief, editorial decisions and delivery. Supporting skills supply techniques.
3. Establish one visual through-line. For each beat, identify its focal object, prior state, change, camera target, reading hold, handoff and sound cue. Build and render the most uncertain transition before filling out the timeline. For a small revision, scope this to the affected beats.
4. Implement in Remotion with deterministic frame-based timing. Start with native CSS/SVG, spatial layers and shared geometry. Introduce extra tools only when a specific requirement survives a simpler proof. See [implementation and review](references/production.md) for the starter helpers and render loop.
5. Render previews, inspect the motion and refine specific defects. Render the final output and check the actual encode, including consecutive handoff frames, normal-speed playback, phone readability and sound when available. For substantial productions, request an independent review if authorized and available. Keep visual review, audio measurements and actual listening separate in the report.
6. Deliver the verified render, source and relevant assets with a short review. Give runtimes, format and any material limitations. Keep project source, rough tests and final artifacts distinguishable. Publish only when separately requested.

Examples and installation are in [usage](references/usage.md).
