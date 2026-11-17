"""Generate the two original call takes with Kokoro-ONNX and public v1.0 weights."""

import argparse
import json
from pathlib import Path
import wave

import numpy as np
from kokoro_onnx import Kokoro

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("model_dir", type=Path)
parser.add_argument("--edition", choices=("perfume", "phone"), default="perfume")
args = parser.parse_args()
engine = Kokoro(str(args.model_dir / "kokoro-v1.0.onnx"), str(args.model_dir / "voices-v1.0.bin"))
root = Path(__file__).resolve().parents[1]
output = root / "public/audio"
takes = [
    ("question", "Can I collect today?", "bm_george", 1.04),
    ("answer", "Yes, we're open until six.", "bf_emma", 1.06),
]
if args.edition == "phone":
    output /= "phone"
    dialogue = json.loads((root / "src/phone-dialogue.json").read_text())
    takes = [("question", dialogue["question"], "bm_lewis", 1.10),
             ("answer", dialogue["answer"], "bf_isabella", 1.01)]
output.mkdir(parents=True, exist_ok=True)
for name, line, voice, speed in takes:
    signal, rate = engine.create(line, voice=voice, speed=speed, lang="en-gb")
    activity = np.where(np.abs(signal) > .013)[0]
    first = max(0, activity[0] - round(rate * .012))
    last = min(len(signal), activity[-1] + round(rate * .06))
    signal = signal[first:last]
    signal = np.interp(np.arange(0, len(signal) * 48000 / rate) * rate / 48000, np.arange(len(signal)), signal)
    ramp = min(480, len(signal) // 3)
    signal[:ramp] *= np.linspace(0, 1, ramp)
    signal[-ramp:] *= np.linspace(1, 0, ramp)
    signal *= .58 / np.max(abs(signal))
    with wave.open(str(output / f"call-{name}.wav"), "wb") as file:
        file.setparams((1, 2, 48000, 0, "NONE", "not compressed"))
        file.writeframes((signal * 32767).astype("<i2").tobytes())
    print(f"{name}: {len(signal)/48000:.3f} seconds ({voice})")
