"""Measure the encoded film's picture, packaging and scheduled audio."""
from array import array
from pathlib import Path
import argparse
import json
import math
import subprocess
import wave

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('movie',type=Path)
parser.add_argument('--ffmpeg',required=True)
args=parser.parse_args()
clock=json.loads((root/'src/score.json').read_text())
def ff(*argv):
    return subprocess.run([args.ffmpeg,*map(str,argv)],check=True,capture_output=True).stdout
movie=args.movie
probe=json.loads(subprocess.check_output(['node',str(root/'node_modules/.bin/remotion'),'ffprobe','-v','error','-show_streams','-show_format','-of','json',str(movie)]))
raw=ff('-v','error','-i',movie,'-an','-vf','scale=54:96','-pix_fmt','gray','-f','rawvideo','-')
size=54*96
assert len(raw)==clock['frames']*size
blank=[i for i in range(clock['frames']) if max(raw[i*size:(i+1)*size])-min(raw[i*size:(i+1)*size])<8]
assert not blank,blank
mixed=array('h',ff('-v','error','-i',movie,'-vn','-ac','1','-ar','48000','-f','s16le','-'))
matches=[]
for key in ['question','answer']:
    with wave.open(str(root/f'public/audio/{key}.wav'),'rb') as file:
        samples=array('h',file.readframes(file.getnframes()))
    indices=range(0,len(samples),24)
    power=sum(samples[i]**2 for i in indices)
    at=clock['voice'][key]*1600
    def correlation(offset):
        window=[mixed[at+offset+i] for i in indices]
        return sum(a*samples[i] for a,i in zip(window,indices))/math.sqrt(power*sum(a*a for a in window))
    offset=max(range(-1600,1601,8),key=correlation)
    score=correlation(offset)
    assert abs(offset)<480 and score>.85,(key,offset,score)
    matches.append({'take':key,'offsetMs':round(offset/48,3),'correlation':round(score,4)})
log=subprocess.run([args.ffmpeg,'-hide_banner','-nostats','-i',str(movie),'-vn','-af','loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json','-f','null','-'],check=True,capture_output=True).stderr.decode()
levels=json.loads(log[log.rindex('{'):log.rindex('}')+1])
video=next(s for s in probe['streams'] if s['codec_type']=='video')
audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (video['width'],video['height'],video['codec_name'],video['pix_fmt'])==(1080,1920,'h264','yuv420p')
assert (audio['codec_name'],audio['sample_rate'],audio['channels'])==('aac','48000',2)
assert video['color_space']=='bt709' and video['color_range']=='tv'
assert abs(float(probe['format']['duration'])-33)<.05
assert float(levels['input_tp'])< -1.5
assert -24<float(levels['input_i'])<-13
report={'movie':str(movie),'seconds':float(probe['format']['duration']),'decodedFrames':clock['frames'],'blankFrames':blank,'video':{k:video[k] for k in ['width','height','pix_fmt','color_space','color_range','avg_frame_rate']},'audio':{'lufs':float(levels['input_i']),'peakDbTP':float(levels['input_tp'])},'speech':matches,'errors':[]}
path=root/'out/qa.json';path.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
