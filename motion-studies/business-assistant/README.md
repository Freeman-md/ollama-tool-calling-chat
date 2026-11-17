# Business assistant motion study

An eight-second portrait prototype. The original full business-assistant film remains a separate composition.

## Reproduce

From this folder, use Node 22 or newer, run `npm ci`, then run `npm run render`. The script synthesizes the original score before rendering the MP4 to `out/freemancodz-motion-study.mp4` at 1080 × 1920. Set `--browser-executable=/absolute/path/to/chromium` on the Remotion command when using an installed Chromium build. Run `npm run studio` to inspect both compositions interactively. The short `HandoffProof` composition isolates the highest-risk core-to-web opening for review.

The prototype uses the existing Freemancodz logo, Manrope asset, generated storefront and Cedar Dusk product image. The price matches the repository catalog. The stock exchange is illustrative. No external audio samples are needed.

## Choreography

| Interval | Action and focal point | Sound |
| --- | --- | --- |
| 0–1.98 s | The shop image and three data objects establish the business. The objects draw into the assistant mark as camera travel begins. | Low gather accent, then an assembly cue. |
| 1.98–3.3 s | The assistant surface opens into a browser. The mark moves into its header while the camera settles. | Browser arrival accent. |
| 3.3–5.28 s | The question and Cedar Dusk result appear. The camera gives the result a reading hold. | Brief product cue. |
| 5.28–6.62 s | The surface narrows toward messaging, keeping the photo and assistant intact. The stock answer appears in place. | Sweep, arrival and response cues. |
| 6.62–8 s | The message stays in view while the closing line lands. | Short musical tail. |

The surface and camera use frame-derived tracks. Interface content stays separate from projected bounds. `src/score.mjs` is the shared cue clock for Remotion and the original audio synthesizer. The study imports the reusable rectangle helper from the canonical skill in this repository.

## Review

The first handoff proof exposed an empty interval before the product result. The result was advanced to 3.56 seconds to extend the reading hold. Independent review found that the web and messaging headers needed clearer cues and the closing words wrapped awkwardly. The final render adds browser chrome and a message icon, shortens the closing line and keeps the product photo visible through both handoffs.

Checked the encoded film in a local browser at normal playback speed and inspected near-boundary frames and phone-scale holds. Export is 8.00 seconds at 1080 × 1920, H.264 at 30 fps, with 48 kHz stereo AAC. Independent signal analysis confirmed the six timed audio attacks and measured a peak of −12.8 dBFS before the final visual-only revision. Listening quality was not independently auditioned. The study uses layered 2.5D imagery and conceptual UI.

A fresh Codex app-server outside the source checkout listed the installed skill as enabled. An explicit skill selection plus a new natural-language production-revision brief produced a silent two-second vertical cut of the web result. The test checked the output decode and phone-size frames. This verifies direct invocation and a scoped production revision. It is not a second full-length production.
