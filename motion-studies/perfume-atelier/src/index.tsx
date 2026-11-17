import {Composition, registerRoot} from 'remotion';
import {Atelier} from './atelier';
import score from './timing.json';

registerRoot(() => <Composition id="PerfumeAtelier" component={Atelier} width={720} height={1280}
  fps={score.fps} durationInFrames={score.frames} />);
