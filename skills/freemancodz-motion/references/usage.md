# Use Freemancodz Motion

Start a new Codex chat and type `$freemancodz-motion`, or select it in `/skills`, then write the brief in the same message. Codex uses a skill mention. A custom slash command is a Claude Code convention.

- `$freemancodz-motion Create a 20-second vertical product film for the perfume assistant. Focus on product discovery. Use the existing Freemancodz identity.`
- `$freemancodz-motion Prototype a 6-second 9:16 transition from browser checkout to a receipt. Use the attached screenshots.`
- `$freemancodz-motion Revise the final two seconds of the attached Remotion composition. Hold the wordmark longer and keep the final click aligned.`

Optional inputs include audience, platform, runtime, dimensions, product evidence, tone, brand assets, references, accessibility or audio requirements, and existing composition or video paths. Production is the default. Say “prototype” for a short exploratory render.

## Install and maintain

The canonical skill folder in this checkout is `skills/freemancodz-motion`. Link or copy it into `~/.agents/skills/freemancodz-motion` for cross-project Codex use. A link follows the checkout, so keep the link target on an available path. A copy remains usable after moving the checkout and must be refreshed when the canonical skill changes. Start a new session to verify discovery.

The [routing table](routing.md) identifies upstream libraries. Install with the upstream instructions when setting up another machine. Haidrrrry's upstream skill is `remotion-motion-graphics`; this host's existing installation is named `haidrrrry-remotion-motion-graphics`. Update the routing entry when replacing a supporting skill. The orchestrator requires no new runtime service. A render requires a Remotion project, compatible Node and Chromium, and available assets. Audio listening and preview availability depend on the client. No tool installs, research refreshes, or publishing are implied by invoking a production brief.
