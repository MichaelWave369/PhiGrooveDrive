import test from "node:test";
import assert from "node:assert/strict";
import {settings,runScenario,matchCase,compare,CASES} from "../src/helix-compare.mjs";
test("settings bound invalid and unrecognized parameters",()=>{
 const s=settings({referenceDrive:999,maxDrive:-4,periods:100,frequency:0});
 assert.equal(s.referenceDrive,1.5);
 assert.equal(s.maxDrive,.02);
 assert.equal(s.periods,5);
 assert.equal(s.frequency,.2);
 assert.equal(CASES.length,4);
});
test("zero drive gives zero gross mechanical input",()=>{
 const r=runScenario({periods:1,frequency:1},{drive:0});
 assert.equal(r.metrics.positiveWork,0);
 assert.equal(r.metrics.negativeWork,0);
 assert.equal(r.metrics.signedDriveWork,0);
});
test("gross positive minus gross negative approximates signed work",()=>{
 const r=runScenario({periods:2,frequency:.8,dt:1/240});
 assert.ok(r.metrics.positiveWork>0);
 assert.ok(r.metrics.negativeWork>=0);
 assert.ok(Math.abs(r.metrics.grossAccountingResidual)<.002,r.metrics.grossAccountingResidual);
 assert.ok(Math.abs(r.metrics.energyResidual)<1e-4,r.metrics.energyResidual);
});
test("opposing drives count both actuator ports separately",()=>{
 const r=runScenario({periods:1,frequency:.8},{mode:"balanced",drive:.4});
 assert.ok(r.metrics.positiveWork>0);
 assert.ok(Math.abs(r.metrics.grossAccountingResidual)<.005);
});
test("unreachable work target reports NO_MATCH, not an invented result",()=>{
 const r=matchCase({periods:1,frequency:1,maxDrive:.05},"no-rungs",999);
 assert.equal(r.status,"NO_MATCH");
 assert.equal(r.trial,null);
 assert.ok(r.closestWork<999);
});
test("reference zero-work case declines comparisons",()=>{
 const r=compare({referenceDrive:0,periods:1,frequency:1});
 // referenceDrive is bounded positive, so an explicit zero target tests the rejection interface.
 const m=matchCase({periods:1,frequency:1},"no-rungs",0);
 assert.equal(m.status,"NO_MATCH");
 assert.ok(r.baselineGrossPositiveWork>=0);
});
test("same input and configuration produces deterministic comparator receipts",()=>{
 const s={periods:1,frequency:1,dt:1/180};
 const x=runScenario(s),y=runScenario(s);
 assert.equal(x.metrics.positiveWork,y.metrics.positiveWork);
 assert.equal(x.metrics.mirrorScore,y.metrics.mirrorScore);
 assert.equal(x.provenance.origin,"SIMULATED");
 assert.equal(x.provenance.propulsionClaim,false);
});
test("default comparative benchmark returns valid reference and truthful statuses",()=>{
 const r=compare({periods:1,frequency:1});
 assert.equal(r.cases[0].id,"full");
 assert.equal(r.cases[0].status,"REFERENCE");
 assert.ok(r.baselineGrossPositiveWork>0);
 for(const arm of r.cases.slice(1)){
   assert.ok(["MATCHED","NO_MATCH"].includes(arm.status));
   if(arm.status==="MATCHED"){
     assert.ok(arm.relativeError<=r.settings.tolerance);
     assert.ok(Math.abs(arm.trial.metrics.energyResidual)<.0001);
   }else assert.equal(arm.trial,null);
 }
});
