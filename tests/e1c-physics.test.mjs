import test from "node:test";
import assert from "node:assert/strict";
import {MODES,DEFAULT,configure,sourceVoltage,forces,energies,start,step,report,simulate} from "../src/e1c-physics.mjs";
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol, "expected "+a+" near "+b);

test("all six modes conserve momentum and total electromechanical energy budget",()=>{
 for(const mode of MODES){
  const r=simulate({...DEFAULT,mode});
  near(r.metrics.com,0,1e-12);
  near(r.metrics.momentum,0,1e-12);
  near(r.metrics.residual,0,1e-5);
  assert.ok(r.final.busIn>=0&&r.final.busReturn>=0);
  assert.ok(r.final.copperHeat>=0&&r.final.mechanicalHeat>=0);
  assert.ok(r.metrics.energy.kinetic>=0&&r.metrics.energy.coil>=0);
  assert.ok(r.metrics.minGap>.05,"no collision "+mode);
  assert.equal(r.provenance.origin,"SIMULATED");
  assert.equal(r.provenance.authority,"NONE");
  assert.equal(r.provenance.calibration,false);
 }
});
test("conservative magnet potential derivative equals repulsive force",()=>{
 const p=configure(),s=start(p),h=1e-6;
 const A=energies(p,{...s,gap:s.gap+h}).magnetic;
 const B=energies(p,{...s,gap:s.gap-h}).magnetic;
 near(-(A-B)/(2*h),forces(p,s).magForce,1e-9);
});
test("magnet strength zero cancels magnetic force and stored magnetic energy",()=>{
 const p=configure({magC:0});
 const s=start(p);
 near(forces(p,s).magForce,0,0);
 near(energies(p,s).magnetic,0,0);
});
test("electromechanical force and back EMF use the same coefficient",()=>{
 const p=configure(),s={...start(p),current:.3,velocity:.14};
 near(forces(p,s).coilForce,p.motorK*s.current);
 near(report(p,s).emf,p.motorK*s.velocity);
 near(forces(p,s).coilForce*s.velocity,s.current*report(p,s).emf);
});
test("zero volts can dissipate initial stored spring/magnet energy but cannot return bus energy",()=>{
 const r=simulate({mode:"off",duration:6});
 assert.equal(r.final.busIn,0);
 assert.equal(r.final.busReturn,0);
 near(r.final.copperHeat+r.final.mechanicalHeat,
  r.final.initialEnergy-r.metrics.energy.total,1e-7);
});
test("voltage-injected model can exhibit both positive bus draw and negative power intervals",()=>{
 for(const mode of ["liquid","wave","brake"]){
  const r=simulate({mode});
  assert.ok(r.final.busIn>r.final.busReturn,mode+" net input");
  assert.ok(r.final.busReturn>.01,mode+" modeled return");
  assert.ok(r.final.copperHeat>r.final.busReturn*.05);
  near(r.final.busIn-r.final.busReturn,
    r.metrics.energy.total-r.final.initialEnergy+r.final.copperHeat+r.final.mechanicalHeat,1e-5);
 }
});
test("cumulative recovered energy never appears as a source without a corresponding electrical sink",()=>{
 const r=simulate();
 assert.ok(r.final.busIn>0);
 assert.ok(r.final.busReturn<r.final.busIn);
 assert.ok(r.metrics.energy.total>=0);
 assert.ok(r.final.copperHeat>=0);
 assert.ok(r.provenance.circuit.includes("bidirectional"));
});
test("time refinement does not materially change the energy ledger",()=>{
 for(const mode of ["liquid","brake"]){
  const x=simulate({mode,dt:1/720});
  const y=simulate({mode,dt:1/1440});
  near(x.metrics.energy.total,y.metrics.energy.total,.0002);
  near(x.final.busIn-x.final.busReturn,y.final.busIn-y.final.busReturn,.0002);
  assert.ok(Math.abs(y.metrics.residual)<Math.max(1e-5,Math.abs(x.metrics.residual)+1e-7));
 }
});
test("mass changes preserve equal-and-opposite internal momentum",()=>{
 const r=simulate({m1:2,m2:.4,bpm:140,motorK:.8});
 near(r.metrics.momentum,0,1e-12);
 near(r.metrics.com,0,1e-12);
 near(r.metrics.residual,0,1e-4);
});
test("zero-drive equal-equilibrium no magnetic force remains static",()=>{
 const r=simulate({mode:"off",magC:0,restGap:.2,initialGap:.2});
 near(r.metrics.energy.total,0,1e-12);
 near(r.final.gap,.2,1e-12);
 near(r.final.velocity,0,1e-12);
 near(r.final.current,0,1e-12);
});
test("all simulation controls are finite and bounded",()=>{
 const p=configure({voltage:300,magC:-2,damping:-3,mode:"anti",bpm:999,inductance:0,resistance:-4,dt:Infinity,duration:600});
 assert.equal(p.voltage,6);assert.equal(p.magC,0);
 assert.equal(p.damping,0);assert.equal(p.mode,"liquid");
 assert.equal(p.bpm,240);assert.equal(p.inductance,.05);
 assert.equal(p.resistance,.8);assert.equal(p.dt,1/720);
 assert.equal(p.duration,20);
});
test("traces carry provenance and finite values",()=>{
 const r=simulate({mode:"pop"});
 assert.ok(r.history.length>100&&r.history.length<350);
 assert.ok(r.history.every(h=>Number.isFinite(h.gap)&&Number.isFinite(h.current)&&Number.isFinite(h.residual)));
 assert.equal(r.provenance.thrustClaim,false);
 assert.equal(r.provenance.hardwareRecoveryClaim,false);
});
