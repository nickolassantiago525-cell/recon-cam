'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
test('view metadata is in Settings, not over the camera',()=>{
 const camera=html.slice(html.indexOf('<section class="feed"'),html.indexOf('<div class="hud top">'));
 assert.ok(!camera.includes('visionTop'));assert.ok(!camera.includes('visionBottom'));
 assert.ok(html.indexOf('id="visionSource"')>html.indexOf('id="sheet"'));
 assert.match(html,/VIEW DETAILS/);
 assert.match(html,/base:'mobilenet_v2'/);
 assert.ok(!html.includes("base:'lite_mobilenet_v2'"));
});
test('machine vision changes presentation without drawing on the inference source',()=>{
 const code=html.slice(html.indexOf('function setFilter('),html.indexOf('function setFilter(')+html.slice(html.indexOf('function setFilter(')).indexOf('\n'));
 const video={style:{}},document={body:{dataset:{}}};let renders=0;
 const setFilter=vm.runInNewContext(code+';setFilter',{video,document,render:()=>renders++});
 setFilter('terminator');assert.equal(document.body.dataset.vision,'terminator');
 assert.match(video.style.filter,/grayscale/);assert.equal(renders,1);
 for(const mode of ['normal','night','outline','thermal','terminator']){setFilter(mode);assert.equal(document.body.dataset.vision,mode)}
 setFilter('normal');assert.equal(video.style.filter,'none');
 assert.ok(!code.includes('drawImage'));assert.ok(!code.includes('S.model'));
});
test('machine vision starts by default and normal appearance remains available',()=>{
 assert.match(html,/<body data-vision="terminator">/);
 assert.match(html,/setFilter\('terminator'\)/);
 assert.match(html,/<option value="normal">Normal \/ natural color<\/option>/);
});
test('photo uses selected filter and new version with optical overlay',()=>{
 assert.match(html,/x\.filter=video\.style\.filter/);
 assert.match(html,/if\(machineVision\(\)\)machinePhoto\(x,W,H\)/);
 assert.match(html,/terminator-cam-v12-8-/);
});
test('bracket acquisition converges once per real track and respects reduced motion',()=>{
 const start=html.indexOf('function acquisitionProgress('),end=html.indexOf('function updateVision(',start);
 const hudMotion={matches:false},track={},hudLockTimes=new WeakMap();
 const phase=vm.runInNewContext(html.slice(start,end)+';acquisitionProgress',{hudMotion,hudLockTimes});
 assert.equal(phase(track,1000),0);
 assert.equal(phase(track,1210),.5);
 assert.equal(phase(track,1420),1);
 assert.equal(phase(track,1800),1);
 assert.equal(phase({},1800),0);
 hudMotion.matches=true;assert.equal(phase({},1900),1);
 assert.equal(phase(null,1900),1);
});
test('Terminator Cam branding covers the page, settings, photos and install name',()=>{
 assert.match(html,/<title>Terminator Cam V12.8/);
 assert.match(html,/<h1>TERMINATOR CAM<\/h1>/);
 assert.match(html,/Terminator Cam controls/);
 assert.match(html,/TERMINATOR CAM \/ MACHINE VISION/);
 assert.match(html,/terminator-cam-v12-8-/);
 assert.ok(!html.includes('Recon Cam controls'));
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../manifest.webmanifest'),'utf8'));
 assert.match(manifest.name,/^Terminator Cam/);
 assert.equal(manifest.short_name,'Terminator Cam');
});
