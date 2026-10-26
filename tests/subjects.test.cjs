'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../detection.js'),C=require('../recognition-catalog.js');
const p=(name,score=.74,bbox=[100,100,220,250])=>({class:name,score,bbox});
test('cat/person disagreement is uncertain, not an asserted person',()=>{
 const r=D.subjectDecision(p('person'),[p('cat',.79)]);
 assert.equal(r.class,'uncertain subject');assert.match(D.label(r),/Uncertain:.*cat/);
 assert.equal(C.matches(r,'pets'),true);assert.equal(C.matches(r,'people'),true);
});
test('stronger cat evidence can replace the weak person proposal',()=>{
 const r=D.subjectDecision(p('person',.6),[p('cat',.9)]);
 assert.equal(r.class,'cat');assert.equal(r.subjectVerified,true);
});
test('no pet evidence never invents a cat',()=>{
 const r=D.subjectDecision(p('person'),[]);
 assert.equal(r.class,'person');assert.equal(r.subjectVerified,false);
 assert.equal(D.label(r),'Possible person');
});
test('even a high score alone remains a possible person',()=>{
 assert.equal(D.label(D.subjectDecision(p('person',.96),[])),'Possible person');
});
test('corroborated high-score person is retained',()=>{
 const r=D.subjectDecision(p('person',.92),[p('person',.9)]);
 assert.equal(r.class,'person');assert.equal(D.label(r),'Person');
});
test('a nearby cat does not relabel a separate person',()=>{
 const r=D.subjectDecision(p('person',.92),[p('cat',.99,[350,200,120,100]),p('person',.9)]);
 assert.equal(r.class,'person');assert.equal(r.subjectVerified,true);
});
test('empty, invalid and low-score follow-up results do not corroborate',()=>{
 for(const results of [[],[p('person',.2)],[p('person',NaN)],[p('person',.9,[1,1,0,0])]]){
  assert.equal(D.subjectDecision(p('person'),results).subjectVerified,false);
 }
});
test('same-frame overlapping subject conflicts produce only one uncertain box',()=>{
 const result=D.consolidate([p('person'),p('cat',.79)]);
 assert.equal(result.length,1);assert.equal(result[0].class,'uncertain subject');
});
