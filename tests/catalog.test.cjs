'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../recognition-catalog.js'),D=require('../detection.js');
const r=(label,score=.7,box={xmin:10,ymin:20,xmax:150,ymax:100})=>({label,score,box});
test('requested categories have real prompt paths',()=>{
 for(const name of ['snake','rat','rodent mouse','cat','dog','bird','person','car','rifle','shotgun','box']){
  assert.ok(Object.values(C.packs).some(p=>p.labels.includes(name)),name);
 }
});
test('every catalog pack resolves a positive result',()=>{
 for(const key of C.order){
  const name=C.packs[key].labels[0],out=C.resolve([r(name)],key,.12,D);
  assert.equal(out.length,1,key);assert.equal(out[0].class,name);
  assert.equal(out[0].experimental,true);assert.equal(C.matches(out[0],'all'),true);
 }
});
test('computer mouse is never displayed as an animal mouse',()=>{
 assert.equal(D.label({class:'mouse'}),'Computer mouse');
 assert.equal(C.matches({class:'mouse'},'animals'),false);
 assert.equal(C.matches({class:'mouse'},'rodents'),false);
 assert.equal(C.resolve([r('computer mouse')],'wildlife',.12,D).length,0);
});
test('animal mice and rats are eligible for rodent and animal filters',()=>{
 for(const name of ['rat','rodent mouse']){
  const [p]=C.resolve([r(name)],'wildlife',.12,D);
  assert.equal(C.matches(p,'rodents'),true);assert.equal(C.matches(p,'animals'),true);
  assert.equal(C.matches(p,'people'),false);
 }
});
test('all supported base animal and vehicle classes survive living filter',()=>{
 for(const name of [...C.animals,...C.vehicles,'person'])assert.equal(C.matches({class:name},'living'),true,name);
});
test('lookalike winner suppresses weaker snake, mouse or weapon guess',()=>{
 for(const [key,good,bad] of [['reptiles','snake','garden hose'],['wildlife','rodent mouse','computer mouse'],['weapons','handgun','toy gun']]){
  assert.equal(C.resolve([r(good,.6),r(bad,.8)],key,.12,D).length,0);
 }
});
test('close label conflicts are explicitly uncertain',()=>{
 const [p]=C.resolve([r('rat',.7),r('rodent mouse',.68)],'wildlife',.12,D);
 assert.equal(p.uncertain,true);assert.match(C.label(p),/^Uncertain: rat \/ rodent mouse/);
});
test('bird type conflicts do not make a confirmed species claim',()=>{
 const [p]=C.resolve([r('hawk',.7),r('owl',.69)],'birds',.12,D);
 assert.match(C.label(p),/Uncertain/);assert.equal(C.matches(p,'birds'),true);
});
test('custom labels normalize, deduplicate and limit workload',()=>{
 assert.deepEqual(C.custom(' Labrador dog, LABRADOR DOG, tabby cat, <script>'),['labrador dog','tabby cat','script']);
 assert.equal(C.custom(Array.from({length:12},(_,i)=>'label '+i).join(',')).length,8);
 assert.equal(C.resolve([r('labrador dog')],'custom',.12,D,'Labrador dog').length,1);
 const [dog]=C.resolve([r('labrador dog')],'custom',.12,D,'Labrador dog');
 assert.equal(C.matches(dog,'pets'),true);assert.equal(C.matches(dog,'animals'),true);
});
test('invalid, weak and unrequested results are never promoted',()=>{
 assert.equal(C.resolve([r('snake',.04),r('dragon',.9),r('snake',NaN)],'wildlife',.12,D).length,0);
});
test('separate animals remain independent detections',()=>{
 const out=C.resolve([r('rat'),r('rodent mouse',.65,{xmin:250,ymin:20,xmax:350,ymax:100})],'wildlife',.12,D);
 assert.equal(out.length,2);
});
