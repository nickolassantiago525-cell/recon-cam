'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../detection.js');
const p=(name,score=.75,bbox=[100,100,200,45])=>({class:name,score,bbox});
test('rejects malformed geometry and scores',()=>{
  for(const bad of [null,p('knife',NaN),p('knife',1.1),p('knife',.9,[0,0,NaN,5]),p('knife',.9,[0,0,-5,5]),p('knife',.9,[0,0,20])])assert.ok(!D.valid(bad));
});
test('same-object knife and scissors produce one uncertain box',()=>{
  const out=D.consolidate([p('knife'),p('scissors',.72,[105,99,195,48])]);
  assert.equal(out.length,1);assert.equal(out[0].class,'uncertain tool');
  assert.match(D.label(out[0]),/knife.*scissors/);
});
test('toothbrush alone is not renamed to a knife',()=>{
  assert.equal(D.consolidate([p('toothbrush')])[0].class,'toothbrush');
  assert.equal(D.label(p('toothbrush')),'Possible toothbrush');
});
test('different nearby knives are not merged',()=>{
  assert.equal(D.consolidate([p('knife'),p('knife',.8,[110,200,200,45])]).length,2);
});
test('person and car detections survive tool reconciliation',()=>{
  const out=D.consolidate([p('knife'),p('scissors'),p('person',.9),p('car',.9)]);
  assert.equal(out.length,3);assert.ok(out.some(x=>x.class==='person'));assert.ok(out.some(x=>x.class==='car'));
});
test('duplicate predictions in one pass consolidate',()=>{
  assert.equal(D.consolidate([p('knife'),p('knife',.7)]).length,1);
});
test('rotated coordinates return to original pixels',()=>{
  const original=[20,30,70,40],w=300,h=200;
  assert.deepEqual(D.unrotate([130,20,40,70],90,w,h),original);
  assert.deepEqual(D.unrotate([210,130,70,40],180,w,h),original);
  assert.deepEqual(D.unrotate([30,210,40,70],270,w,h),original);
  assert.deepEqual(D.unrotate(original,0,w,h),original);
});
test('center crop accounts for object-fit cover and CSS zoom',()=>{
  const c=D.visibleCrop(1920,1080,375,812,2);
  assert.ok(c.x>=0&&c.y>=0&&c.x+c.w<=1920&&c.y+c.h<=1080);
  assert.ok(c.w<375);assert.ok(c.h<540);
});
test('candidate crop includes a narrow blade and stays within frame',()=>{
  const c=D.refinementCrop([5,5,300,30],640,480);
  assert.ok(c.x>=0&&c.y>=0&&c.x+c.w<=640&&c.y+c.h<=480);
  assert.ok(c.h>=c.w*.33);
});
test('independent strong crop may replace weak mistaken proposal',()=>{
  assert.equal(D.refineDecision(p('toothbrush',.45),[p('knife',.83)])[0].class,'knife');
});
test('weak crop retains uncertainty rather than forcing knife label',()=>{
  assert.equal(D.refineDecision(p('toothbrush',.65),[p('knife',.66)]).length,2);
  assert.equal(D.refineDecision(p('toothbrush',.65),[])[0].class,'toothbrush');
});
const r=(label,score,box={xmin:100,ymin:100,xmax:300,ymax:145})=>({label,score,box});
test('weapon prompt synonyms collapse to a single knife result',()=>{
  const out=D.weaponGroups([r('serrated knife',.25),r('kitchen knife',.23)],.12);
  assert.equal(out.length,1);assert.equal(out[0].class,'knife');
});
test('nonweapon winner vetoes weaker weapon guess',()=>{
  assert.deepEqual(D.weaponGroups([r('toothbrush',.3),r('kitchen knife',.2)],.12),[]);
});
test('near-tied weapon and distractor are explicitly uncertain',()=>{
  assert.match(D.weaponGroups([r('serrated knife',.16),r('pen',.14)],.12)[0].class,/uncertain/);
});
test('weak experimental output never draws a candidate',()=>{
  assert.deepEqual(D.weaponGroups([r('serrated knife',.06)],.12),[]);
});
