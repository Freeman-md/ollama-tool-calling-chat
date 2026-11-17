# Implementation and review

## Plan and build

For each major handoff record source anchor, destination anchor, frame interval, what survives the change, readable hold and cue attack. Treat background, camera, hero geometry, interface content and sound as separate concerns. Use the existing composition clock. Sample the actual projected bounds during camera movement.

[assets/motion.mjs](../assets/motion.mjs) contains plain data helpers for eased tracks, rectangle interpolation and positioning. Use them if they match the scene geometry. The prototype under `motion-studies/business-assistant` in the source checkout demonstrates their use with a shared surface and two replaceable interface states.

Build a small proof around the hardest transition. Export just its frame range and inspect the before, speed peak, midpoint and destination frames in order. Fix timing, clipping, focal jumps and poor read time before expanding the render. Keep sound effects aligned with visible actions by locating the audible attack, then reuse the same timing when you revise. Use original or cleared audio.

## Export and review

Use the project's pinned Remotion toolchain. Confirm Node, browser and encoder availability before promising an export. Use `remotion render` for final delivery, H.264/AAC for ordinary social uploads, and an existing Chromium binary if the environment requires it. A render with mismatched fonts, missing assets or an invalid audio track is failed.

Review the actual encode at 1× when the available preview supports it. Check mouth or interaction sync as applicable. Inspect nearby frames around high-risk joins, and downscale a representative frame to phone width. Verify duration, frame size, aspect ratio, codecs, clipping and required assets. If only frame inspection or audio metering is possible, state that. For a requested loop, inspect the boundary across both audio and picture. Correct at least one demonstrated defect when the review finds one, then recheck the affected result.

Record what changed, what was actually tested, and which checks could not be completed. A static sheet alone does not prove pacing. When an independent review is part of the brief or active supporting workflow, give the reviewer the brief, export and nearby handoff frames with timecodes, and ask for concrete defects.
