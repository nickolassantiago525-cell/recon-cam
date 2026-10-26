/* Shared prediction geometry and conflict handling. No image leaves the browser. */
(function(root){
'use strict';
const TOOL_CLASSES=new Set(['knife','scissors','toothbrush','fork','spoon']);
const SUBJECT_CLASSES=new Set(['person','cat','dog']);
function isSubject(p){return SUBJECT_CLASSES.has(p.class)||p.class==='uncertain subject'}
// Only compare substantially overlapping subjects, not a pet beside its owner.
function sameSubject(a,b){return sameItem(a,b)&&iou(a,b)>.5}
function subjectDecision(proposal,results){
  const related=results.filter(p=>valid(p)&&SUBJECT_CLASSES.has(p.class)&&sameSubject(proposal.bbox,p.bbox)&&p.score>=.5);
  const choices=new Map([[proposal.class,{class:proposal.class,score:proposal.score}]]);
  for(const p of related)if(!choices.has(p.class)||choices.get(p.class).score<p.score)choices.set(p.class,{class:p.class,score:p.score});
  const ranked=[...choices.values()].sort((a,b)=>b.score-a.score);
  if(ranked.length>1){
    const best=ranked[0],runner=ranked[1];
    if(best.class!=='person'&&best.score>=.65&&best.score-runner.score>=.12){
      const animal=related.find(p=>p.class===best.class);
      if(animal)return {...animal,subjectVerified:true};
    }
    return {...proposal,class:'uncertain subject',alternatives:ranked,subjectVerified:false};
  }
  return {...proposal,subjectVerified:related.some(p=>p.class===proposal.class&&p.score>=.72)};
}
function valid(p){
  return p&&typeof p.class==='string'&&Number.isFinite(p.score)&&p.score>=0&&p.score<=1&&
    Array.isArray(p.bbox)&&p.bbox.length===4&&p.bbox.every(Number.isFinite)&&p.bbox[2]>=3&&p.bbox[3]>=3;
}
function iou(a,b){
  const w=Math.max(0,Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0]));
  const h=Math.max(0,Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1]));
  const area=w*h;return area/(a[2]*a[3]+b[2]*b[3]-area||1);
}
function sameItem(a,b){
  const ratio=Math.min(a[2]*a[3],b[2]*b[3])/Math.max(a[2]*a[3],b[2]*b[3]);
  return ratio>.42&&iou(a,b)>.45;
}
function isTool(p){return TOOL_CLASSES.has(p.class)||p.class==='uncertain tool'}
function alternatives(p){return p.alternatives||[{class:p.class,score:p.score}]}
function combine(a,b){
  const labels=new Map();
  for(const x of [...alternatives(a),...alternatives(b)]){
    if(!labels.has(x.class)||labels.get(x.class).score<x.score)labels.set(x.class,x);
  }
  const choices=[...labels.values()].sort((x,y)=>y.score-x.score);
  const best=a.score>=b.score?a:b;
  return {...best,class:choices.length>1?'uncertain tool':choices[0].class,alternatives:choices};
}
function consolidate(predictions){
  const out=[];
  for(const p of predictions.filter(valid).sort((a,b)=>b.score-a.score)){
    const existing=out.findIndex(t=>(t.class===p.class||isTool(t)&&isTool(p)||isSubject(t)&&isSubject(p)&&sameSubject(t.bbox,p.bbox))&&sameItem(t.bbox,p.bbox));
    if(existing<0)out.push({...p,bbox:p.bbox.slice()});
    else if(isTool(p))out[existing]=combine(out[existing],p);
    else if(isSubject(p)&&out[existing].class!==p.class){
      const merged=combine(out[existing],p);
      out[existing]={...merged,class:'uncertain subject',subjectVerified:false};
    }
  }
  return out;
}
function label(p){
  if(p.class==='uncertain subject')return 'Uncertain: '+alternatives(p).map(x=>x.class).join(' / ');
  if(p.class==='person'&&(!p.subjectVerified||p.score<.85))return 'Possible person';
  if(p.class==='mouse')return 'Computer mouse';
  if(p.class==='uncertain tool'){
    const names=alternatives(p).map(x=>x.class).slice(0,3);
    return 'Uncertain: '+names.join(' / ');
  }
  if(p.class==='knife')return 'Possible knife';
  if(isTool(p))return 'Possible '+p.class;
  return p.class.replace(/^\w/,a=>a.toUpperCase());
}
// Map a detector box on a rotated canvas back to its unrotated source.
function unrotate(box,angle,w,h){
  const [x,y,bw,bh]=box;
  if(angle===90)return [y,h-x-bw,bh,bw];
  if(angle===180)return [w-x-bw,h-y-bh,bw,bh];
  if(angle===270)return [w-y-bh,x,bh,bw];
  return box.slice();
}
function visibleCrop(vw,vh,sw,sh,zoom=1,fraction=.85){
  const cover=Math.max(sw/vw,sh/vh);
  const w=Math.min(vw,sw/cover/zoom)*fraction,h=Math.min(vh,sh/cover/zoom)*.62;
  return {x:(vw-w)/2,y:(vh-h)/2,w,h};
}
function refinementCrop(box,vw,vh){
  const [x,y,w,h]=box;
  const cw=Math.min(vw,w*1.2),ch=Math.min(vh,Math.max(h*1.6,cw*.33));
  return {x:Math.max(0,Math.min(vw-cw,x+w/2-cw/2)),y:Math.max(0,Math.min(vh-ch,y+h/2-ch/2)),w:cw,h:ch};
}
// A stronger independent crop result can replace a weak proposal, never just
// because the proposal's class was "toothbrush". Otherwise preserve the conflict.
function refineDecision(proposal,results){
  const related=results.filter(p=>valid(p)&&isTool(p)&&iou(proposal.bbox,p.bbox)>.3).sort((a,b)=>b.score-a.score);
  const best=related[0];
  if(!best)return [proposal];
  if(best.score>=.70&&best.score>=proposal.score+.18)return [best];
  return [proposal,...related];
}
function weaponGroups(results,cutoff){
  const groups=[];
  for(const r of results){
    if(!r||!Number.isFinite(r.score)||!r.box)continue;
    const b=r.box,box=[b.xmin,b.ymin,b.xmax-b.xmin,b.ymax-b.ymin];
    if(!valid({class:String(r.label),score:r.score,bbox:box}))continue;
    const name=/knife|blade/i.test(r.label)?'knife':/handgun|pistol/i.test(r.label)?'handgun':String(r.label);
    let group=groups.find(g=>sameItem(g.bbox,box));
    if(!group){group={bbox:box,choices:[]};groups.push(group)}
    const old=group.choices.find(x=>x.class===name);
    if(!old)group.choices.push({class:name,score:r.score});
    else old.score=Math.max(old.score,r.score);
  }
  const out=[];
  for(const g of groups){
    g.choices.sort((a,b)=>b.score-a.score);
    const best=g.choices[0],runner=g.choices[1];
    if(best.score<cutoff||!['knife','scissors','handgun','rifle','gun'].includes(best.class))continue;
    out.push({class:runner&&(runner.score>=best.score*.85||best.score-runner.score<.025)?best.class+' / '+runner.class+' (uncertain)':best.class,score:best.score,bbox:g.bbox});
  }
  return out.sort((a,b)=>b.score-a.score);
}
const api={TOOL_CLASSES,SUBJECT_CLASSES,isSubject,sameSubject,subjectDecision,valid,iou,sameItem,isTool,alternatives,combine,consolidate,label,unrotate,visibleCrop,refinementCrop,refineDecision,weaponGroups};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.ReconDetection=api;
})(typeof globalThis!=='undefined'?globalThis:this);
