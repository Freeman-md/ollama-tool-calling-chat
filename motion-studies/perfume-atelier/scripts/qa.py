"""Audit decoded picture, sound, cue timing and packaging for an MP4 export."""

import argparse
import array
from io import BytesIO
import json
import math
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN = json.loads((ROOT / "src/timing.json").read_text())
CLI = ROOT / "node_modules/.bin/remotion"
SIZE = 54 * 96


def remotion(tool, args, **kwargs):
    return subprocess.run(["node", str(CLI), tool, *map(str, args)], check=True,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE, **kwargs)


def visual_signals(movie):
    raw = remotion("ffmpeg", ["-v", "error", "-i", movie, "-an", "-vf", "scale=54:96",
                              "-pix_fmt", "gray", "-c:v", "rawvideo", "-f", "image2pipe", "pipe:1"]).stdout
    if len(raw) % SIZE:
        raise ValueError("Decode ended with an incomplete frame.")
    frames = [raw[i:i + SIZE] for i in range(0, len(raw), SIZE)]

    def delta(a, b):
        return sum(abs(x - y) for x, y in zip(a, b)) / SIZE

    diffs = [0] + [delta(a, b) for a, b in zip(frames, frames[1:])]
    events = sorted(range(1, len(diffs)), key=lambda i: diffs[i], reverse=True)[:8]
    flicker = [i for i in range(1, len(frames) - 1)
               if min(diffs[i], diffs[i + 1]) >= 5 and delta(frames[i - 1], frames[i + 1]) < 2.5]
    return {"decodedFrames": len(frames), "nearUniformFrames": [i for i, f in enumerate(frames) if max(f)-min(f) <= 5],
            "oneFrameExcursions": flicker, "strongestLumaChanges": [
                {"frame": i, "time": round(i / PLAN["fps"], 3), "meanDelta": round(diffs[i], 3)} for i in events
            ], "loopBoundaryDelta": round(delta(frames[-1], frames[0]), 3),
            "sampling": "54×96 decoded luma for every frame. Motion events need visual review."}


