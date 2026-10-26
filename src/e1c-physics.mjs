// LIQ-E1c: isolated two-body electromagnetic interface with ideal reversible bus.
// SIMULATED. Analytic conservative repulsion + coil transducer + RL back-EMF.
// Zero net translational propulsion; electrical return is model-only bus absorption.
export const MODES=["liquid","wave","pop","brake","reverse","off"];
export const DEFAULT={
 m1:1,m2:1,radius:.08,initialGap:.19,restGap:.21,
 springK:15,damping:.22,magC:.00032,softening:.12,
 resistance:2.6,inductance:.32,motorK:.58,
 voltage:3,bpm:120,mode:"liquid",duration:6,dt:1/720
};
const bound=(x,lo,hi,fallback)=>Number.isFinite(Number(x))?Math.min(hi,Math.max(lo,Number(x))):fallback;
export function configure(input={}){
 const p={...DEFAULT,...input};
 return {
  m1:bound(p.m1,.3,5,1),m2:bound(p.m2,.3,5,1),
  radius:.08,initialGap:bound(p.initialGap,.12,.45,.19),
  restGap:bound(p.restGap,.12,.45,.21),
  springK:bound(p.springK,3,40,15),
  damping:bound(p.damping,0,3,.22),
  magC:bound(p.magC,0,.003,.00032),
  softening:.12,resistance:bound(p.resistance,.8,12,2.6),
  inductance:bound(p.inductance,.05,2,.32),
  motorK:bound(p.motorK,.1,2,.58),
  voltage:bound(p.voltage,0,6,3),
  bpm:bound(p.bpm,40,240,120),
  mode:MODES.includes(p.mode)?p.mode:"liquid",
  duration:bound(p.duration,.05,20,6),
  dt:bound(p.dt,1/3000,1/60,1/720)
 };
}
export function sourceVoltage(p,t){
 const a=2*Math.PI*p.bpm*t/60;
 switch(p.mode){
  case "off":return 0;
  case "wave":return p.voltage*Math.sin(a);
  case "reverse":return -p.voltage*Math.sin(a);
  case "pop":return p.voltage*Math.max(0,Math.sin(a))**8;
  case "brake":{
   const phase=((a/(2*Math.PI))%1+1)%1;
   if(phase<.32)return p.voltage*Math.sin(Math.PI*phase/.32)**2;
   if(phase<.67)return -.56*p.voltage*Math.sin(Math.PI*(phase-.32)/.35)**2;
   return 0;
  }
  default:return p.voltage*(.72*Math.sin(a)+.28*Math.sin(2*a+Math.PI/3));
 }
}
function conservative(p,gap){
 const sep=Math.max(1e-5,gap+p.softening);
 return {
  magForce:2*p.magC/sep**3,
  magPotential:p.magC/sep**2,
  springForce:-p.springK*(gap-p.restGap)
 };
}
export function forces(input,s){
 const p=configure(input),f=conservative(p,s.gap);
 const coilForce=p.motorK*s.current,viscousForce=-p.damping*s.velocity;
 return {...f,coilForce,viscousForce,
  total:f.magForce+f.springForce+coilForce+viscousForce};
}
export function energies(input,s){
 const p=configure(input),mu=p.m1*p.m2/(p.m1+p.m2),f=conservative(p,s.gap);
 const kinetic=.5*mu*s.velocity**2,spring=.5*p.springK*(s.gap-p.restGap)**2,
  coil=.5*p.inductance*s.current**2;
 return {kinetic,spring,magnetic:f.magPotential,coil,total:kinetic+spring+f.magPotential+coil};
}
export function start(input={}){
 const p=configure(input);
 const s={gap:p.initialGap,velocity:0,current:0,t:0,steps:0,
  busIn:0,busReturn:0,copperHeat:0,mechanicalHeat:0};
 s.initialEnergy=energies(p,s).total;
 return s;
}
function derivative(p,s,t){
 const V=sourceVoltage(p,t),mu=p.m1*p.m2/(p.m1+p.m2);
 const power=V*s.current;
 return {gap:s.velocity,
  velocity:forces(p,s).total/mu,
  current:(V-p.resistance*s.current-p.motorK*s.velocity)/p.inductance,
  busIn:Math.max(0,power),busReturn:Math.max(0,-power),
  copperHeat:p.resistance*s.current*s.current,
  mechanicalHeat:p.damping*s.velocity*s.velocity};
}
const KEYS=["gap","velocity","current","busIn","busReturn","copperHeat","mechanicalHeat"];
function add(s,k,mult){
 const out={...s};
 for(const key of KEYS)out[key]+=mult*k[key];
 return out;
}
export function step(input,s,h){
 const p=configure(input),dt=bound(h,1/10000,1/60,p.dt);
 const k1=derivative(p,s,s.t),k2=derivative(p,add(s,k1,dt/2),s.t+dt/2);
 const k3=derivative(p,add(s,k2,dt/2),s.t+dt/2);
 const k4=derivative(p,add(s,k3,dt),s.t+dt);
 const next={...s};
 for(const key of KEYS)next[key]+=dt*(k1[key]+2*k2[key]+2*k3[key]+k4[key])/6;
 next.t+=dt;next.steps++;
 return next;
}
export function report(input,s){
 const p=configure(input),energy=energies(p,s);
 const busNet=s.busIn-s.busReturn,thermal=s.copperHeat+s.mechanicalHeat;
 const residual=(energy.total-s.initialEnergy)+thermal-busNet;
 const sep=s.gap+2*p.radius;
 const x1=-p.m2*sep/(p.m1+p.m2),x2=p.m1*sep/(p.m1+p.m2);
 const v1=-p.m2*s.velocity/(p.m1+p.m2),v2=p.m1*s.velocity/(p.m1+p.m2);
 return {energy,busNet,thermal,residual,emf:p.motorK*s.velocity,
  voltage:sourceVoltage(p,s.t),momentum:p.m1*v1+p.m2*v2,
  com:(p.m1*x1+p.m2*x2)/(p.m1+p.m2),x1,x2};
}
export function simulate(input={}){
 const p=configure(input),steps=Math.ceil(p.duration/p.dt),dt=p.duration/steps;
 let s=start(p),minGap=s.gap,maxCurrent=0;
 const history=[{t:0,gap:s.gap,velocity:0,current:0,busIn:0,busReturn:0,residual:0,
  voltage:sourceVoltage(p,0)}],stride=Math.max(1,Math.ceil(steps/300));
 for(let i=0;i<steps;i++){
  s=step(p,s,dt);
  minGap=Math.min(minGap,s.gap);maxCurrent=Math.max(maxCurrent,Math.abs(s.current));
  if(i%stride===0||i===steps-1){
   const r=report(p,s);
   history.push({t:s.t,gap:s.gap,velocity:s.velocity,current:s.current,
    voltage:r.voltage,busIn:s.busIn,busReturn:s.busReturn,
    residual:r.residual,totalEnergy:r.energy.total});
  }
 }
 const r=report(p,s);
 return {input:p,final:s,metrics:{...r,minGap,maxCurrent,
  returnFraction:s.busIn>1e-12?s.busReturn/s.busIn:null,
  electricalInputGross:s.busIn,electricalRecoveredIdeal:s.busReturn},
  history,provenance:{experiment:"LIQ-E1c",origin:"SIMULATED",authority:"NONE",
   calibration:false,circuit:"ideal four-quadrant bidirectional voltage source",
   magnet:"conservative soft-core repulsive inverse-cube surrogate",
   thrustClaim:false,hardwareRecoveryClaim:false}};
}
