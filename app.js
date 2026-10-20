'use strict';
const el = id => document.getElementById(id);
const videoWrap = el('videoWrap');
const video = el('video');
const overlay = el('overlay');
const ctx = overlay.getContext('2d');
const overlayMsg = el('overlayMsg');
const startStopBtn = el('startStopBtn');
const helpDialog = el('helpDialog');
const zoomSlider = el('zoomSlider');
const zoomValue = el('zoomValue');
const magValue = el('magValue');
const detectValue = el('detectValue');
const dirValue = el('dirValue');
const lineStrength = el('lineStrength');
const labelSize = el('labelSize');
const targetMode = el('targetMode');
const drawMode = el('drawMode');
const colorMode = el('colorMode');
const accuracyMode = el('accuracyMode');
const cameraMode = el('cameraMode');
const readContent = el('readContent');
const readHint = el('readHint');
const ocrToggle = el('ocrToggle');
const presetBtns = [...document.querySelectorAll('.preset')];
const modeBtns = [...document.querySelectorAll('.modeBtn')];

const SUPPORTED_CLASSES = {
  all: ['person','dog','cat','bird','horse','sheep','cow','elephant','bear','zebra','giraffe','car','bus','truck','motorcycle','bicycle','boat','cell phone','laptop','tv','remote','keyboard','mouse','bottle','cup','chair','book','backpack','handbag','suitcase'],
  living: ['person','dog','cat','bird','horse','sheep','cow','elephant','bear','zebra','giraffe','car','bus','truck','motorcycle','bicycle','boat'],
  electronics: ['cell phone','laptop','tv','remote','keyboard','mouse'],
  text: [], entry: [], money: []
};
const COLORS = {
  person:'#80ff6c', dog:'#ffe563', cat:'#ffe563', bird:'#ffe563', horse:'#ffe563', sheep:'#ffe563', cow:'#ffe563', elephant:'#ffe563', bear:'#ffe563', zebra:'#ffe563', giraffe:'#ffe563',
  car:'#ff6f6f', truck:'#ff6f6f', bus:'#ff6f6f', boat:'#ff6f6f', motorcycle:'#ff6f6f', bicycle:'#ffbd67',
  'cell phone':'#5ee8ff', laptop:'#5ee8ff', tv:'#5ee8ff', keyboard:'#5ee8ff', mouse:'#5ee8ff', remote:'#5ee8ff',
  bottle:'#6affdf', cup:'#6affdf', chair:'#c49aff', book:'#c49aff', handbag:'#c49aff', backpack:'#c49aff', suitcase:'#c49aff'
};
const MIN_SCORE_STRICT = {person:0.79, car:0.82, truck:0.77, bus:0.77, motorcycle:0.72, bottle:0.56, cup:0.60};
const MIN_SCORE_NORMAL = {person:0.63, car:0.68, truck:0.64, bottle:0.48, cup:0.52};
const IMPORTANT = new Set(['person','car','truck','bus','motorcycle']);

let stream = null, currentTrack = null, running = false, model = null;
let frameTimer = null, ocrTimer = null, detectionBusy = false, ocrBusy = false;
let currentView = 'normal', zoom = 1, isUltra = false, knownUltraDeviceId = null;
let tracks = [], detections = [], lastFrame = 0, scanEpoch = 0;
let ocrEnabled = true, ocrWorkerPromise = null, ocrLast = [];
let lastPinch = null, lastCameraMessage = '';

