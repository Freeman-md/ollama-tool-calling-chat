"""Create the original Phone Orbit stems on its frame clock."""
import argparse
import json
from pathlib import Path
import wave
import numpy as np

root=Path(__file__).resolve().parents[1]
clock=json.loads((root/'src/score.json').read_text())
rate=48000
count=clock['frames']*rate//clock['fps']
audio=root/'public/audio'
audio.mkdir(parents=True,exist_ok=True)
stems=root/'out/stems'
stems.mkdir(parents=True,exist_ok=True)
parser=argparse.ArgumentParser()
parser.add_argument('--generate-voice',type=Path)
args=parser.parse_args()
script=[('question','Can I collect it today?','bm_lewis',1.05),('answer','Yes. We close at six.','bf_emma',1.04)]

def write(path,signal):
    with wave.open(str(path),'wb') as file:
        file.setparams((signal.shape[1] if signal.ndim==2 else 1,2,rate,0,'NONE','PCM'))
        file.writeframes((np.clip(signal,-.999,.999)*32767).astype('<i2').tobytes())

if args.generate_voice:
    from kokoro_onnx import Kokoro
    engine=Kokoro(str(args.generate_voice/'kokoro-v1.0.onnx'),str(args.generate_voice/'voices-v1.0.bin'))
    for name,text,voice,speed in script:
        samples,sr=engine.create(text,voice=voice,speed=speed,lang='en-gb')
        active=np.flatnonzero(abs(samples)>.01)
        samples=samples[max(0,active[0]-240):min(len(samples),active[-1]+1000)]
        samples=np.interp(np.arange(len(samples)*rate//sr)*sr/rate,np.arange(len(samples)),samples)
        samples*=.52/max(abs(samples))
        write(audio/f'{name}.wav',samples)
        print(name,round(len(samples)/rate,3),voice)
music=np.zeros((count,2))
effects=np.zeros_like(music)
dialogue=np.zeros_like(music)
rng=np.random.default_rng(99123)
def note(at,hz,length,gain,pan=0):
    begin=round(at*rate)
    size=min(round(length*rate),count-begin)
    if size<=0:return
    t=np.arange(size)/rate
    body=(np.sin(2*np.pi*hz*t+.55*np.exp(-t*4)*np.sin(2*np.pi*hz*2*t))+.12*np.sin(2*np.pi*hz*3.001*t))
    body*=np.minimum(t/.018,1)*np.minimum((length-t)/.08,1)*np.exp(-t*2.8)*gain
    music[begin:begin+size,0]+=body*(1-pan)*.75
    music[begin:begin+size,1]+=body*(1+pan)*.75
def effect(frame,kind,gain):
    at=frame*rate//30
    length=.44 if kind=='air' else .14
    size=min(round(length*rate),count-at)
    if size<=0:return
    t=np.arange(size)/rate
    if kind=='air':
        noise=rng.normal(0,.28,size)
        sound=np.convolve(noise,np.ones(22)/22,mode='same')*np.sin(np.pi*t/length)**2
    else:
        hz=530 if kind=='send' else 840 if kind=='result' else 402
        sound=(np.sin(2*np.pi*hz*t)+.2*np.sin(2*np.pi*hz*1.8*t))*np.exp(-t*32)*np.minimum(t/.002,1)
    effects[at:at+size]+=sound[:,None]*gain
for bar in range(14):
    at=bar*2.4
    chord=[(164.81,246.94,311.13,369.99),(146.83,220,277.18,329.63),(123.47,185,246.94,293.66),(138.59,207.65,277.18,329.63)][bar%4]
    for i,hz in enumerate(chord):
        note(at+.16+i*.045,hz,1.5,.062,-.35+i*.22)
    note(at,chord[0]/2,1.8,.17)
    for b in range(4):
        note(at+b*.6,55,.12,.105)
        if b%2:effect(round((at+b*.6+.03)*30),'air',.07)
    note(at+1.56,chord[-1]*2,.6,.045,.45)
cues={}
for name in ['web','whatsapp','telegram']:
    state=clock[name]
    for k in ['send','reply','result']:
        effect(state[k],k,.09 if k=='send' else .065)
        cues[f'{name}-{k}']=state[k]
    for off in [1,5,10,14,19,23]: effect(state['type']+off,'send',.022)
for a,b in clock['flights']:effect(a+4,'air',.26)
effect(clock['voice']['confirm'],'result',.09)
levels={}
for key,text,voice,speed in script:
    with wave.open(str(audio/f'{key}.wav'),'rb') as file:
        samples=np.frombuffer(file.readframes(file.getnframes()),dtype='<i2').astype(float)/32768
    at=clock['voice'][key]*rate//30
    dialogue[at:at+len(samples)]=samples[:,None]
    levels[key]=[round(min(1,float(np.sqrt(np.mean(samples[i:i+1600]**2)))*7),4) for i in range(0,len(samples),1600)]
    start=max(0,at-8000)
    stop=min(count,at+len(samples)+15000)
    env=np.minimum(np.arange(stop-start)/8000,1)*np.minimum(np.arange(stop-start)[::-1]/15000,1)
    music[start:stop]*=(1-.68*env[:,None])
fade=np.minimum(np.arange(count)/12000,1)*np.minimum(np.arange(count)[::-1]/28000,1)
music*=fade[:,None]*1.8
effects*=fade[:,None]*1.25
mix=music+effects+dialogue
peak=max(abs(mix).flatten())
assert peak<.93,peak
for name,stem in [('music',music),('effects',effects),('dialogue',dialogue)]:
    write(stems/f'{name}.wav',stem)
write(audio/'mix.wav',mix)
write(stems/'no-music.wav',effects+dialogue)
(root/'src/levels.json').write_text(json.dumps(levels)+'\n')
(stems/'cues.json').write_text(json.dumps({'effects':cues,'voice':clock['voice'],'script':script},indent=2)+'\n')
print('mix peak',round(20*np.log10(peak),2),'dBFS')
