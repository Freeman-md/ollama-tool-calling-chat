# Phone Orbit

A Freemancodz phone-shop film using the spatial camera choreography of Perfume Orbit. H.264/AAC, 1080 × 1920, 30 fps, 33 seconds, with a steady ending.

The iPhone 18 Pro, Glacier finish, Vitra wallpaper and UK price use [Apple's product artwork and store listing](https://www.apple.com/uk/shop/buy-iphone/iphone-18-pro/6.3-inch-display-256gb-glacier). Screen, capacity and chip details follow [Apple's technical specifications](https://www.apple.com/uk/iphone-18-pro/specs/). Stock and collection availability are illustrative.

## Editing and rendering

Run `npm ci`, then `npm run studio` or `npm run render`. The camera, native interface panels and field reveals are in `src/orbit.tsx`. All timing is in `src/score.json`. Artwork is local in `public/art/`. The official product cutout stays intact and is composited over a new ImageGen studio backplate.

Use a Python environment with NumPy to run `scripts/audio.py`. Two committed 48 kHz mono dialogue takes rebuild the score and all stems. To regenerate speech, install Kokoro-ONNX 0.6.1 and use `--generate-voice /path/to/kokoro-models` with its v1.0 model and voices. Uses bm_lewis at 1.05× and bf_emma at 1.04×.

The score is a transposed variation on the Orbit arrangement, with newly generated effects. All music and effects are original synthesis. Speech uses the Apache-2.0 [Kokoro-82M model](https://huggingface.co/hexgrad/Kokoro-82M). The supplied Freemancodz mark is the brand asset.

## Motion and review

The full Shotcraft catalogue was searched for the same selected techniques as the perfume version. [Basic 3D scene](https://vincentwei1021.github.io/video-shotcraft/media/basic-3d-scene.mp4) supplies the inverse-pose camera model, asymmetric 32–46-frame flights and a 24% distance hop. [Progressive product assembly](https://vincentwei1021.github.io/video-shotcraft/media/product-card-progressive-assemble.mp4) supplies image, title, detail and value reveal order. Gallery references and the phone proof are checked at normal speed.

Every interface gets a settled read. Review covers device placement on the stage, complete phone crops in cards, budget/price consistency, channel recognition, call controls and the concluding hold. `scripts/verify.py` checks final geometry, full decode, blank frames, audio levels and measured speech placement. `scripts/playback.mjs` checks 1× playback through the final frame. The objective checks do not constitute a listening-quality audition.

The final master, mobile contact sheet, separate stems, no-music mix and verification reports are in `out/`.
