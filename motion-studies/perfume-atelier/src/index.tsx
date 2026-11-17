import {Composition, registerRoot} from 'remotion';
import {Atelier} from './atelier';
import score from './timing.json';

const format = {width: 720, height: 1280, fps: score.fps, durationInFrames: score.frames};

registerRoot(() => <>
  <Composition id="PerfumeAtelier" component={Atelier} {...format} defaultProps={{variant: 'perfume' as const}} />
  <Composition id="PhoneAtelier" component={Atelier} {...format} defaultProps={{variant: 'phone' as const}} />
</>);
