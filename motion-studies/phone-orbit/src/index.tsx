import { Composition, registerRoot } from "remotion";
import { PhoneOrbit } from "./orbit";
import clock from "./score.json";
registerRoot(() => (
  <Composition
    id="PhoneOrbit"
    component={PhoneOrbit}
    width={720}
    height={1280}
    fps={clock.fps}
    durationInFrames={clock.frames}
  />
));
