/* Runtime prompt groups for the optional OWL-ViT model. These are search labels,
   not a claim of trained or validated species, breed, or weapon coverage. */
(function(root){
 'use strict';
 const animals=new Set(['bird','cat','dog','horse','sheep','cow','elephant','bear','zebra','giraffe','snake','rat','rodent mouse','squirrel','rabbit','raccoon','opossum','deer','fox','coyote','lizard','turtle','alligator','frog']);
 const vehicles=new Set(['car','truck','bus','motorcycle','bicycle','airplane','train','boat','van','pickup truck','suv']);
 const packs={
  wildlife:{title:'Wildlife & rodents',labels:['snake','rat','rodent mouse','squirrel','rabbit','raccoon','opossum','deer','fox','coyote'],distractors:['computer mouse','rope','garden hose','toy animal']},
  reptiles:{title:'Snakes & reptiles',labels:['snake','lizard','turtle','alligator','frog'],distractors:['rope','garden hose','tree branch','toy animal']},
  pets:{title:'Cats, dogs & other animals',labels:['cat','dog','horse','cow','sheep','goat','pig','hamster','guinea pig','ferret'],distractors:['stuffed animal','toy dog','toy cat']},
  birds:{title:'Bird types',labels:['bird','pigeon','crow','sparrow','hawk','owl','duck','goose','chicken','parrot'],distractors:['toy bird','bird statue','leaf']},
  vehicles:{title:'People & vehicles',labels:['person','car','truck','bus','motorcycle','bicycle','van','pickup truck','suv','boat'],distractors:['toy car','person on a screen','human statue']},
  weapons:{title:'Possible weapons',labels:['serrated knife','bread knife','kitchen knife','folding knife','knife blade','scissors','handgun','pistol','rifle','shotgun'],distractors:['toothbrush','pen','spoon','cell phone','toy gun']},
  objects:{title:'More everyday objects',labels:['box','package','keys','wallet','shoe','flashlight','hammer','screwdriver','wrench','power drill'],distractors:['object in a printed photograph']}
 };
 const order=Object.keys(packs);
 function custom(text){
  return [...new Set(String(text||'').split(',').map(s=>s.toLowerCase().replace(/[^a-z0-9 -]/g,'').replace(/\s+/g,' ').trim().slice(0,40)).filter(Boolean))].slice(0,8);
 }
 function pack(key,text=''){
  if(key==='custom')return {title:'Custom labels',labels:custom(text),distractors:['toy object','object in a printed photograph']};
  return packs[key]||packs.wildlife;
 }
 function category(name,key){
  if(key==='birds')return 'birds';
  if(/\b(bird|pigeon|crow|sparrow|hawk|owl|duck|goose|chicken|parrot)\b/.test(name))return 'birds';
  if(key==='wildlife'||key==='reptiles'||key==='pets'||animals.has(name))return 'animals';
  if(key==='weapons')return 'weapons';
  if(/\b(cat|dog|snake|rat|rodent|hamster|ferret|goat|pig)\b/.test(name))return 'animals';
  if(name==='person'||name==='human')return 'people';
  if(/\b(knife|handgun|pistol|rifle|shotgun)\b/.test(name))return 'weapons';
  if(vehicles.has(name))return 'vehicles';
  return 'objects';
 }
 function matches(p,filter){
  const c=p.category||category(p.class,'');
  if(filter==='all')return true;
  if(filter==='people')return p.class==='person'||c==='people';
  if(filter==='living')return ['people','animals','birds','vehicles'].includes(c);
  if(filter==='animals')return ['animals','birds'].includes(c);
  if(filter==='birds')return c==='birds'||p.class==='bird';
  if(filter==='pets')return /\b(cat|dog)\b/.test(p.class)||p.pack==='pets';
  if(filter==='rodents')return ['rat','rodent mouse','squirrel','hamster','guinea pig'].includes(p.class)||/\b(rat|rodent)\b/.test(p.class);
  if(filter==='snakes')return /\bsnake\b/.test(p.class);
  if(filter==='vehicles')return c==='vehicles';
  if(filter==='weapons')return c==='weapons'||p.class==='knife';
  if(filter==='tools')return c==='weapons'||['knife','scissors','toothbrush','fork','spoon','uncertain tool','baseball bat','hammer','screwdriver','wrench','power drill'].includes(p.class);
  if(filter==='objects')return c==='objects';
  return false;
 }
 function resolve(results,key,cutoff,D,text=''){
  const config=pack(key,text),allowed=new Set(config.labels),groups=[];
  for(const r of results){
   if(!r?.box||typeof r.label!=='string')continue;
   const box=[r.box.xmin,r.box.ymin,r.box.xmax-r.box.xmin,r.box.ymax-r.box.ymin];
   if(!D.valid({class:r.label,score:r.score,bbox:box}))continue;
   let g=groups.find(g=>D.sameItem(g.bbox,box));
   if(!g){g={bbox:box,choices:[]};groups.push(g)}
   const old=g.choices.find(x=>x.class===r.label);
   if(old)old.score=Math.max(old.score,r.score);
   else g.choices.push({class:r.label,score:r.score});
  }
  return groups.flatMap(g=>{
   g.choices.sort((a,b)=>b.score-a.score);const [best,runner]=g.choices;
   if(best.score<cutoff||!allowed.has(best.class))return [];
   const uncertain=!!runner&&(runner.score>=best.score*.85||best.score-runner.score<.025);
   return [{class:best.class,score:best.score,bbox:g.bbox,category:category(best.class,key),pack:key,experimental:true,uncertain,alternatives:uncertain?g.choices.slice(0,2):[best]}];
  }).sort((a,b)=>b.score-a.score).slice(0,8);
 }
 function label(p){
  if(p.uncertain)return 'Uncertain: '+p.alternatives.map(x=>x.class).join(' / ');
  return 'Possible '+p.class;
 }
 const api={packs,order,animals,vehicles,custom,pack,category,matches,resolve,label};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ReconCatalog=api;
})(typeof window!=='undefined'?window:globalThis);