def loudness(movie):
    logged = remotion("ffmpeg", ["-hide_banner", "-nostats", "-i", movie, "-vn",
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"]).stderr.decode()
    start, end = logged.rindex("{"), logged.rindex("}")
    values = json.loads(logged[start:end+1])
    return {"integratedLUFS": float(values["input_i"]), "truePeakDbTP": float(values["input_tp"]),
            "loudnessRangeLU": float(values["input_lra"])}


def sound_cues(fx):
    import wave
    with wave.open(str(fx), "rb") as source:
        rate, channels = source.getframerate(), source.getnchannels()
        samples = array.array("h", source.readframes(source.getnframes()))
    score = []
    cues = json.loads((fx.parent / "cue-sheet.json").read_text())["effects"]
    for key, frame in cues.items():
        center = round(frame / PLAN["fps"] * rate) * channels
        span = round(.060 * rate) * channels
        after = samples[center:center+span]
        magnitude = max((abs(x) for x in after), default=0) / 32768
        threshold = magnitude * .25
        offset = next((i for i, x in enumerate(after) if abs(x)/32768 > threshold), None)
        score.append({"cue": key, "frame": frame, "peakFirst60msDbFS": round(20 * math.log10(magnitude), 2) if magnitude else None,
                      "attackMs": round(offset / channels / rate * 1000, 2) if offset is not None else None})
    return score


def voice_alignment(movie):
    import wave
    rate = 48000
    decoded = remotion("ffmpeg", [
        "-v", "error", "-i", movie, "-vn", "-ac", 1, "-ar", rate, "-c:a", "pcm_s16le", "-f", "wav", "pipe:1"
    ]).stdout
    with wave.open(BytesIO(decoded), "rb") as stream:
        mix = array.array("h", stream.readframes(stream.getnframes()))
    alignment = []
    for key in ("question", "answer"):
        with wave.open(str(ROOT / f"public/audio/call-{key}.wav"), "rb") as take:
            voice = array.array("h", take.readframes(take.getnframes()))
        start = PLAN["voice"][key] * rate // PLAN["fps"]
        points = range(0, len(voice), 24)
        power = sum(voice[i] ** 2 for i in points)

        def similarity(offset):
            window = [mix[start + offset + i] for i in points]
            denominator = math.sqrt(power * sum(v ** 2 for v in window))
            return sum(v * voice[i] for i, v in zip(points, window)) / denominator

        offset = max(range(-1600, 1601, 8), key=similarity)
        alignment.append({"role": key, "offsetMs": round(offset * 1000 / rate, 2),
                          "correlation": round(similarity(offset), 4)})
    return alignment


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("movie", type=Path)
    p.add_argument("--frames", type=int, default=PLAN["frames"])
    p.add_argument("--size", default="1080x1920")
    p.add_argument("--seek-proof", type=Path)
    p.add_argument("--effects", type=Path)
    p.add_argument("--silent", action="store_true")
    p.add_argument("--allow-uniform", action="append", type=int, default=[])
    p.add_argument("--output", type=Path, required=True)
    args = p.parse_args()
    streams = json.loads(remotion("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", args.movie]).stdout)
    video = next((s for s in streams["streams"] if s["codec_type"]=="video"), None)
    audio = next((s for s in streams["streams"] if s["codec_type"]=="audio"), None)
    errors = []
    check = visual_signals(args.movie)
    length = args.frames / PLAN["fps"]
    if (not video or video.get("codec_name") != "h264" or video.get("pix_fmt") not in {"yuv420p","yuvj420p"}
        or video["avg_frame_rate"] != f"{PLAN['fps']}/1" or f"{video['width']}x{video['height']}" != args.size
        or check["decodedFrames"] != args.frames or abs(float(streams["format"]["duration"]) - length) > .04):
        errors.append("Invalid codec, geometry, clock, frame count or duration")
    if set(check["nearUniformFrames"])-set(args.allow_uniform):
        errors.append("Unexpected near-uniform frames")
    if check["oneFrameExcursions"]:
        errors.append("Unexpected one-frame luma excursions")
    if check["loopBoundaryDelta"] > .5:
        errors.append("Opening and closing loop frames differ")
    results = {"movie": args.movie.name, "picture": check,
               "streams": [{k: s[k] for k in ("codec_type","codec_name","pix_fmt","color_space","color_range",
                 "width","height","avg_frame_rate","sample_rate","channels") if k in s} for s in streams["streams"]],
               "seconds": float(streams["format"]["duration"])}
    if not args.silent:
        if not audio or audio["codec_name"] != "aac" or audio["sample_rate"] != "48000" or audio["channels"] != 2:
            errors.append("Expected stereo 48 kHz AAC")
        else:
            levels = loudness(args.movie)
            results["audio"] = levels
            if levels["truePeakDbTP"] >= -1.0 or not -24.0 <= levels["integratedLUFS"] <= -13.0:
                errors.append("True peak or programme loudness outside review range")
            alignment = voice_alignment(args.movie)
            results["dialogueAlignment"] = alignment
            if any(abs(take["offsetMs"]) >= 20 or take["correlation"] < .85 for take in alignment):
                errors.append("An encoded dialogue take is missing or out of sync")
    if args.effects:
        cues = sound_cues(args.effects)
        results["effectAttacks"] = cues
        if any(cue["attackMs"] is None or cue["attackMs"] > 33.3 for cue in cues):
            errors.append("An effects stem cue attack is missing or late")
    if args.seek_proof:
        proof = json.loads(args.seek_proof.read_text())
        results["frameSeekProof"] = {key: proof[key] for key in ("randomSeekFrames","pageErrors")}
        offscreen = []
        for capture in proof["visualTextBounds"]:
            for text in capture["text"]:
                if min(text["minX"], text["minY"]) < 0 or text["maxX"] > proof["width"] or text["maxY"] > proof["height"]:
                    offscreen.append({"frame":capture["frame"],"text":text["text"]})
        results["visibleTextOutsideCanvas"] = offscreen
        if offscreen or proof["pageErrors"] or not proof["randomSeekFrames"]:
            errors.append("Text bounds, browser errors or seeking checks failed")
    results["errors"] = errors
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(results, indent=2) + "\n")
    print(json.dumps({"movie": results["movie"], "frames": check["decodedFrames"], "audio": results.get("audio"), "errors": errors}, indent=2))
    raise SystemExit(bool(errors))


if __name__ == "__main__":
    main()
