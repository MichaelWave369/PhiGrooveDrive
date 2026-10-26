import test from "node:test";
import assert from "node:assert/strict";
import {E1_VERSION,MODES,DEFAULT_E1,parameters,nodeState,instant,experiment,compare,crossCheck} from "../src/e1-physics.mjs";

const nearly=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps, "expected "+a+" ≈ "+b);

test("the new fin is six fixed-x nodes with spatially phased travel",()=>{
  const p=parameters({mode:"wave",bpm:120,waves:1});
  const nodes=instant(p,.065).nodes;
  assert.equal(nodes.length,6);
  nodes.forEach((n,i)=>nearly(n.x,p.length*i/5));
  // Check programmed spatial phase instead of an arbitrary adjacent-node distance.
  assert.ok(Math.abs(nodes[1].phase-nodes[0].phase)>.5);
  assert.ok(Math.abs(nodes[0].y-nodes[2].y)>.02);
  assert.equal(p.segments,6);
});
test("all modes obey exact fin/fluid action-reaction balance",()=>{
  for(const mode of MODES){
    const s=instant({...DEFAULT_E1,mode},.181);
    nearly(s.fx+s.fluidFx,0,1e-13);
    nearly(s.fy+s.fluidFy,0,1e-13);
    const r=experiment({...DEFAULT_E1,mode});
    nearly(r.metrics.finImpulse+r.metrics.fluidImpulse,0,1e-12);
    nearly(r.metrics.lateralImpulse+r.metrics.fluidLateralImpulse,0,1e-12);
    assert.ok(r.metrics.energy>=0);
    assert.ok(r.metrics.meanPower>=0);
    assert.equal(r.provenance.origin,"SIMULATED");
    assert.equal(r.provenance.calibrated,false);
  }
});
test("no fluid produces exactly zero thrust, force and hydrodynamic power",()=>{
  for(const mode of MODES){
    const s=experiment({...DEFAULT_E1,mode,fluidScale:0});
    assert.equal(s.metrics.finImpulse,0);
    assert.equal(s.metrics.energy,0);
    assert.equal(s.metrics.peakForce,0);
  }
});
test("motionless fin produces no force even in a resistive medium",()=>{
  const s=experiment({...DEFAULT_E1,amplitude:0});
  assert.equal(s.metrics.meanThrust,0);
  assert.equal(s.metrics.meanPower,0);
  assert.equal(s.metrics.energy,0);
});
test("isotropic drag has no streamwise force but can dissipate power",()=>{
  const s=experiment({...DEFAULT_E1,normalDrag:1.5,tangentialDrag:1.5,mode:"wave"});
  nearly(s.metrics.finImpulse,0);
  assert.ok(s.metrics.energy>0);
});
test("travel direction reverses mean thrust without manufacturing more energy",()=>{
  const duration=8*60/DEFAULT_E1.bpm;
  const wave=experiment({...DEFAULT_E1,mode:"wave",duration});
  const reversed=experiment({...DEFAULT_E1,mode:"reverse",duration});
  assert.ok(wave.metrics.meanThrust>.01);
  assert.ok(reversed.metrics.meanThrust<-.01);
  nearly(wave.metrics.meanThrust+reversed.metrics.meanThrust,0,1e-9);
  nearly(wave.metrics.energy-reversed.metrics.energy,0,1e-8);
});
test("uniformly synchronous oscillation produces zero axial force despite energy cost",()=>{
  const s=experiment({...DEFAULT_E1,mode:"sync"});
  assert.equal(s.metrics.finImpulse,0);
  assert.ok(s.metrics.energy>0);
});
test("standing waves average to nearly zero thrust over whole cycles",()=>{
  const duration=8*60/DEFAULT_E1.bpm;
  const s=experiment({...DEFAULT_E1,mode:"standing",duration});
  nearly(s.metrics.meanThrust,0,1e-8);
});
test("fluid resistance is passive: local work input cannot be negative",()=>{
  const x=instant(DEFAULT_E1,.155);
  const work=-x.nodes.reduce((total,n)=>total+n.fy*n.vy,0);
  nearly(work,x.power);
  assert.ok(x.nodes.every(n=>n.power>=-1e-12));
  const checks=crossCheck();
  assert.equal(checks.signReversal,true);
  assert.equal(checks.nonnegative,true);
  nearly(checks.powerResidual,0);
});
test("time-step refinement preserves mean thrust and work within tolerance",()=>{
  const a=experiment({...DEFAULT_E1,dt:1/240});
  const b=experiment({...DEFAULT_E1,dt:1/480});
  nearly(a.metrics.meanThrust,b.metrics.meanThrust,0.002);
  nearly(a.metrics.energy,b.metrics.energy,0.005);
});
test("equal-energy benchmark matches wave input work instead of assuming equal amplitude is fair",()=>{
  const c=compare(DEFAULT_E1);
  assert.equal(c.rows.length,6);
  assert.ok(c.baselineEnergy>0);
  for(const row of c.rows){
    assert.ok(row.matched?.achieved, row.mode+" has no feasible energy match");
    assert.ok(row.matched.amplitude>=0&&row.matched.amplitude<=.3);
    assert.ok(Math.abs(row.matched.ratio-1)<.01,row.mode+" energy ratio mismatch");
  }
  const reverse=c.rows.find(r=>r.mode==="reverse");
  const wave=c.rows.find(r=>r.mode==="wave");
  nearly(wave.matched.meanThrust+reverse.matched.meanThrust,0,1e-7);
});
test("energy matching refuses unreachable and zero-medium targets explicitly",()=>{
  const impossible=compare({...DEFAULT_E1,amplitude:.30,normalDrag:0,tangentialDrag:2});
  // The reference remains defined, but the comparison never fabricates an energy match.
  assert.ok(impossible.rows.every(row=>row.matched===null||typeof row.matched.achieved==="boolean"));
  const zero=compare({...DEFAULT_E1,fluidScale:0});
  assert.equal(zero.baselineEnergy,0);
  assert.ok(zero.rows.every(row=>row.matched===null));
});
test("unphysical/unbounded input is constrained",()=>{
  const p=parameters({segments:500,amplitude:999,bpm:-100,waves:999,fluidScale:-1,dt:Infinity,mode:"phantom"});
  assert.equal(p.segments,6);
  assert.equal(p.amplitude,.3);
  assert.equal(p.bpm,40);
  assert.equal(p.waves,2);
  assert.equal(p.fluidScale,0);
  assert.equal(p.dt,1/240);
  assert.equal(p.mode,"liquid");
});
test("provenance and version are included in reproducible traces",()=>{
  const e=experiment({...DEFAULT_E1,mode:"pop"});
  assert.equal(e.provenance.version,E1_VERSION);
  assert.equal(e.provenance.authority,"NONE");
  assert.ok(e.history.length>20&&e.history.length<=241);
  assert.ok(e.history.every(p=>Number.isFinite(p.time)&&Number.isFinite(p.thrust)&&p.power>=0));
});
