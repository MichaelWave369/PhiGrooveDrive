// LIQ-H2: fair-comparison bench for LIQ-H1.
// Matched POSITIVE ACTUATOR MECHANICAL WORK (dimensionless), not electricity.
// No claim about gravity, antimatter, cosmology, energy recovery or propulsion.
import {configure as configureHelix, initialState, step, report} from "./helix-physics.mjs";

const bound=(v,lo,hi,fallback)=>v===null||v===undefined||v===""||!Number.isFinite(Number(v))?fallback:Math.max(lo,Math.min(hi,Number(v)));
export const CASES=Object.freeze([
 {id:"full",label:"Full nested mirror helix",mode:"one-sided"},
 {id:"no-rungs",label:"No inter-strand rungs",mode:"one-sided",rungK:0},
 {id:"no-nesting",label:"No inner/outer coupling",mode:"one-sided",nestedK:0},
 {id:"opposing",label:"Opposing phase drives",mode:"balanced"}
]);
export function settings(raw={}){
 const h=configureHelix(raw);
 return {...h,rungs:12,frequency:bound(raw.frequency,.2,1.5,.4),
   referenceDrive:bound(raw.referenceDrive,.04,1.5,.35),
   maxDrive:bound(raw.maxDrive,.02,2,1.5),
   periods:Math.round(bound(raw.periods,1,5,3)),
   dt:bound(raw.dt,1/600,1/60,1/120),
   tolerance:bound(raw.tolerance,.002,.02,.01)};
}
function actuatorPowers(s,p){
 if(p.mode==="off"||p.drive===0)return {positive:0,negative:0};
 let positive=0,negative=0;
 for(let i=0;i<p.rungs;i++){
   const f=p.drive*Math.sin(2*Math.PI*p.frequency*s.t-2*Math.PI*i/p.rungs);
   const a=f*s.va[i];
   positive+=Math.max(0,a);negative+=Math.max(0,-a);
   if(p.mode==="balanced"){
     const b=-f*s.vb[i];
     positive+=Math.max(0,b);negative+=Math.max(0,-b);
   }
 }
 return {positive,negative};
}
export function runScenario(raw={},overrides={}){
 const c=settings(raw);
 const p=configureHelix({...c,...overrides,drive:overrides.drive??c.referenceDrive,
    mode:overrides.mode??"one-sided"});
 const horizon=c.periods/p.frequency;
 const steps=Math.ceil(horizon/c.dt),dt=horizon/steps;
 let s=initialState(p),inGross=0,outGross=0;
 let prev=actuatorPowers(s,p);
 const stride=Math.max(1,Math.ceil(steps/90));
 const trace=[{t:0,...report(s,p)}];
 for(let i=0;i<steps;i++){
   s=step(s,p,dt);
   const now=actuatorPowers(s,p);
   inGross+=dt*.5*(now.positive+prev.positive);
   outGross+=dt*.5*(now.negative+prev.negative);
   prev=now;
   if((i+1)%stride===0||i===steps-1){
     const m=report(s,p);
     trace.push({t:s.t,mirrorScore:m.mirrorScore,nestedAlignment:m.nestedAlignment,total:m.total,work:m.work,energyResidual:m.energyResidual});
   }
 }
 const m=report(s,p);
 return {configuration:{...p,periods:c.periods,dt},metrics:{
    mirrorScore:m.mirrorScore,nestedAlignment:m.nestedAlignment,
    initialMirrorScore:trace[0].mirrorScore,
    mirrorChange:m.mirrorScore-trace[0].mirrorScore,
    initialNestedAlignment:trace[0].nestedAlignment,
    nestedChange:m.nestedAlignment-trace[0].nestedAlignment,
    totalEnergy:m.total,initialEnergy:s.initialEnergy,
    signedDriveWork:m.work,positiveWork:inGross,negativeWork:outGross,
    grossAccountingResidual:inGross-outGross-m.work,
    heat:m.heat,energyResidual:m.energyResidual,phaseChargeChange:m.chargeDrift,
    horizon},trace,
    provenance:{experiment:"LIQ-H2",origin:"SIMULATED",authority:"NONE",units:"dimensionless",
      workMatching:"integrated positive actuator mechanical work",
      calibration:false,electricalBus:false,gravityModel:false,
      antimatterModel:false,propulsionClaim:false}};
}
function withCase(c,id,drive){
 const arm=CASES.find(x=>x.id===id);
 if(!arm)throw new RangeError("Unknown comparison arm: "+id);
 return runScenario(c,{mode:arm.mode,rungK:arm.rungK??c.rungK,
   nestedK:arm.nestedK??c.nestedK,drive});
}
export function matchCase(raw={},caseId="no-rungs",target){
 const c=settings(raw);
 if(!CASES.some(x=>x.id===caseId))throw new RangeError("Unknown case");
 if(!Number.isFinite(target)||target<=1e-10)
   return {id:caseId,status:"NO_MATCH",reason:"Target positive work is zero or invalid",targetWork:target,trial:null};
 const cache=new Map();
 const evaluate=drive=>{
   const key=drive.toFixed(12);
   if(!cache.has(key))cache.set(key,withCase(c,caseId,drive));
   return cache.get(key);
 };
 let best=null;
 const consider=(amp)=>{
   const trial=evaluate(amp);
   const error=Math.abs(trial.metrics.positiveWork-target)/target;
   if(!best||error<best.error)best={amp,trial,error};
   return {amp,trial,error,delta:trial.metrics.positiveWork-target};
 };
 // Bracket locally rather than assuming response is globally monotonic.
 // A coarse scan finds sign-changing segments, then bisection refines each.
 const points=Array.from({length:13},(_,i)=>consider(c.maxDrive*i/12));
 const brackets=[];
 for(let i=0;i<points.length-1;i++)
   if(points[i].delta*points[i+1].delta<=0)brackets.push([points[i],points[i+1]]);
 for(let [left,right]of brackets){
   for(let j=0;j<16;j++){
     const mid=consider((left.amp+right.amp)/2);
     if(mid.error<=c.tolerance)break;
     if(left.delta*mid.delta<=0)right=mid;
     else left=mid;
   }
 }
 if(best.error>c.tolerance){
   return {id:caseId,status:"NO_MATCH",reason:"No drive amplitude within scanned bounds matches positive work at required tolerance",
     targetWork:target,limit:c.maxDrive,closestWork:best.trial.metrics.positiveWork,
     closestDrive:best.amp,closestRelativeError:best.error,trials:cache.size,trial:null};
 }
 return {id:caseId,status:"MATCHED",reason:null,targetWork:target,
   drive:best.amp,relativeError:best.error,trials:cache.size,trial:best.trial};
}
export function compare(raw={}){
 const c=settings(raw);
 const base=withCase(c,"full",c.referenceDrive);
 const target=base.metrics.positiveWork;
 const arms=[{id:"full",status:target>1e-10?"REFERENCE":"NO_MATCH",
   reason:target>1e-10?null:"Reference injected no positive mechanical work",
   drive:c.referenceDrive,relativeError:0,targetWork:target,trial:base}];
 for(const arm of CASES.slice(1))arms.push(matchCase(c,arm.id,target));
 return {settings:c,cases:arms,baselineGrossPositiveWork:target,
   meta:{experiment:"LIQ-H2",origin:"SIMULATED",authority:"NONE",
     metric:"gross positive actuator mechanical work",matchingTolerance:c.tolerance,
     matchingMethod:"drive scan plus local bracketed refinement",
     calibration:false,physicallyMeasured:false,hardwareEnergyRecovery:false,
     externalMomentumExchange:false,propulsionClaim:false,
     warning:"Equal modeled work is not equal real electrical input or experimental performance."}};
}
