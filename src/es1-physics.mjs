// LIQ-ES1: deliberately simplified 1-D point-charge null model.
// SIMULATED ONLY: fixed point charges, not voltage-controlled conductors,
// finite electrodes, high voltage hardware, Maxwell solver or a real thruster.
export const COULOMB_K = 8.9875517923e9; // N m^2 / C^2
export const DEFAULTS = Object.freeze({
  spacingCm: 5, asymmetry: 1.3, chargeNC: 20,
  wallChargeNC: 25, wallGapCm: 8, mode: "isolated",
  mirror: false
});
const finite=(x,fallback)=>Number.isFinite(Number(x))?Number(x):fallback;
const limit=(x,min,max)=>Math.min(max,Math.max(min,x));
const round=(x)=>Number(x.toPrecision(12));
export function configure(input={}) {
  return {
    spacingCm:limit(finite(input.spacingCm,DEFAULTS.spacingCm),2,20),
    asymmetry:limit(finite(input.asymmetry,DEFAULTS.asymmetry),0.5,2),
    chargeNC:limit(finite(input.chargeNC,DEFAULTS.chargeNC),1,100),
    wallChargeNC:limit(finite(input.wallChargeNC,DEFAULTS.wallChargeNC),0,100),
    wallGapCm:limit(finite(input.wallGapCm,DEFAULTS.wallGapCm),3,30),
    mode:input.mode==="wall"?"wall":"isolated",
    mirror:input.mirror===true
  };
}
export function layout(input={}) {
  const p=configure(input),d=p.spacingCm*0.01,sign=p.mirror?-1:1;
  const q=p.chargeNC*1e-9;
  // The electrode charges are assigned, not solved from an imposed voltage.
  const electrodes=[
    {id:"A",x:-d*sign,q},
    {id:"B",x:0,q:-q},
    {id:"C",x:d*p.asymmetry*sign,q:0.75*q}
  ];
  const rightmost=Math.max(...electrodes.map(e=>e.x));
  // External fixed charged object represents a chamber/fixture interaction.
  const wall={x:rightmost+p.wallGapCm*0.01,q:p.wallChargeNC*1e-9};
  return {settings:p,electrodes,wall};
}
export function coulombForce(q1,q2,x1,x2) {
  const dx=x1-x2;
  if (!Number.isFinite(dx)||Math.abs(dx)<1e-12) throw new RangeError("Distinct finite locations required");
  return COULOMB_K*q1*q2*Math.sign(dx)/(dx*dx);
}
export function evaluate(input={}) {
  const {settings,electrodes,wall}=layout(input),n=electrodes.length;
  const internal=Array(n).fill(0),external=Array(n).fill(0),pairs=[];
  let internalPotential=0,externalPotential=0;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
    const a=electrodes[i],b=electrodes[j];
    const force=coulombForce(a.q,b.q,a.x,b.x);
    internal[i]+=force;internal[j]-=force;
    internalPotential+=COULOMB_K*a.q*b.q/Math.abs(a.x-b.x);
    pairs.push({a:a.id,b:b.id,onA_N:force,onB_N:-force});
  }
  if(settings.mode==="wall") {
    for(let i=0;i<n;i++){
      const a=electrodes[i];
      external[i]=coulombForce(a.q,wall.q,a.x,wall.x);
      externalPotential+=COULOMB_K*a.q*wall.q/Math.abs(a.x-wall.x);
    }
  }
  const internalNet=internal.reduce((a,b)=>a+b,0);
  const deviceExternal=external.reduce((a,b)=>a+b,0);
  const reactionOnWall=-deviceExternal;
  const deviceTotal=internalNet+deviceExternal;
  const combinedResidual=deviceTotal+reactionOnWall;
  return {
    settings,electrodes,wall:settings.mode==="wall"?wall:null,pairs,
    forceN:electrodes.map((e,i)=>({id:e.id,internal:internal[i],external:external[i],total:internal[i]+external[i]})),
    totalsN:{internalNet,deviceExternal,deviceTotal,reactionOnWall,combinedResidual},
    potentialJ:{internal:internalPotential,withWall:externalPotential},
    provenance:{experiment:"LIQ-ES1",origin:"SIMULATED",authority:"NONE",
      calibrated:false,empirical:false,thrustClaim:false,
      model:"1D fixed-point-charge Coulomb sum; external stationary point charge is an explicit environment proxy"},
    limitations:["not a finite-conductor or constant-voltage model",
      "no dielectrics, polarization, space charge, gas discharge or chamber geometry",
      "no mechanical supports, wiring, momentum carried in radiation or time-varying fields"]
  };
}
export function sweep(input={}) {
  const p=configure(input);
  return [0.5,0.65,0.8,1,1.2,1.4,1.6,1.8,2].map(asymmetry=>{
    const r=evaluate({...p,asymmetry});
    return {asymmetry,
      internalNet_mN:round(r.totalsN.internalNet*1000),
      deviceTotal_mN:round(r.totalsN.deviceTotal*1000),
      wallReaction_mN:round(r.totalsN.reactionOnWall*1000),
      closedResidual_mN:round(r.totalsN.combinedResidual*1000)};
  });
}
export function audit() {
  const cases=[];
  for(const mode of ["isolated","wall"])for(const asymmetry of [0.5,1,1.3,2]){
    for(const mirror of [false,true]){
      const r=evaluate({mode,asymmetry,mirror});
      const tolerance=1e-12;
      cases.push({mode,asymmetry,mirror,
        pass:Math.abs(r.totalsN.internalNet)<tolerance&&
             Math.abs(r.totalsN.combinedResidual)<tolerance&&
             (mode!=="isolated"||Math.abs(r.totalsN.deviceTotal)<tolerance)});
    }
  }
  return {pass:cases.every(c=>c.pass),caseCount:cases.length,cases,
    proofType:"numeric invariants under a point-charge toy model; not empirical validation"};
}
