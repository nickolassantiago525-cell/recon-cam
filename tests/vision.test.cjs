'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
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
 assert.match(html,/recon-cam-v12-5-/);
});
