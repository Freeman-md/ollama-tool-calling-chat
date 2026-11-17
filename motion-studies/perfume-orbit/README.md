# Perfume Orbit

An original Freemancodz film built with the updated Shotcraft Studio workflow. Fictional Cedar Dusk product data is £40, woody with cedar, sandalwood and vetiver. Stock and Saturday hours are illustrative. Portrait 1080 × 1920, 30 fps, 33 seconds.

## Edit and render

Run `npm ci`, then `npm run studio` or `npm run render`. Sources, timeline and art are in `src/orbit.tsx`, `src/score.json` and `public/art/`. Each 3D panel has one pose. A single absolute-frame camera computes the inverse pose and eases between stations. Holds remain aligned and readable. The programme ends on a steady brand message.

Use a Python environment containing NumPy to run `scripts/audio.py`. The committed question and answer takes rebuild all music, effects, dialogue, no-music mix and final mix. To regenerate speech, add `--generate-voice /path/to/kokoro-models` with Kokoro-ONNX 0.6.1, the official v1.0 model and voices. It uses bf_lily at 1.05× and bm_daniel at 1.06×. Voice phrases are measured directly from the WAV and placed on frames 659 and 720.

## Shot selection and rights

The updated full 124-card/150-style gallery was searched for product reveals, parallax, cards, carousels and spatial movement. Selected references were [basic-3d-scene](https://vincentwei1021.github.io/video-shotcraft/media/basic-3d-scene.mp4) and [product-card-progressive-assemble](https://vincentwei1021.github.io/video-shotcraft/media/product-card-progressive-assemble.mp4). Both exact recipes and implementations were inspected, and previews played at 1×.

The first reference informed inverse-camera poses, 32–46-frame asymmetric flights, a 24% distance hop and settled reading intervals. The second informed image → title → detail → confirmed-value staging, with 10-frame field offsets and quiet final holds. These are original implementations. No gallery artwork is in the film.

The hero and packshot are new ImageGen assets for this production. The supplied Freemancodz mark is the sole existing brand asset. All UIs, composition and motion are new Remotion source. Music and effects are original synthesis. Speech uses the Apache-2.0 [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) model. The film's product and channel scenes are conceptual, with no live integrations asserted.

## Delivery

The MP4 master, preview, separate stems and QA evidence are in `out/`. The music and music-free mix share one clock. Visual review checks product placement, the camera handoff, mobile UI copy and the final message. Audio measurement checks the actual encoded speech positions and peaks. A listening-quality audition is additional to these objective measurements.
