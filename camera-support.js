(function(root){
 'use strict';
 function environmentIssue(win,doc,nav){
  try{
   const policy=doc.permissionsPolicy||doc.featurePolicy;
   if(win.origin==='null'||policy?.allowsFeature('camera')===false){
    return 'This embedded preview blocks camera access. Open the standalone camera site in Safari instead.';
   }
  }catch{/* Unsupported policy introspection is not itself a camera failure. */}
  if(!win.isSecureContext)return 'Camera access needs a secure page. Open Recon Cam directly in Safari over HTTPS.';
  if(!nav.mediaDevices?.getUserMedia)return 'Camera access is unavailable in this browser view. Open the standalone Recon Cam site in Safari and tap START.';
  return '';
 }
 function explain(error,embedded){
  const name=error?.name||'Error';
  if(name==='NotAllowedError'||name==='PermissionDeniedError'){
   return embedded?'Camera permission was denied or blocked by this embedded view. Open the standalone Recon Cam site in Safari and allow camera access.':'Camera permission is off. Allow camera access for this site in Safari, then tap START.';
  }
  if(name==='TypeError'||name==='SecurityError'){
   return embedded?'This browser preview could not open the camera. Open the standalone Recon Cam site in Safari, then tap START and Allow.':'Safari could not start the camera. Close other camera apps, check this site’s camera permission, and tap START again.';
  }
  if(name==='NotFoundError'||name==='DevicesNotFoundError')return 'No camera is available in this browser. Open Recon Cam on your phone in Safari.';
  if(name==='NotReadableError'||name==='TrackStartError')return 'The camera is busy or unavailable. Close other camera apps, then tap START again.';
  if(name==='OverconstrainedError'||name==='ConstraintNotSatisfiedError')return 'This camera does not support the requested settings. Try REAR CAMERA in Settings.';
  return 'Camera could not start. '+String(error?.message||'Try opening the standalone site in Safari.');
 }
 async function request(devices,constraints,allowFallback=true,isCurrent=()=>true){
  const attempts=[constraints];
  if(allowFallback)attempts.push({audio:false,video:{facingMode:{ideal:'environment'}}},{audio:false,video:true});
  for(let i=0;i<attempts.length;i++){
   if(!isCurrent())throw Object.assign(new Error('Camera request superseded'),{name:'AbortError'});
   try{return await devices.getUserMedia(attempts[i])}
   catch(e){
    if(!['TypeError','OverconstrainedError','ConstraintNotSatisfiedError'].includes(e?.name)||i===attempts.length-1)throw e;
   }
  }
 }
 function capabilities(track){try{return track?.getCapabilities?.()||{}}catch{return {}}}
 const api={environmentIssue,explain,request,capabilities};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.ReconCamera=api;
})(typeof window!=='undefined'?window:globalThis);
