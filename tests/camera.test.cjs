'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../camera-support.js');
test('opaque preview reports blocking without trying to request camera',()=>{
 assert.match(C.environmentIssue({isSecureContext:true,origin:'null'},{},{mediaDevices:{getUserMedia(){}}}),/embedded preview blocks/);
});
test('permissions policy block is detected',()=>{
 assert.match(C.environmentIssue({isSecureContext:true,origin:'https://example.test'},{permissionsPolicy:{allowsFeature:()=>false}},{mediaDevices:{getUserMedia(){}}}),/standalone/);
});
test('unsupported policy API does not block an otherwise available camera',()=>{
 assert.equal(C.environmentIssue({isSecureContext:true,origin:'https://example.test'},{},{mediaDevices:{getUserMedia(){}}}),'');
});
test('insecure or missing camera API produces actionable explanation',()=>{
 assert.match(C.environmentIssue({isSecureContext:false},{},{}),/HTTPS/);
 assert.match(C.environmentIssue({isSecureContext:true,origin:'https://example.test'},{},{}),/Safari/);
});
test('TypeError falls back to simple rear-camera constraints',async()=>{
 const calls=[],stream={};const devices={getUserMedia:async c=>{calls.push(c);if(calls.length===1)throw new TypeError('Type error');return stream}};
 assert.equal(await C.request(devices,{video:{frameRate:{max:30}},audio:false}),stream);
 assert.equal(calls.length,2);assert.deepEqual(calls[1],{audio:false,video:{facingMode:{ideal:'environment'}}});
});
test('repeated constraint errors eventually try video true',async()=>{
 const calls=[];await C.request({getUserMedia:async c=>{calls.push(c);if(calls.length<3)throw Object.assign(Error(),{name:'OverconstrainedError'});return {}}},{video:{width:1920}});
 assert.equal(calls.length,3);assert.deepEqual(calls[2],{video:true,audio:false});
});
test('permission denial is never retried',async()=>{
 let n=0;await assert.rejects(C.request({getUserMedia:async()=>{n++;throw Object.assign(Error(),{name:'NotAllowedError'})}},{video:true}));
 assert.equal(n,1);
});
test('explicit ultra-wide camera selection does not silently select another device',async()=>{
 let n=0;await assert.rejects(C.request({getUserMedia:async()=>{n++;throw new TypeError()}},{video:{deviceId:{exact:'ultra'}}},false));assert.equal(n,1);
});
test('superseded camera request does not retry',async()=>{
 let n=0;await assert.rejects(C.request({getUserMedia:async()=>{n++;throw new TypeError()}},{video:true},true,()=>n===0));assert.equal(n,1);
});
test('optional capabilities failure safely falls back to display zoom',()=>{
 assert.deepEqual(C.capabilities({getCapabilities(){throw new TypeError('unsupported')}}),{});
});
test('generic Safari Type error is explained for standalone and embedded views',()=>{
 assert.match(C.explain(new TypeError('Type error'),true),/standalone/);
 assert.match(C.explain(new TypeError('Type error'),false),/camera permission/);
});
test('blocked preview replaces ineffective permission request with standalone help',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const start=html.indexOf('function cameraHelp('),end=html.indexOf('\nfunction system(',start);
 const nodes={},$=id=>nodes[id]||(nodes[id]={scrollTop:90});
 const help=vm.runInNewContext(html.slice(start,end)+';cameraHelp',{$,notify:{timer:0},msg:{},clearTimeout(){}});
 help('Embedded camera is blocked',true);
 assert.equal(nodes.enableCameraBtn.hidden,true);
 assert.equal(nodes.standaloneCameraHelp.hidden,false);
 assert.equal(nodes.startBtn.disabled,true);
 assert.equal(nodes.cameraPermissionTitle.textContent,'OPEN IN SAFARI');
 assert.equal(nodes.cameraPermissionBox.scrollTop,0);
 help('Allow camera access',false);
 assert.equal(nodes.enableCameraBtn.hidden,false);
 assert.equal(nodes.standaloneCameraHelp.hidden,true);
 assert.equal(nodes.startBtn.disabled,false);
});
