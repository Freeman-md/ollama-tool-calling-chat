import {chromium} from 'playwright-core';
import {readFile,writeFile} from 'node:fs/promises';
import {parseArgs} from 'node:util';

const {values,positionals}=parseArgs({options:{
  browser:{type:'string'},output:{type:'string'},'single-process':{type:'boolean'},
},allowPositionals:true});
if (!values.output || !positionals.length) throw new Error('Pass one or more MP4 paths and --output report.json');
const browser=await chromium.launch({executablePath:values.browser??process.env.SHOTCRAFT_CHROMIUM,
  args:['--autoplay-policy=no-user-gesture-required',...(values['single-process']?
    ['--single-process','--disable-gpu','--disable-breakpad','--disable-features=AudioServiceOutOfProcess']:[])]});
const origin='https://shotcraft-playback.invalid';
const logs=[];
try {
  for(const source of positionals){
    const bytes=await readFile(source);
    const page=await browser.newPage();
    await page.route('**/*',route=>{
      const url=new URL(route.request().url());
      if(url.origin!==origin) return route.abort();
      if(url.pathname==='/') return route.fulfill({contentType:'text/html',
        body:'<!doctype html><video src="/movie.mp4" controls preload="auto" playsinline muted style="width:95vw"></video>'});
      if(url.pathname!=='/movie.mp4') return route.abort();
      const headers={'accept-ranges':'bytes','content-type':'video/mp4'};
      const range=route.request().headers().range?.match(/^bytes=(\d+)-(\d*)$/);
      if(!range) return route.fulfill({headers,body:bytes});
      const start=Number(range[1]);
      const end=range[2]?Math.min(Number(range[2]),bytes.length-1):bytes.length-1;
      if(start>=bytes.length || start>end) return route.fulfill({status:416,headers:{'content-range':'bytes */'+bytes.length}});
      return route.fulfill({status:206,headers:{...headers,'content-range':'bytes '+start+'-'+end+'/'+bytes.length},
        body:bytes.subarray(start,end+1)});
    });
    await page.goto(origin+'/');
    const proof=await page.evaluate(async()=>{
      const video=document.querySelector('video');
      await new Promise((resolve,reject)=>{
        if(video.readyState>=2) return resolve();
        video.addEventListener('loadeddata',resolve,{once:true});
        video.addEventListener('error',()=>reject(new Error(video.error?.message)),{once:true});
      });
      const start=performance.now();
      const presented=[];
      let callback=0;
      function record(now, data){
        presented.push(data.mediaTime);
        callback=video.requestVideoFrameCallback(record);
      }
      callback=video.requestVideoFrameCallback(record);
      const ended=new Promise((resolve,reject)=>{
        video.addEventListener('ended',resolve,{once:true});
        video.addEventListener('error',()=>reject(new Error(video.error?.message)),{once:true});
        setTimeout(()=>reject(new Error('Playback did not reach the end')),video.duration*1250+5000);
      });
      await video.play();
      await ended;
      video.cancelVideoFrameCallback(callback);
      const playback=video.getVideoPlaybackQuality();
      const reachedEnd=video.ended;
      const elapsedSeconds=(performance.now()-start)/1000;
      const canvas=document.createElement('canvas');
      canvas.width=64;
      canvas.height=64;
      const context=canvas.getContext('2d');
      const seek=async(time)=>{
        const ready=new Promise(resolve=>video.addEventListener('seeked',resolve,{once:true}));
        video.currentTime=time;
        await ready;
        context.drawImage(video,0,0,64,64);
        return context.getImageData(0,0,64,64).data.join(',');
      };
      const seekTimes=[.76,.16,.61,.76].map(part=>Math.round(video.duration*part*30)/30);
      const sampled=[];
      for(const time of seekTimes) sampled.push(await seek(time));
      const repeatSeekMatched=sampled[0]===sampled.at(-1)&&new Set(sampled).size>1;
      return {seconds:video.duration,elapsedSeconds,
        playbackRate:video.playbackRate,ended:reachedEnd,width:video.videoWidth,height:video.videoHeight,
        callbacks:presented.length,firstFrameTime:presented[0],lastFrameTime:presented.at(-1),
        totalVideoFrames:playback.totalVideoFrames,droppedVideoFrames:playback.droppedVideoFrames,
        seekTimes,repeatSeekMatched};
    });
    const passed=proof.ended && proof.playbackRate===1 && proof.repeatSeekMatched && Math.abs(proof.elapsedSeconds - proof.seconds) < 1.0
      && proof.lastFrameTime>proof.seconds-.3 && proof.callbacks>=proof.seconds*20;
    logs.push({file:source.split('/').at(-1),...proof,passed});
    console.log(source+': '+(passed?'decoded through playback end':'playback check failed'));
    await page.close();
  }
} finally {
  await browser.close();
  await writeFile(values.output,JSON.stringify(logs,null,2)+'\n');
}
if(logs.some(log=>!log.passed)) process.exitCode=1;
