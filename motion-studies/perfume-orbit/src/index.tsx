import { Composition, registerRoot } from "remotion";
import { PerfumeOrbit } from "./orbit";
import clock from "./score.json";
registerRoot(() => (
  <Composition
    id="PerfumeOrbit"
    component={PerfumeOrbit}
    width={720}
    height={1280}
    fps={clock.fps}
    durationInFrames={clock.frames}
  />
));
