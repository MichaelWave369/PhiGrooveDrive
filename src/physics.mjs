// LIQ-E0: deterministic 1D two-module spring-actuator research model.
// SIMULATED ONLY. Internal coupling cannot accelerate an isolated system.
export const DEFAULTS = Object.freeze({
  m1:1, m2:1, radius:0.22, springK:14, damping:0.18,
  baseGap:0.8, amplitude:0.16, bpm:140, mode:"liquid"
});
const finite = (n, fallback) => Number.isFinite(Number(n)) ? Number(n) : fallback;
const clamp = (n,a,b) => Math.min(b,Math.max(a,n));
export function preset(input={}) {
  return {
    m1:clamp(finite(input.m1,1),0.2,5),
    m2:clamp(finite(input.m2,1),0.2,5),
    radius:0.22,
    springK:clamp(finite(input.springK,14),2,60),
    damping:clamp(finite(input.damping,0.18),0,3),
    baseGap:clamp(finite(input.baseGap,0.8),0.3,1.4),
    amplitude:clamp(finite(input.amplitude,0.16),0,0.28),
    bpm:clamp(finite(input.bpm,140),40,240),
    mode:["liquid","wave","pop","lock"].includes(input.mode)?input.mode:"liquid"
  };
}
export function energy(s) {
  const g = s.x2-s.x1-2*s.radius;
  const kinetic = 0.5*s.m1*s.v1*s.v1+0.5*s.m2*s.v2*s.v2;
  const stored = 0.5*s.springK*(g-s.restGap)**2;
  return {kinetic,stored,total:kinetic+stored};
}
export function gap(s){return s.x2-s.x1-2*s.radius;}
export function momentum(s){return s.m1*s.v1+s.m2*s.v2;}
export function center(s){return (s.m1*s.x1+s.m2*s.x2)/(s.m1+s.m2);}
export function initialState(settings={}) {
  const p=preset(settings);
  const half=0.5*(p.baseGap+2*p.radius);
  const v1=finite(settings.v1,0), v2=finite(settings.v2,0);
  const s={...p,x1:finite(settings.x1,-half),x2:finite(settings.x2,half),
    v1,v2,restGap:finite(settings.restGap,p.baseGap),time:0,
    work:0,loss:0,steps:0,momentum0:0,center0:0,initialE:0};
  s.momentum0=momentum(s);s.center0=center(s);s.initialE=energy(s).total;
  return s;
}
export function choreography(t,s){
  const a=2*Math.PI*s.bpm*t/60;
  switch(s.mode) {
    case "wave": return Math.sin(a);
    case "pop": return Math.pow(Math.max(0,Math.sin(a)),8);
    case "lock": return 0;
    default: return 0.72*Math.sin(a)+0.28*Math.sin(2*a+Math.PI/3);
  }
}
export function step(state,dt=1/240){
  const s={...state};
  dt=clamp(finite(dt,1/240),0,1/60);
  if (dt===0) return s;
  // Active rest-gap modulation is explicit actuator input, not a passive magnet.
  const g0=gap(s), nextRest=s.baseGap+s.amplitude*choreography(s.time+dt,s);
  const oldU=0.5*s.springK*(g0-s.restGap)**2;
  const newU=0.5*s.springK*(g0-nextRest)**2;
  const driveWork=newU-oldU; // work done by varying spring equilibrium
  // Equal/opposite spring forces; velocity Verlet.
  const f0=s.springK*(g0-nextRest);
  const h1=s.v1+0.5*dt*f0/s.m1;
  const h2=s.v2-0.5*dt*f0/s.m2;
  s.x1+=dt*h1;s.x2+=dt*h2;
  const f1=s.springK*(gap(s)-nextRest);
  s.v1=h1+0.5*dt*f1/s.m1;
  s.v2=h2-0.5*dt*f1/s.m2;
  // Momentum-preserving viscous relative damping.
  // Count kinetic energy decrease as dissipated heat.
  const m=s.m1+s.m2, mu=s.m1*s.m2/m;
  const vCM=momentum(s)/m;
  const relative=s.v2-s.v1;
  const damped=relative*Math.exp(-s.damping*dt/mu);
  const before=energy(s).kinetic;
  s.v1=vCM-s.m2/m*damped;
  s.v2=vCM+s.m1/m*damped;
  const heat=Math.max(0,before-energy(s).kinetic);
  s.restGap=nextRest;s.work+=driveWork;s.loss+=heat;s.time+=dt;s.steps++;
  return s;
}
export function ledger(s){
  const e=energy(s);
  const delta=e.total-s.initialE;
  const residual=delta+s.loss-s.work;
  return {...e,delta,work:s.work,loss:s.loss,residual,
    momentumError:momentum(s)-s.momentum0,
    centerDrift:center(s)-s.center0-s.momentum0*s.time/(s.m1+s.m2),
    gap:gap(s),relativeVelocity:s.v2-s.v1};
}
export function run(settings={},seconds=6,dt=1/240) {
  let s=initialState(settings);const snapshots=[];
  const n=Math.min(14400,Math.max(1,Math.round(seconds/dt)));
  const interval=Math.max(1,Math.ceil(n/500));
  snapshots.push({t:0,x1:s.x1,x2:s.x2,rest:s.restGap,...ledger(s)});
  for(let i=0;i<n;i++){
    s=step(s,dt);
    if((i+1)%interval===0||i===n-1){
      snapshots.push({t:s.time,x1:s.x1,x2:s.x2,rest:s.restGap,...ledger(s)});
    }
  }
  return {state:s,snapshots,metrics:ledger(s),provenance:{experiment:"LIQ-E0",origin:"SIMULATED",authority:"NONE",model:"two-mass-rest-gap-spring",dt}};
}
export function keyholePair(horizon=0.15) {
  // Same COM, gap, kinetic energy, stored energy and aggregate internal force.
  // Opposite preload directions are hidden by this deliberately coarse Keyhole.
  const common={mode:"lock",amplitude:0,damping:0,x1:-0.62,x2:0.62};
  let a=initialState({...common,restGap:0.65,baseGap:0.65});
  let b=initialState({...common,restGap:0.95,baseGap:0.95});
  const n=Math.max(1,Math.round(horizon*240));
  for(let i=0;i<n;i++){a=step(a,1/240);b=step(b,1/240);}
  return {observer:{centerOfMass:0,gap:0.8,netInternalForce:0,initialKinetic:0,initialStored:0.1575},
    futureA:gap(a),futureB:gap(b),difference:gap(a)-gap(b),
    explanation:"The coarse observer omits signed preload. The richer force/gap history distinguishes states after the same hold intervention.",
    origin:"SIMULATED",authority:"NONE"};
}
