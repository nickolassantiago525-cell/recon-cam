const videoWrap = document.getElementById('videoWrap');
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const overlayMsg = document.getElementById('overlayMsg');
const startStopBtn = document.getElementById('startStopBtn');
const helpBtn = document.getElementById('helpBtn');
const helpDialog = document.getElementById('helpDialog');
const closeHelpBtn = document.getElementById('closeHelpBtn');
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');
const magValue = document.getElementById('magValue');
const detectValue = document.getElementById('detectValue');
const dirValue = document.getElementById('dirValue');
const lineStrength = document.getElementById('lineStrength');
const labelSize = document.getElementById('labelSize');
const targetMode = document.getElementById('targetMode');
const drawMode = document.getElementById('drawMode');
const colorMode = document.getElementById('colorMode');
const cameraMode = document.getElementById('cameraMode');
const gpsBtn = document.getElementById('gpsBtn');
const compassBtn = document.getElementById('compassBtn');
const photoBtn = document.getElementById('photoBtn');
const refreshBtn = document.getElementById('refreshBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const noteBox = document.getElementById('noteBox');
const presetBtns = [...document.querySelectorAll('.preset')];
const modeBtns = [...document.querySelectorAll('.modeBtn')];

let stream = null;
let model = null;
let detectTimer = null;
let ocrTimer = null;
let running = false;
let currentView = 'normal';
let currentZoom = 1;
let currentTrack = null;
let deviceDirection = '—';
let ocrBusy = false;
let lastDetections = [];
let cameraFacing = 'rear-default';

const SUPPORTED_CLASSES = {
  all: ['person','dog','cat','bird','horse','sheep','cow','elephant','bear','zebra','giraffe','car','bus','truck','motorcycle','bicycle','boat','cell phone','laptop','tv','remote','keyboard','mouse','bottle','cup','chair','book','backpack','handbag','suitcase'],
  living: ['person','dog','cat','bird','horse','sheep','cow','elephant','bear','zebra','giraffe','car','bus','truck','motorcycle','bicycle','boat'],
  electronics: ['cell phone','laptop','tv','remote','keyboard','mouse'],
  text: [],
  entry: [],
  money: []
};
const COLOR_MAP = {
  person: '#77ff66', dog: '#77ff66', cat: '#77ff66', bird: '#77ff66', horse: '#77ff66', sheep: '#77ff66', cow:'#77ff66', elephant:'#77ff66', bear:'#77ff66', zebra:'#77ff66', giraffe:'#77ff66',
  car: '#ff6060', bus:'#ff6060', truck:'#ff6060', motorcycle:'#ff6060', bicycle:'#ffce45', boat:'#ff6060',
  'cell phone':'#f8e85a', laptop:'#f8e85a', tv:'#f8e85a', remote:'#f8e85a', keyboard:'#f8e85a', mouse:'#f8e85a',
  bottle:'#66f0ff', cup:'#66f0ff', chair:'#c87bff', book:'#c87bff', backpack:'#c87bff', handbag:'#c87bff', suitcase:'#c87bff',
  text:'#66d0ff', exit:'#66d0ff', money:'#f8e85a'
};

function setMessage(msg){ overlayMsg.textContent = msg; }
function resizeCanvas(){ overlay.width = video.clientWidth * devicePixelRatio; overlay.height = video.clientHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
function applyView(){
  video.style.filter = 'none';
  if(currentView === 'night') video.style.filter = 'brightness(1.15) contrast(1.18) saturate(0.9)';
  if(currentView === 'thermal') video.style.filter = 'contrast(1.22) saturate(1.3) hue-rotate(-35deg)';
}
function updateZoomUI(){ zoomValue.textContent = `${currentZoom.toFixed(1)}×`; magValue.textContent = `${currentZoom.toFixed(1)}×`; }
function selectPresetButton(){ presetBtns.forEach(b=>b.classList.toggle('active', Math.abs(parseFloat(b.dataset.zoom)-currentZoom)<0.06)); }
function updateDetectionStatus(text){ detectValue.textContent = text; }
function getChosenColor(cls){
  if(colorMode.value==='green') return '#7CFF4C';
  if(colorMode.value==='yellow') return '#FFE34D';
  if(colorMode.value==='red') return '#FF5B5B';
  return COLOR_MAP[cls] || '#7CFF4C';
}
function roundedRect(x,y,w,h,r){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
function drawDetections(){
  ctx.clearRect(0,0,overlay.clientWidth,overlay.clientHeight);
  const lineW = Number(lineStrength.value);
  const fontSize = Number(labelSize.value);
  const sx = overlay.clientWidth / video.videoWidth || 1;
  const sy = overlay.clientHeight / video.videoHeight || 1;
  for(const det of lastDetections){
    const [x,y,w,h] = det.bbox;
    const dx = x*sx, dy=y*sy, dw=w*sx, dh=h*sy;
    const color = getChosenColor(det.class);
    ctx.lineWidth = lineW;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    if(drawMode.value !== 'label'){
      roundedRect(dx,dy,dw,dh,12);
      ctx.stroke();
      if(drawMode.value === 'both'){
        const corner = Math.max(14, Math.min(dw,dh)*0.12);
        ctx.beginPath();
        // corners
        ctx.moveTo(dx, dy+corner); ctx.lineTo(dx, dy); ctx.lineTo(dx+corner, dy);
        ctx.moveTo(dx+dw-corner, dy); ctx.lineTo(dx+dw, dy); ctx.lineTo(dx+dw, dy+corner);
        ctx.moveTo(dx, dy+dh-corner); ctx.lineTo(dx, dy+dh); ctx.lineTo(dx+corner, dy+dh);
        ctx.moveTo(dx+dw-corner, dy+dh); ctx.lineTo(dx+dw, dy+dh); ctx.lineTo(dx+dw, dy+dh-corner);
        ctx.stroke();
      }
    }
    const label = det.score ? `${det.label || det.class} ${(det.score*100).toFixed(0)}%` : (det.label || det.class);
    ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;
    const tw = ctx.measureText(label).width + 18;
    const th = fontSize + 12;
    const ly = Math.max(6, dy - th - 4);
    roundedRect(dx, ly, tw, th, 10);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0A130A';
    ctx.fillText(label, dx + 9, ly + fontSize + 1);
  }
}
function filterByMode(preds){
  const mode = targetMode.value;
  if(mode === 'text' || mode === 'entry' || mode === 'money') return preds.filter(()=>false);
  const classes = SUPPORTED_CLASSES[mode] || SUPPORTED_CLASSES.all;
  return preds.filter(p => classes.includes(p.class) && p.score > 0.45);
}
function enrichTextDetections(words){
  const mode = targetMode.value;
  if(!(mode === 'text' || mode === 'entry' || mode === 'all')) return [];
  return words.filter(w => w.text && w.text.trim().length > 1).map(w => {
    const txt = w.text.trim();
    const isExit = /exit|entrance|door/i.test(txt);
    if(mode === 'entry' && !isExit) return null;
    return {
      class: isExit ? 'exit' : 'text',
      label: txt.slice(0,18),
      score: null,
      bbox: [w.bbox.x0, w.bbox.y0, Math.max(10, w.bbox.x1 - w.bbox.x0), Math.max(10, w.bbox.y1 - w.bbox.y0)]
    };
  }).filter(Boolean);
}
async function runOCR(){
  if(!running || ocrBusy || !video.videoWidth) return;
  const mode = targetMode.value;
  if(!['text','entry','all'].includes(mode)) return;
  ocrBusy = true;
  try{
    const snap = document.createElement('canvas');
    snap.width = video.videoWidth; snap.height = video.videoHeight;
    const sctx = snap.getContext('2d');
    sctx.drawImage(video,0,0,snap.width,snap.height);
    const { data } = await Tesseract.recognize(snap, 'eng', { logger: ()=>{} });
    const textDets = enrichTextDetections(data.words || []);
    // merge: keep non-text + new text blocks
    const nonText = lastDetections.filter(d => d.class !== 'text' && d.class !== 'exit');
    lastDetections = [...nonText, ...textDets];
    drawDetections();
  }catch(err){ console.error(err); }
  ocrBusy = false;
}
async function detectionLoop(){
  if(!running || !model || video.readyState < 2) return;
  try{
    const preds = await model.detect(video, 18);
    lastDetections = filterByMode(preds);
    if(targetMode.value === 'money'){
      // Experimental heuristics: just relabel phone/book/card-sized items if found.
      lastDetections = preds.filter(p => ['cell phone','book','remote'].includes(p.class) && p.score > 0.35).map(p=>({...p, label:'possible card/cash item'}));
    }
    drawDetections();
    updateDetectionStatus(lastDetections.length ? `${lastDetections.length} TARGETS` : 'SCANNING');
  }catch(err){
    console.error(err);
    updateDetectionStatus('AI ERROR');
  }
}
async function loadAI(){
  updateDetectionStatus('LOADING');
  setMessage('Loading AI models... first run may take a moment.');
  try{
    model = await cocoSsd.load({base:'lite_mobilenet_v2'});
    updateDetectionStatus('READY');
    setMessage('AI ready. Normal camera with strong target highlights.');
  }catch(err){
    console.error(err);
    updateDetectionStatus('OFFLINE');
    setMessage('Could not load AI. Check internet, then tap REFRESH AI. Camera can still run.');
  }
}
function getTrackCapabilitiesSafe(track){ try { return track.getCapabilities ? track.getCapabilities() : {}; } catch { return {}; } }
async function applyTrackZoom(){
  if(!currentTrack) return;
  const caps = getTrackCapabilitiesSafe(currentTrack);
  if(caps.zoom){
    const z = Math.max(caps.zoom.min || 1, Math.min(caps.zoom.max || currentZoom, currentZoom));
    try { await currentTrack.applyConstraints({advanced:[{zoom:z}]}); } catch(e){ console.warn(e); }
  } else {
    video.style.transform = `scale(${Math.max(1, currentZoom)})`;
    video.style.transformOrigin = 'center center';
  }
}
async function startCamera(){
  stopCamera();
  setMessage('Starting camera...');
  const wantUltra = cameraMode.value === 'rear-ultrawide';
  cameraFacing = cameraMode.value;
  const tryConstraints = [];
  if(wantUltra){
    tryConstraints.push({video:{facingMode:{ideal:'environment'}, width:{ideal:1920}, height:{ideal:1080}, advanced:[{focalLengthX:0.5}]}, audio:false});
    tryConstraints.push({video:{facingMode:{ideal:'environment'}, width:{ideal:1920}, height:{ideal:1080}}, audio:false});
  } else {
    tryConstraints.push({video:{facingMode:{ideal:'environment'}, width:{ideal:1920}, height:{ideal:1080}}, audio:false});
  }
  let lastErr;
  for(const constraints of tryConstraints){
    try{
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      break;
    }catch(err){ lastErr = err; }
  }
  if(!stream){
    setMessage('Camera access failed. Check Safari camera permissions.');
    throw lastErr || new Error('camera failed');
  }
  video.srcObject = stream;
  currentTrack = stream.getVideoTracks()[0];
  await video.play();
  resizeCanvas();
  running = true;
  startStopBtn.textContent = 'STOP CAMERA';
  setMessage(wantUltra ? 'Ultra-wide requested. If available, 0.5× is active.' : 'Camera on.');
  applyView();
  updateZoomUI();
  await applyTrackZoom();
  detectTimer = setInterval(detectionLoop, 900);
  ocrTimer = setInterval(runOCR, 3500);
  detectionLoop();
}
function stopCamera(){
  running = false;
  if(detectTimer) clearInterval(detectTimer);
  if(ocrTimer) clearInterval(ocrTimer);
  detectTimer = null; ocrTimer = null;
  if(stream){ stream.getTracks().forEach(t=>t.stop()); }
  stream = null; currentTrack = null; lastDetections = [];
  if(video) video.srcObject = null;
  ctx.clearRect(0,0,overlay.width,overlay.height);
  startStopBtn.textContent = 'START CAMERA';
  updateDetectionStatus('OFF');
  setMessage('Camera off. Tap START CAMERA.');
}
function syncPreset(v){ currentZoom = v; zoomSlider.value = v; updateZoomUI(); selectPresetButton(); applyTrackZoom(); }

startStopBtn.addEventListener('click', async ()=>{
  try{
    if(running) stopCamera(); else await startCamera();
  }catch(err){ console.error(err); }
});
helpBtn.addEventListener('click',()=>helpDialog.showModal());
closeHelpBtn.addEventListener('click',()=>helpDialog.close());
window.addEventListener('resize',resizeCanvas);
video.addEventListener('loadedmetadata',resizeCanvas);
zoomSlider.addEventListener('input',()=>{ currentZoom = parseFloat(zoomSlider.value); updateZoomUI(); selectPresetButton(); applyTrackZoom(); });
zoomInBtn.addEventListener('click',()=>{ currentZoom = Math.min(20, +(currentZoom+0.5).toFixed(1)); syncPreset(currentZoom); });
zoomOutBtn.addEventListener('click',()=>{ currentZoom = Math.max(0.5, +(currentZoom-0.5).toFixed(1)); syncPreset(currentZoom); });
presetBtns.forEach(btn=>btn.addEventListener('click',()=> syncPreset(parseFloat(btn.dataset.zoom))));
modeBtns.forEach(btn=>btn.addEventListener('click',()=>{
  modeBtns.forEach(b=>b.classList.remove('active')); btn.classList.add('active'); currentView = btn.dataset.view; applyView();
}));
[colorMode, drawMode, lineStrength, labelSize, targetMode].forEach(el=>el.addEventListener('change',()=>{ drawDetections(); detectionLoop(); }));
cameraMode.addEventListener('change', async ()=>{ if(running){ await startCamera(); }});
refreshBtn.addEventListener('click', loadAI);
photoBtn.addEventListener('click',()=>{
  if(!running || !video.videoWidth) return;
  const snap = document.createElement('canvas'); snap.width = video.videoWidth; snap.height = video.videoHeight;
  const sctx = snap.getContext('2d');
  sctx.filter = video.style.filter || 'none';
  sctx.drawImage(video,0,0,snap.width,snap.height);
  // draw overlay scaled
  sctx.drawImage(overlay,0,0,snap.width,snap.height);
  const a = document.createElement('a'); a.href = snap.toDataURL('image/jpeg',0.92); a.download = `reconcam-v7-${Date.now()}.jpg`; a.click();
});
gpsBtn.addEventListener('click',()=>{
  if(!navigator.geolocation) return setMessage('GPS not supported in this browser.');
  navigator.geolocation.getCurrentPosition(pos=>{
    setMessage(`GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} accuracy ${Math.round(pos.coords.accuracy)} m`);
  },err=> setMessage(`GPS error: ${err.message}`), {enableHighAccuracy:true, timeout:10000});
});
compassBtn.addEventListener('click', async ()=>{
  try{
    if(typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function'){
      const res = await DeviceOrientationEvent.requestPermission();
      if(res !== 'granted') throw new Error('permission denied');
    }
    setMessage('Compass enabled if supported. Turn device to update direction.');
  }catch(err){ setMessage('Compass permission denied or unsupported.'); }
});
window.addEventListener('deviceorientation', (e)=>{
  let heading = null;
  if(typeof e.webkitCompassHeading === 'number') heading = e.webkitCompassHeading;
  else if(typeof e.alpha === 'number') heading = 360 - e.alpha;
  if(heading != null){
    const dirs = ['N','NE','E','SE','S','SW','W','NW'];
    const i = Math.round(((heading%360)+360)%360 / 45) % 8;
    deviceDirection = `${dirs[i]} ${Math.round(heading)}°`;
    dirValue.textContent = deviceDirection;
  }
});
videoWrap.addEventListener('touchmove', (e)=>{
  if(e.touches.length===2){
    const [a,b] = [e.touches[0], e.touches[1]];
    const dist = Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
    if(!window._pinchStart){ window._pinchStart = {dist, zoom: currentZoom}; }
    const factor = dist / window._pinchStart.dist;
    currentZoom = Math.max(0.5, Math.min(20, +(window._pinchStart.zoom * factor).toFixed(1)));
    zoomSlider.value = currentZoom; updateZoomUI(); selectPresetButton(); applyTrackZoom();
  }
}, {passive:true});
videoWrap.addEventListener('touchend', ()=>{ window._pinchStart = null; }, {passive:true});
if('serviceWorker' in navigator){ window.addEventListener('load', ()=>navigator.serviceWorker.register('./sw.js').catch(()=>{})); }
loadAI();
