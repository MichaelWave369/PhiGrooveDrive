import test from "node:test";
import assert from "node:assert/strict";
import {DEFAULTS,initialState,step,run,energy,gap,momentum,ledger,keyholePair} from "../src/physics.mjs";

test("two identical modules remain still at equilibrium in LOCK",()=>{
  const start=initialState({mode:"lock",amplitude:0});
  const result=run({mode:"lock",amplitude:0},5);
  assert.ok(Math.abs(gap(result.state)-gap(start))<1e-12);
  assert.equal(result.metrics.work,0);
  assert.equal(result.metrics.loss,0);
  assert.ok(Math.abs(result.metrics.delta)<1e-12);
});
test("all dance patterns conserve isolated-system momentum and center of mass",()=>{
  for(const mode of ["lock","liquid","wave","pop"]){
    const result=run({mode,amplitude:0.22,bpm:140,springK:22,damping:0.15},8);
    assert.ok(Math.abs(result.metrics.momentumError)<1e-9,mode+" momentum");
    assert.ok(Math.abs(result.metrics.centerDrift)<1e-9,mode+" COM");
    assert.ok(Math.abs(result.metrics.residual)<0.005,mode+" energy accounting");
    assert.ok(result.snapshots.every(x=>Number.isFinite(x.gap)),mode+" finite");
    assert.equal(result.provenance.origin,"SIMULATED");
    assert.equal(result.provenance.authority,"NONE");
  }
});
test("initial whole-body velocity retains center-of-mass trajectory",()=>{
  const init=initialState({mode:"lock",baseGap:0.70,restGap:0.70,x1:-0.60,x2:0.60,v1:1.2,v2:-0.4,m1:2,m2:1,damping:0.7,amplitude:0});
  let state=init;
  for(let i=0;i<960;i++)state=step(state,1/240);
  assert.ok(Math.abs(momentum(state)-momentum(init))<1e-9);
  assert.ok(Math.abs(ledger(state).centerDrift)<1e-9);
});
test("fixed equilibrium spring nearly conserves mechanical energy without damping",()=>{
  const init=initialState({mode:"lock",baseGap:0.72,restGap:0.72,x1:-.62,x2:.62,damping:0,amplitude:0});
  let state=init;
  for(let i=0;i<4800;i++)state=step(state,1/240);
  assert.ok(Math.abs(energy(state).total-energy(init).total)<0.001);
  assert.equal(state.work,0);
  assert.equal(state.loss,0);
});
test("passive damping dissipates but does not create energy",()=>{
  const s=initialState({mode:"lock",baseGap:.7,restGap:.7,x1:-.62,x2:.62,damping:.8,amplitude:0});
  let state=s;
  for(let i=0;i<1440;i++)state=step(state,1/240);
  const x=ledger(state);
  assert.ok(x.loss>0);
  assert.ok(x.total<=s.initialE+0.001);
  assert.ok(Math.abs(x.residual)<0.001);
});
test("Keyhole controls have coarse-equivalent start and distinct future",()=>{
  const pair=keyholePair();
  assert.equal(pair.observer.netInternalForce,0);
  assert.equal(pair.observer.initialKinetic,0);
  assert.ok(Math.abs(pair.futureA-pair.futureB)>0.01);
  assert.equal(pair.origin,"SIMULATED");
});
test("numerical resolution affects only bounded integration error",()=>{
  const config={mode:"wave",amplitude:.1,bpm:100,damping:.3};
  const coarse=run(config,4,1/240), fine=run(config,4,1/480);
  assert.ok(Math.abs(coarse.metrics.gap-fine.metrics.gap)<0.003);
  assert.ok(Math.abs(coarse.metrics.residual)<0.005);
  assert.ok(Math.abs(fine.metrics.residual)<0.005);
});
test("control parameters are constrained to finite safe numerical bounds",()=>{
  const s=initialState({...DEFAULTS,bpm:9999,amplitude:99,m1:-4,m2:0,mode:"superpower"});
  assert.equal(s.bpm,240);
  assert.equal(s.amplitude,0.28);
  assert.equal(s.m1,0.2);
  assert.equal(s.m2,0.2);
  assert.equal(s.mode,"liquid");
});
