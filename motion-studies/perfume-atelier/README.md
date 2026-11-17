# Perfume Atelier

A Freemancodz Shotcraft Studio film for WhatsApp Status. The fictional fragrance counter uses one assistant for recommendations, stock questions, scent notes and pickup. The stock and hours used in the interface are illustrative.

## Play and edit

```sh
npm ci
npm run audio
npm run studio
npm run render
```

The edit is frame-addressable in `src/atelier.tsx`, with visual styling in `src/atelier.css` and a shared sound and picture clock in `src/timing.json`. Delivery is 1080 × 1920, 30 fps, H.264/AAC. The last two frames return to the opening composition.

The score script places and exports the music, effects and dialogue separately in `out/audio-stems/`. The committed 48 kHz dialogue takes are sufficient to rebuild the mix. To regenerate them, use `scripts/dialogue.py` with Kokoro-ONNX 0.6.1 and the public v1.0 model and voices from the [Kokoro-ONNX release](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1). Uses the built-in `bm_george` and `bf_emma` voice presets at 1.04× and 1.06×. Neither stem imitates a requested individual.

## Assets and direction

The campaign still and packshots were generated for this project with ImageGen. Product names, scent notes and prices are based on the app's fictional catalogue. The supplied Freemancodz wordmark is used as the brand identifier. Interfaces and motion are Remotion components. The music and interaction sounds are original synthesis. Voice synthesis uses [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) and its Apache-2.0 model licence.

The [Shotcraft circle-match-iris recipe](https://vincentwei1021.github.io/video-shotcraft/) informed the opening and closing handoffs. Both masks start on the assistant seal at project coordinates (360, 1086). The product photo has its own push-in, with the seal pinned to the same position on both sides of the handoff. After the rim clears, typing leads to the question, reply and result with a settled reading hold. Web, WhatsApp and Telegram exchange channel screens with a travelling soft matte. The call uses the mixed voice envelope for its waveform. A short blend takes the closing image back to the same frame as the opening while the soundtrack fades to silence.

```sh
python3 scripts/qa.py out/freemancodz-perfume-atelier.mp4 --effects out/audio-stems/effects.wav --output out/qa.json
node scripts/playback.mjs --browser /path/to/chrome-headless-shell --output out/playback.json out/freemancodz-perfume-atelier.mp4
```
