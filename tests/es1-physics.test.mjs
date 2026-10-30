import test from "node:test";
import assert from "node:assert/strict";
import {COULOMB_K,configure,layout,coulombForce,evaluate,sweep,audit} from "../src/es1-physics.mjs";
const near=(x,y,t=1e-12)=>assert.ok(Math.abs(x-y)<=t, `${x} != ${y} (tolerance ${t})`);

test("Coulomb pair is antisymmetric and sign correct",()=>{
  const x=coulombForce(10e-9,10e-9,-0.1,0.1);
  assert.ok(x<0);
  near(x,-coulombForce(10e-9,10e-9,0.1,-0.1));
  near(Math.abs(x),COULOMB_K*1e-16/0.04);
});
test("isolation preserves total force for wide asymmetric geometries",()=>{
 for(const asymmetry of [0.5,0.6,1,1.4,2]){
  const r=evaluate({mode:"isolated",asymmetry});
  near(r.totalsN.internalNet,0);
  near(r.totalsN.deviceTotal,0);
  near(r.totalsN.combinedResidual,0);
  assert.ok(r.forceN.some(f=>Math.abs(f.internal)>1e-7));
 }
});
test("external charged object creates a device force and opposite wall reaction",()=>{
 const r=evaluate({mode:"wall"});
 assert.ok(Math.abs(r.totalsN.deviceExternal)>1e-9);
 near(r.totalsN.deviceTotal,-r.totalsN.reactionOnWall);
 near(r.totalsN.combinedResidual,0);
 near(r.totalsN.internalNet,0);
});
test("turning off external wall removes the apparent device net force",()=>{
 const a=evaluate({mode:"isolated"}),b=evaluate({mode:"wall"});
 near(a.totalsN.deviceTotal,0);
 assert.ok(Math.abs(b.totalsN.deviceTotal)>1e-9);
});
test("charge magnitude doubling gives fourfold internal Coulomb force",()=>{
 const a=evaluate({chargeNC:10}),b=evaluate({chargeNC:20});
 for(let i=0;i<3;i++) near(b.forceN[i].internal,4*a.forceN[i].internal);
});
test("doubling separation gives quarter strength with no external wall",()=>{
 const a=evaluate({spacingCm:4}),b=evaluate({spacingCm:8});
 for(let i=0;i<3;i++) near(b.forceN[i].internal,a.forceN[i].internal/4);
});
test("mirroring the isolated charge geometry reverses every individual force",()=>{
 const a=evaluate({mode:"isolated",mirror:false});
 const b=evaluate({mode:"isolated",mirror:true});
 for(let i=0;i<3;i++) near(a.forceN[i].internal,-b.forceN[i].internal);
});
test("wall reaction remains included for mirrored, asymmetric geometries",()=>{
 for(const mirror of [true,false])for(const asymmetry of [0.5,1.9]){
   const r=evaluate({mode:"wall",mirror,asymmetry});
   near(r.totalsN.combinedResidual,0);
 }
});
test("configuration bounded and finite, including zero wall charge",()=>{
 const c=configure({spacingCm:Infinity,asymmetry:-200,chargeNC:-3,wallChargeNC:0,wallGapCm:NaN,mode:"alien",mirror:"yes"});
 assert.equal(c.spacingCm,5);assert.equal(c.asymmetry,0.5);
 assert.equal(c.chargeNC,1);assert.equal(c.wallChargeNC,0);
 assert.equal(c.wallGapCm,8);assert.equal(c.mode,"isolated");assert.equal(c.mirror,false);
 near(evaluate({mode:"wall",wallChargeNC:0}).totalsN.deviceExternal,0);
 assert.equal(layout(c).electrodes.length,3);
});
test("sweep and audit are reproducible and refuse empirical authority",()=>{
 const a=sweep({mode:"wall"}),b=sweep({mode:"wall"});
 assert.deepEqual(a,b);
 assert.equal(a.length,9);
 assert.ok(a.every(row=>Math.abs(row.closedResidual_mN)<1e-7));
 const result=audit();assert.equal(result.pass,true);assert.equal(result.caseCount,16);
 const receipt=evaluate();
 assert.equal(receipt.provenance.origin,"SIMULATED");
 assert.equal(receipt.provenance.authority,"NONE");
 assert.equal(receipt.provenance.thrustClaim,false);
 assert.equal(receipt.provenance.empirical,false);
 assert.equal(receipt.provenance.calibrated,false);
});
test("non-distinct positions are rejected rather than producing phantom forces",()=>{
 assert.throws(()=>coulombForce(1,1,0,0),RangeError);
});
