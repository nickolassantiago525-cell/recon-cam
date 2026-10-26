'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const D=require('../detection.js');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const code=html.slice(html.indexOf('function updateTracks('),html.indexOf('function scheduleObjects('));
function tracker(){
  const S={tracks:[],generation:1};let now=1000;
  const context={D,S,performance:{now:()=>now},minConfidence:()=>.4,render:()=>{}};
  const update=vm.runInNewContext(code+';updateTracks',context);
  return {S,update,time:t=>{now=t}};
}
const p=(name,score=.8,bbox=[100,100,200,50])=>({class:name,score,bbox});
test('conflicting labels across frames share one track',()=>{
  const t=tracker();t.update([p('knife')]);t.time(2000);t.update([p('scissors')]);
  assert.equal(t.S.tracks.length,1);assert.equal(t.S.tracks[0].class,'uncertain tool');
});
test('a detailed focus result is not immediately overwritten by coarse classification',()=>{
  const t=tracker();t.update([p('knife')],true);t.time(2000);t.update([p('toothbrush')]);
  assert.equal(t.S.tracks[0].class,'knife');assert.equal(t.S.tracks[0].focus,true);
});
test('temporal conflicting alternatives expire',()=>{
  const t=tracker();t.update([p('knife')]);t.time(2000);t.update([p('scissors')]);
  t.time(9000);t.update([p('scissors')]);
  assert.equal(t.S.tracks[0].class,'scissors');
});
test('two same-frame proposals never count as repeated sightings',()=>{
  const t=tracker();t.update([p('knife'),p('knife',.7,[190,100,200,50])]);
  assert.ok(t.S.tracks.every(x=>x.hits===1));
});
test('camera-generation changes discard old tracks',()=>{
  const t=tracker();t.update([p('person')]);t.S.generation=2;t.update([p('car')]);
  assert.equal(t.S.tracks.length,1);assert.equal(t.S.tracks[0].class,'car');
});
test('people and cars still gain stable live tracks',()=>{
  const t=tracker();const preds=[p('person'),p('car',.9,[350,200,300,100])];
  t.update(preds);t.time(2000);t.update(preds);
  assert.equal(t.S.tracks.length,2);assert.ok(t.S.tracks.every(x=>x.hits===2));
});
test('new cat evidence removes an overlapping stale person immediately',()=>{
 const t=tracker();t.update([p('person')]);t.time(2000);t.update([p('person')]);
 t.time(3000);t.update([p('cat')]);
 assert.equal(t.S.tracks.length,1);assert.equal(t.S.tracks[0].class,'cat');
});
test('uncertainty removes a stale person but preserves a separate person',()=>{
 const t=tracker();t.update([p('person'),p('person',.9,[500,200,100,300])]);
 t.time(2000);t.update([{...p('uncertain subject'),alternatives:[{class:'person',score:.74},{class:'cat',score:.8}]}]);
 assert.equal(t.S.tracks.length,2);assert.equal(t.S.tracks.filter(x=>x.class==='person').length,1);
});
test('resolving uncertainty to a person requires fresh sightings',()=>{
 const t=tracker();t.update([p('uncertain subject')]);t.time(2000);t.update([p('uncertain subject')]);
 t.time(3000);t.update([p('person')]);assert.equal(t.S.tracks[0].hits,1);
});
