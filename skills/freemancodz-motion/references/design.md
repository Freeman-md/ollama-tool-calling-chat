# Reference research and design decisions

Read the relevant entry when setting direction. These are observed case-study methods and our own Remotion adaptations. No reference artwork is needed in the output.

| Reference | What the studio documents | Remotion adaptation |
| --- | --- | --- |
| [Ordinary Folk, Webflow Ecommerce](https://www.ordinaryfolk.co/project/webflow-ecommerce) | The studio combined 2D and 3D to create dimension while making the real UI the focal point. Its case study includes styleframes. | Separate hero imagery, UI and near/far planes. Move each at a deliberate rate and let the UI land front-on for reading. Use perspective transforms and pre-rendered imagery for simple depth. Build geometry only when the camera needs to see hidden faces or lighting must change with angle. |
| [Studio Magenta, Houston](https://www.studiomagenta.co.uk/work/houston) | A space metaphor informed lighting, styleframes and motion identity. Blender-built assets and interface elements supported spatial transitions, with sound designed early. | Choose one motion rule that expresses the product. Reuse its acceleration and visual motifs when attention changes. Include audio attacks and holds in the beat plan before coding. CSS and SVG handle rhythm and spatial layering. New models or a 3D renderer are justified only for true viewpoint changes. |
| [Tuneful Media, Syncytium](https://www.tunefulmedia.com/case-study/syncytium) | UI art was swappable as the product evolved. Separate camera motion staged it inside the story, including tracked screens in filmed environments. | Separate interface content from camera and shared surface bounds. Make one screen replaceable without copying the timeline. Use tracked footage or corner pinning only when integrating into moving footage. A CSS perspective plane is sufficient for synthetic staging. |

## What to change in the previous business film

The existing full film uses one Scene wrapper that fades and scales each of eight panels independently. At the joins the outgoing panel finishes before the incoming panel starts. A shared backdrop and assistant icon provide branding, but the viewer loses the physical point of attention. Return to this diagnosis only when relevant. The full film is preserved.

For continuous work, place the hero in one persistent composition. Carry a geometry, mark, edge or trajectory across the joins and move the next interface into a known destination before asking the viewer to read. Draw the outgoing and incoming projected rectangles on a transition preview. Overlap camera pan and dolly where that improves the trajectory. Keep background parallax smaller than foreground travel. Let information sit still when the viewer needs it.

Shared geometry and matching silhouettes cover most assistant and UI handoffs. Use SVG path morphing only when the contour itself conveys the transformation. Use React Three Fiber only for actual viewpoint changes, lighting, occlusion or geometry that a few planes cannot plausibly handle. Consider GSAP only for a complex existing choreography that remains frame-seekable. A new dependency must solve an observed production problem.
