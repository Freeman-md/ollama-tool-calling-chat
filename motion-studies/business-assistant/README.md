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

## Full WhatsApp Status film

`BusinessStatus` is a separate 29-second composition in the same project. Run `npm run render:status` to generate the score and export `out/freemancodz-whatsapp-status.mp4` at 1080 × 1920 and 30 fps. As with the prototype, pass `-- --browser-executable=/absolute/path/to/chromium` when rendering with an installed Chromium build. The existing 8-second film remains available through `npm run render`.

| Interval | Focal object and handoff |
| --- | --- |
| 0–4.45 s | Products, FAQs, inventory and operations converge into the assistant. The core becomes the web surface. |
| 4.45–9.70 s | The web recommendation introduces Cedar Dusk. Its image and the assistant mark follow the surface into WhatsApp. |
| 9.70–14.68 s | WhatsApp answers an availability question and the shared surface shifts to Telegram. |
| 14.68–19.47 s | Telegram answers a question about scent notes. The assistant mark travels into the voice call. |
| 19.47–25.45 s | A spoken stock question and answer appear in text with a waveform. The call surface contracts to the central assistant. |
| 25.45–29 s | The camera reveals the business and all four channel connections, then holds the closing line. |

The conversation screens and stock examples are illustrative. Cedar Dusk’s price and notes follow the catalog. The film reuses the existing storefront, brand, product image and synthesized voice clips. The deterministic instrumental and cues come from `status-sound.mjs`. The cue times and rectangle changes share `src/status-timing.mjs`.

The transition proof covered the Telegram-to-voice handoff. Playback and phone-scale frames of the final export confirmed the four channel identities, readable dialogue and the closing composition. Decode passed and the encoded voice matched its scheduled frames. The final mix measured −20.3 LUFS integrated and −5.3 dBFS true peak. Listening quality was not independently auditioned.

## Every Channel film

Run `npm run render:film` to export the 29.8-second Freemancodz film at 1080 × 1920. The composition is `FreemancodzFilm`. `FilmHandoff` isolates the web-to-WhatsApp transition through the first attachment entrance. The Remotion source is in `src/film/`, with the visual edit and original music using the same timings.

The opening uses a generated editorial portrait of the Cedar Dusk bottle. The channel attachments use the existing catalog photo. Conceptual interactions show a web recommendation, WhatsApp inventory check, Telegram notes and a spoken call. A moving light edge masks camera travel between independently framed scenes. Each channel reveals its product attachment after its own question and reply. The closing links share the assistant mark used in the channel headers.

`film-sound.mjs` generates the original score and reads two local synthesized voice stems to derive the call waveform. Render and review audio as well as frames when revising timing.

Reviewed the encoded film at normal speed and checked consecutive frames across the web-to-WhatsApp handoff, the attachment entrance, and the other channel changes. The revision separates title timing across sweeps and retains the full bottle in the WhatsApp attachment. The final render decodes at 1080 × 1920, 30 fps, with stereo AAC. Both voice stems match their scheduled frames in the encoded audio. The mix measures −21.1 LUFS integrated and −5.2 dBFS true peak. Listening quality was not independently auditioned.
