"""Original electric piano score, interaction effects and dialogue placement."""

from array import array
import json
import math
from pathlib import Path
from random import Random
import wave

ROOT = Path(__file__).resolve().parents[1]
CLOCK = json.loads((ROOT / "src/timing.json").read_text())
RATE = 48000
STEP = RATE // CLOCK["fps"]
LENGTH = CLOCK["frames"] * STEP
TAU = math.tau
random = Random(23390)


def stereo():
    return array("f", [0.0]) * (2 * LENGTH)


def frequency(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def write(path, samples):
    with wave.open(str(path), "wb") as out:
        out.setparams((2, 2, RATE, 0, "NONE", "not compressed"))
        packed = array("h", (round(max(-.999, min(.999, x)) * 32767) for x in samples))
        out.writeframes(packed.tobytes())


def piano(track, time, midi, volume, pan, length=1.65):
    start = round(time * RATE)
    hz = frequency(midi)
    left, right = math.sqrt((1 - pan) / 2), math.sqrt((1 + pan) / 2)
    for j in range(min(round(length * RATE), LENGTH - start)):
        sec = j / RATE
        angle = TAU * hz * sec
        decay = min(1, sec / .014, (length - sec) / .08) * math.exp(-sec * 2.5)
        wavelet = (math.sin(angle + .85 * math.exp(-sec * 8) * math.sin(angle * 2.01))
                   + .14 * math.sin(angle * 1.002)) * volume * decay
        offset = 2 * (start + j)
        track[offset] += left * wavelet
        track[offset + 1] += right * wavelet


def gesture(track, start, duration, gain, kind, pitch=300):
    start = round(start * RATE)
    slow = fast = 0.0
    for j in range(min(round(duration * RATE), LENGTH - start)):
        t = j / RATE
        p = t / duration
        noise = random.random() * 2 - 1
        slow += .036 * (noise - slow)
        fast += .26 * (noise - fast)
        if kind == "air":
            value = (fast - slow) * math.sin(math.pi * p) ** 1.5
        elif kind == "drum":
            value = math.sin(TAU * (48 * t + 1.0 * (1 - math.exp(-t * 33)))) * math.exp(-t * 15)
            value *= min(1, t / .004)
        elif kind == "brush":
            value = (noise - fast) * math.exp(-t * 26) * min(1, t / .009)
        elif kind == "glass":
            shell = math.sin(TAU * pitch * t) + .22 * math.sin(TAU * pitch * 1.7 * t)
            value = (shell * .62 + .32 * math.exp(-t * 95) * fast) * min(1, t / .005) * math.exp(-t * 10)
        else:
            value = (fast * .8 + .3 * math.sin(TAU * pitch * t)) * math.exp(-t * 73) * min(1, t / .0018)
        sample = value * gain * min(1, (duration - t) / .012)
        index = (start + j) * 2
        track[index] += sample
        track[index + 1] += .94 * sample


def music_track():
    track = stereo()
    beat = .625
    chords = [(38, 53, 57, 60, 64), (34, 53, 57, 60, 62), (43, 53, 57, 58, 62), (45, 55, 58, 61, 64)]
    for bar in range(12):
        start = 4 * bar * beat
        bass, *voicing = chords[bar % len(chords)]
        piano(track, start, bass, .105, 0.0, 1.35)
        piano(track, start + 2.53 * beat, bass + 12, .052, .05, .65)
        for i, note in enumerate(voicing):
            piano(track, start + .45 * beat + .021 * i, note, .047, -.54 + i * .35)
        piano(track, start + 2.03 * beat, voicing[-1] + 12, .034, .62, .9)
        piano(track, start + 3.25 * beat, voicing[1], .044, -.35, .74)
        for b in range(4):
            if b in (0, 2):
                gesture(track, start + b * beat, .25, .098 if b == 0 else .07, "drum")
            if b in (1, 3):
                gesture(track, start + b * beat + .02, .143, .029, "brush")
    return track


def effects_track():
    track = stereo()
    cues = {}
    for channel in ("web", "whatsapp", "telegram"):
        beat = CLOCK[channel]
        for i, offset in enumerate((1, 5, 10, 14, 18, 22)):
            gesture(track, (beat["question"] + offset) / CLOCK["fps"], .06, .032, "tap", 305 + 34 * (i % 3))
        for name, kind, duration, gain, pitch in (
            ("send", "tap", .11, .098, 443),
            ("reply", "glass", .21, .066, 512),
            ("result", "glass", .29, .071, 371),
        ):
            frame = beat[name]
            gesture(track, frame / CLOCK["fps"], duration, gain, kind, pitch)
            cues[f"{channel}-{name}"] = frame
        gesture(track, (beat["start"] + 2) / CLOCK["fps"], .38, .074, "air")
    for name, frame, pitch in (
        ("call-connect", CLOCK["voice"]["start"] + 14, 467),
        ("pickup", CLOCK["voice"]["confirm"], 496),
        ("finale", CLOCK["finale"] + 4, 327),
    ):
        gesture(track, frame / CLOCK["fps"], .39, .084, "glass", pitch)
        cues[name] = frame
    gesture(track, (CLOCK["iris"][0] + 6) / CLOCK["fps"], .54, .139, "air")
    return track, cues


def dialogue_track():
    track = stereo()
    markers = {}
    levels = {}
    for name, frame in (("question", CLOCK["voice"]["question"]), ("answer", CLOCK["voice"]["answer"])):
        with wave.open(str(ROOT / f"public/audio/call-{name}.wav"), "rb") as take:
            assert (take.getframerate(), take.getnchannels(), take.getsampwidth()) == (RATE, 1, 2)
            samples = array("h", take.readframes(take.getnframes()))
        markers[name] = {"frame": frame, "start": frame / CLOCK["fps"], "end": (frame * STEP + len(samples)) / RATE}
        levels[name] = [round(min(1, 6.1 * math.sqrt(sum((v / 32768) ** 2 for v in samples[i:i + STEP]) / STEP)), 4)
                        for i in range(0, len(samples), STEP)]
        for i, value in enumerate(samples, start=frame * STEP):
            track[2 * i] = track[2 * i + 1] = .93 * value / 32768
    return track, levels, markers


def main():
    music = music_track()
    effects, cues = effects_track()
    voice, levels, markers = dialogue_track()
    stems = ROOT / "out/audio-stems"
    stems.mkdir(parents=True, exist_ok=True)
    for i in range(LENGTH):
        t = i / RATE
        end = (LENGTH - i - 1) / RATE
        duck = max(min(1, max(0, (t - m["start"] + .17) / .17), max(0, (m["end"] + .37 - t) / .37))
                   for m in markers.values())
        master_envelope = min(1, t / .16, end / .42)
        ix = 2 * i
        for c in (ix, ix + 1):
            music[c] *= (1 - .66 * duck) * master_envelope * 2.45
            effects[c] *= master_envelope * 1.68
            voice[c] *= 1.17
    peak = max(abs(a + b + c) for a, b, c in zip(music, effects, voice))
    assert peak <= .84, f"Mix would exceed its peak budget: {peak}"
    write(stems / "music.wav", music)
    write(stems / "effects.wav", effects)
    write(stems / "dialogue.wav", voice)
    write(ROOT / "public/audio/mix.wav", (a + b + c for a, b, c in zip(music, effects, voice)))
    (ROOT / "src/voice-levels.json").write_text(json.dumps(levels, separators=(",", ":")) + "\n")
    (stems / "cue-sheet.json").write_text(json.dumps({"fps": CLOCK["fps"], "dialogue": markers, "effects": cues}, indent=2) + "\n")
    print(f"Audio rendered at {RATE} Hz, stereo, with sample peak {20 * math.log10(peak):.1f} dBFS")


if __name__ == "__main__":
    main()