function setMessage(t){ overlayMsg.textContent = t; overlayMsg.hidden = !t; }
function readMessage(t, hint){
  readContent.replaceChildren();
  const div = document.createElement('div'); div.textContent = t; readContent.appendChild(div);
  if(hint !== undefined) readHint.textContent = hint;
}
function readLines(lines){
  readContent.replaceChildren();
  if(!lines.length){ readMessage('No clearly readable text yet.', 'Hold the phone steady and point at a nearby sign or product label.'); return; }
  for(const t of lines){
    const div=document.createElement('div'); div.className='ocrLine'; div.textContent=t; readContent.appendChild(div);
  }
  readHint.textContent = 'Up to three higher-confidence readings. OCR can still make mistakes; long card numbers are masked.';
}
function setStatus(t){ detectValue.textContent = t; }
function updateZoomText(){const t=`${zoom.toFixed(1)}×`;zoomValue.textContent=t;magValue.textContent=t; presetBtns.forEach(b=>b.classList.toggle('active', Math.abs(parseFloat(b.dataset.zoom)-zoom)<.06));}
function fitOverlay(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  overlay.width=Math.max(1,Math.round(overlay.clientWidth*dpr));
  overlay.height=Math.max(1,Math.round(overlay.clientHeight*dpr));
  ctx.setTransform(dpr,0,0,dpr,0,0);
  drawDetections();
}
function colorOf(label){ const c=colorMode.value; return c==='auto'?(COLORS[label]||'#85ff68'):({green:'#85ff68',yellow:'#ffe566',red:'#ff6969'}[c]); }
function rr(x,y,w,h,r){r=Math.min(r,Math.max(0,w/2),Math.max(0,h/2));ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function actualDisplayBounds(box){
  const vw=video.videoWidth, vh=video.videoHeight, W=overlay.clientWidth,H=overlay.clientHeight;
  if(!vw||!vh||!W||!H)return null;
  // The video uses object-fit: cover, which crops a different amount than simple x/y scaling.
  const scale=Math.max(W/vw,H/vh),ox=(W-vw*scale)/2,oy=(H-vh*scale)/2;
  const [x,y,w,h]=box;
  return [x*scale+ox,y*scale+oy,w*scale,h*scale];
}
function drawDetections(){
  const W=overlay.clientWidth,H=overlay.clientHeight;
  ctx.clearRect(0,0,W,H);
  if(!running||!video.videoWidth||targetMode.value==='text'||targetMode.value==='entry'||targetMode.value==='money')return;
  ctx.save();
  for(const d of detections){
    const b=actualDisplayBounds(d.bbox);if(!b)continue;
    let [x,y,w,h]=b;
    if(x>W||x+w<0||y>H||y+h<0)continue;
    const color=colorOf(d.class);
    ctx.strokeStyle=color;ctx.lineWidth=Number(lineStrength.value);
    ctx.shadowBlur=8;ctx.shadowColor=color;
    if(drawMode.value!=='label'){rr(x,y,w,h,9);ctx.stroke();}
    ctx.shadowBlur=0;
    const name=d.class.replace(/^\w/,a=>a.toUpperCase());
    let lab=`${name} ${Math.round(d.score*100)}%`;
    const size=Number(labelSize.value);
    ctx.font=`700 ${size}px system-ui,-apple-system,sans-serif`;
    const maxW=W-12;
    while(lab.length>4&&ctx.measureText(lab).width+16>maxW)lab=lab.slice(0,-2)+'…';
    const labelW=Math.min(maxW,ctx.measureText(lab).width+18), labelH=size+12;
    const bx=Math.min(W-labelW-5,Math.max(5,x));
    const by=(y-labelH>6)?y-labelH-3:Math.min(H-labelH-5,y+5);
    ctx.fillStyle=color;rr(bx,by,labelW,labelH,7);ctx.fill();
    ctx.fillStyle='#061008';ctx.fillText(lab,bx+9,by+size+1);
  }
  ctx.restore();
}
function threshold(cls){
  const strict=accuracyMode.value==='strict';return (strict?MIN_SCORE_STRICT:MIN_SCORE_NORMAL)[cls]??(strict?0.68:0.53);
}
function intersectionOverUnion(a,b){
  const [ax,ay,aw,ah]=a,[bx,by,bw,bh]=b;
  const x=Math.max(ax,bx),y=Math.max(ay,by),w=Math.max(0,Math.min(ax+aw,bx+bw)-x),h=Math.max(0,Math.min(ay+ah,by+bh)-y);
  const i=w*h;return i/(aw*ah+bw*bh-i||1);
}
function trackPredictions(preds){
  if(targetMode.value==='text'||targetMode.value==='entry'||targetMode.value==='money'){
    tracks=[]; detections=[];drawDetections();setStatus('TEXT');return;
  }
  const allowed=SUPPORTED_CLASSES[targetMode.value]||SUPPORTED_CLASSES.all;
  const good=preds.filter(p=>allowed.includes(p.class)&&p.score>=threshold(p.class));
  const assigned=new Set();
  const next=[];
  for(const p of good){
    let best=-1, score=0;
    tracks.forEach((t,i)=>{
      if(assigned.has(i)||t.class!==p.class)return;
      const sim=intersectionOverUnion(t.bbox,p.bbox);
      if(sim>score&&sim>.28){score=sim;best=i;}
    });
    if(best>=0){assigned.add(best);const t=tracks[best];next.push({...p,hits:t.hits+1,missed:0});}
    else next.push({...p,hits:1,missed:0});
  }
  tracks.forEach((t,i)=>{if(!assigned.has(i)&&t.missed<1)next.push({...t,missed:t.missed+1});});
  tracks=next.slice(0,26);
  detections=tracks.filter(t=>t.missed===0&&t.hits>=(IMPORTANT.has(t.class)?3:2)).sort((a,b)=>b.score-a.score).slice(0,7);
  setStatus(detections.length?`${detections.length} FOUND`:'SCANNING');
  drawDetections();
}
async function scanObjects(){
  if(!running||!model||detectionBusy||video.readyState<2||!video.videoWidth)return;
  const epoch=scanEpoch;
  detectionBusy=true;
  try{
    const predictions=await model.detect(video,15);
    if(running&&epoch===scanEpoch)trackPredictions(predictions);
  }catch(e){console.warn('Object detection unavailable',e);if(epoch===scanEpoch)setStatus('AI ERROR');}
  finally{detectionBusy=false;}
}
// Text recognition is intentionally separate from the live camera overlay.
function filterOCR(data){
  const lines=Array.isArray(data.lines)?data.lines:[];
  let parts=lines.length?lines:(Array.isArray(data.words)?data.words:[]);
  const out=[];
  for(const part of parts){
    const confidence=Number(part.confidence??part.conf??0);
    if(confidence<76)continue;
    let t=String(part.text||'').replace(/\s+/g,' ').trim();
    if(t.length<3||t.length>68)continue;
    if(/\b(?:[A-Za-z]\s+){3,}[A-Za-z]\b/.test(t))continue;
    if((t.match(/[A-Za-z0-9]/g)||[]).length/Math.max(1,t.length)<.78)continue;
    if(/^[\W_]+$/.test(t))continue;
    if(targetMode.value==='entry'&&!/\b(exit|entrance|enter|door|stairs)\b/i.test(t))continue;
    // Don't display full card/account numbers in a public-facing OCR overlay.
    t=t.replace(/\b(?:\d[ -]?){8,19}\b/g,'•••• ••••');
    if(out.includes(t))continue;
    out.push({text:t,y:part.bbox?.y0??0,score:confidence});
  }
  out.sort((a,b)=>b.score-a.score);
  return out.slice(0,3).sort((a,b)=>a.y-b.y).map(p=>p.text);
}
async function getOCRWorker(){
  if(!ocrWorkerPromise){
    if(!window.Tesseract?.createWorker)throw new Error('Text AI library failed to load');
    ocrWorkerPromise=Tesseract.createWorker('eng',1).catch(e=>{ocrWorkerPromise=null;throw e;});
  }
  return ocrWorkerPromise;
}
async function scanText(){
  if(!running||!ocrEnabled||ocrBusy||!video.videoWidth)return;
  if(!['all','text','entry'].includes(targetMode.value))return;
  ocrBusy=true;
  const epoch=scanEpoch;
  try{
    const worker=await getOCRWorker();
    const c=document.createElement('canvas');
    const scale=Math.min(1,960/video.videoWidth);
    c.width=Math.round(video.videoWidth*scale);c.height=Math.round(video.videoHeight*scale);
    c.getContext('2d').drawImage(video,0,0,c.width,c.height);
    const out=await worker.recognize(c);
    if(epoch===scanEpoch&&running&&ocrEnabled){ocrLast=filterOCR(out.data);readLines(ocrLast);}
  }catch(err){
    console.warn('Text recognition failed',err);
    if(epoch===scanEpoch&&running)readMessage('Text scanner is unavailable.','Check internet access and reload if it does not recover.');
  }finally{ocrBusy=false;}
}
async function loadAI(){
  setStatus('LOADING');setMessage('Loading object recognition.');
  if(!window.cocoSsd?.load){setStatus('OFFLINE');setMessage('Object AI could not load. Check internet.');return;}
  try{model=await cocoSsd.load({base:'lite_mobilenet_v2'});setStatus('READY');setMessage('Camera ready. Labels require repeated matches.');}
  catch(e){console.warn(e);setStatus('OFFLINE');setMessage('Object AI unavailable; tap REFRESH AI after connecting.');}
}
function capabilities(){try{return currentTrack?.getCapabilities?.()||{}}catch{return {}}}
function setZoomTransforms(scale){
  video.style.transform=scale>1?`scale(${scale})`:'none';
  overlay.style.transform=scale>1?`scale(${scale})`:'none';
  video.style.transformOrigin=overlay.style.transformOrigin='50% 50%';
}
async function applyZoom(){
  if(!currentTrack)return;
  const relative=zoom/(isUltra?.5:1);
  const caps=capabilities();
  if(caps.zoom){
    setZoomTransforms(1);
    const val=Math.min(caps.zoom.max??relative,Math.max(caps.zoom.min??1,relative));
    try{await currentTrack.applyConstraints({advanced:[{zoom:val}]});return;}
    catch(e){console.warn('Optical/device zoom unavailable',e);}
  }
  setZoomTransforms(Math.max(1,relative));
}
function updateZoom(){
  const t=`${zoom.toFixed(1)}×`;zoomValue.textContent=t;magValue.textContent=t;
  presetBtns.forEach(b=>b.classList.toggle('active',Math.abs(Number(b.dataset.zoom)-zoom)<.06));
  applyZoom();
}
async function discoverCameras(){
  const devices=await navigator.mediaDevices.enumerateDevices();
  const found=devices.find(d=>d.kind==='videoinput'&&/ultra.?wide|0[.,]5\s*x/i.test(d.label));
  knownUltraDeviceId=found?.deviceId||null;
  const opt=[...cameraMode.options].find(o=>o.value==='rear-ultrawide');
  if(opt)opt.textContent=found?`Ultra-wide · ${found.label}`:'Ultra-wide (if available)';
}
async function getCameraStream(){
  const wantsUltra=cameraMode.value==='rear-ultrawide';
  if(wantsUltra&&!knownUltraDeviceId){
    cameraMode.value='rear-default';
    throw new Error('Safari did not expose an identifiable ultra-wide camera. Staying at 1×.');
  }
  return navigator.mediaDevices.getUserMedia({audio:false,video:wantsUltra?
    {deviceId:{exact:knownUltraDeviceId},width:{ideal:1280},height:{ideal:720}}:
    {facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
}
async function startCamera(){
  stopCamera();
  setMessage('Starting camera…');
  try{
    // Request access once so camera labels become visible, then choose the actual camera.
    if(!knownUltraDeviceId&&cameraMode.value==='rear-ultrawide'){
      const temp=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
      await discoverCameras();temp.getTracks().forEach(t=>t.stop());
    }
    stream=await getCameraStream();
    currentTrack=stream.getVideoTracks()[0];
    video.srcObject=stream;await video.play();
    running=true;isUltra=cameraMode.value==='rear-ultrawide';
    if(zoom<1&&!isUltra)zoom=1;
    if(isUltra&&zoom===1)zoom=.5;
    updateZoom();
    fitOverlay();
    startStopBtn.textContent='STOP CAMERA';
    setMessage('Camera on.');
    scanEpoch++;
    frameTimer=setInterval(scanObjects,950);
    ocrTimer=setInterval(scanText,8000);
    scanObjects();if(ocrEnabled)scanText();
    discoverCameras().catch(()=>{});
  }catch(err){
    console.warn(err);
    const msg=String(err.message||'Could not start camera');
    setMessage(msg);
    if(!isUltra){zoom=1;updateZoom();}
  }
}
function stopCamera(){
  running=false;scanEpoch++;
  clearInterval(frameTimer);clearInterval(ocrTimer);frameTimer=ocrTimer=null;
  stream?.getTracks().forEach(t=>t.stop());stream=null;currentTrack=null;
  video.srcObject=null;setZoomTransforms(1);
  tracks=[];detections=[];ctx.clearRect(0,0,overlay.clientWidth,overlay.clientHeight);
  setStatus(model?'READY':'OFF');startStopBtn.textContent='START CAMERA';
}
async function changeZoom(z){
  if(z<1){
    if(!isUltra){
      cameraMode.value='rear-ultrawide';
      await startCamera();
      if(!isUltra||!running){cameraMode.value='rear-default';zoom=1;updateZoom();setMessage('0.5× is unavailable: Safari did not expose the ultra-wide lens.');return;}
    }
    zoom=.5;
  }else zoom=Math.min(20,Math.max(1,z));
  updateZoom();
}
function setView(v){
  modeBtns.forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  currentView=v;
  video.style.filter='none';
  if(v==='night')video.style.filter='brightness(1.35) contrast(1.12) saturate(.85)';
  if(v==='thermal')video.style.filter='contrast(1.35) saturate(1.35) hue-rotate(-35deg)';
}
function savePhoto(){
  if(!running||!video.videoWidth)return;
  const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;
  const cctx=c.getContext('2d');cctx.filter=video.style.filter||'none';cctx.drawImage(video,0,0);
  cctx.filter='none';cctx.drawImage(overlay,0,0,c.width,c.height);
  const link=document.createElement('a');link.download=`recon-cam-v8-${Date.now()}.jpg`;link.href=c.toDataURL('image/jpeg',.92);link.click();
}

startStopBtn.onclick=()=>running?(stopCamera(),setMessage('Camera off. Tap START CAMERA.')):startCamera();
el('helpBtn').onclick=()=>helpDialog.showModal();el('closeHelpBtn').onclick=()=>helpDialog.close();
window.addEventListener('resize',fitOverlay);video.addEventListener('loadedmetadata',fitOverlay);
zoomSlider.min='1';
zoomSlider.addEventListener('input',()=>changeZoom(Number(zoomSlider.value)));
el('zoomInBtn').onclick=()=>changeZoom(zoom+.5);
el('zoomOutBtn').onclick=()=>changeZoom(zoom-.5);
presetBtns.forEach(b=>b.onclick=()=>changeZoom(Number(b.dataset.zoom)));
modeBtns.forEach(b=>b.onclick=()=>setView(b.dataset.view));
[lineStrength,labelSize,drawMode,colorMode].forEach(x=>x.addEventListener('input',drawDetections));
accuracyMode.addEventListener('change',()=>{tracks=[];detections=[];drawDetections();});
targetMode.addEventListener('change',()=>{tracks=[];detections=[];drawDetections();ocrLast=[];if(!['all','text','entry'].includes(targetMode.value))readMessage('Text reader paused in this target mode.','Choose All targets or Text / Numbers to read text.');else if(ocrEnabled)scanText();});
cameraMode.onchange=()=>{if(running)startCamera();};
ocrToggle.onclick=()=>{
  ocrEnabled=!ocrEnabled;ocrToggle.textContent=ocrEnabled?'ON · PAUSE':'OFF · RESUME';ocrToggle.setAttribute('aria-pressed',String(ocrEnabled));
  if(ocrEnabled){readMessage('Reading text…','Text appears here rather than across the image.');scanText();}
  else{ocrLast=[];readMessage('Text reading paused.','Automatic object labels remain active.');}
};
el('refreshBtn').onclick=loadAI;
el('photoBtn').onclick=savePhoto;
el('gpsBtn').onclick=()=>{
  if(!navigator.geolocation){setMessage('GPS unavailable');return;}
  navigator.geolocation.getCurrentPosition(p=>setMessage(`GPS ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)} · ±${Math.round(p.coords.accuracy)} m`),e=>setMessage(`GPS: ${e.message}`),{enableHighAccuracy:true,timeout:10000});
};
el('compassBtn').onclick=async()=>{
  try{if(typeof DeviceOrientationEvent.requestPermission==='function'){const p=await DeviceOrientationEvent.requestPermission();if(p!=='granted')throw Error('denied');}setMessage('Compass activated where supported.');}
  catch{setMessage('Compass permission unavailable or denied.');}
};
window.addEventListener('deviceorientation',e=>{
  const h=typeof e.webkitCompassHeading==='number'?e.webkitCompassHeading:typeof e.alpha==='number'?360-e.alpha:null;
  if(h!=null){const n=['N','NE','E','SE','S','SW','W','NW'];dirValue.textContent=`${n[Math.round(h/45)%8]} ${Math.round(h)}°`;}
});
videoWrap.addEventListener('touchmove',e=>{
  if(e.touches.length!==2)return;
  const a=e.touches[0],b=e.touches[1],d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
  if(!lastPinch)lastPinch={d,zoom};
  else {const z=Math.max(isUltra?.5:1,Math.min(20,lastPinch.zoom*d/lastPinch.d));zoom=z;zoomSlider.value=Math.max(1,zoom);updateZoom();}
},{passive:true});
videoWrap.addEventListener('touchend',()=>lastPinch=null,{passive:true});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
readMessage('Text reader ready. Start the camera.','Detected words will appear here, not on the picture.');
loadAI();
