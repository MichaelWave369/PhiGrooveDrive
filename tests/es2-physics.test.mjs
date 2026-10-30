import test from "node:test";
import assert from "node:assert/strict";
import {
 EPSILON0,DEFAULTS,HALF_DOMAIN,configure,triangleStiffness,assemble,
 solve,electricField,stressAt,forceContours,energyPerDepth,run,refinement
} from "../src/es2-physics.mjs";
const near=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol,`${a} should be within ${tol} of ${b}`);

test("P1 triangular element stiffness is symmetric and has constant-potential nullspace",()=>{
 const tri=triangleStiffness([{x:0,y:0},{x:1,y:0},{x:1,y:1}]);
 near(tri.area,0.5);
 for(let i=0;i<3;i++){
  for(let j=0;j<3;j++)near(tri.K[i][j],tri.K[j][i]);
  near(tri.K[i].reduce((a,b)=>a+b,0),0);
 }
 const q=[2,-1,3],energy=q.reduce((sum,qi,i)=>sum+qi*tri.K[i].reduce((x,k,j)=>x+k*q[j],0),0);
 assert.ok(energy>=0);
});
test("P1 assembled matrix is symmetric with zero row sums before Dirichlet constraints",()=>{
 const m=assemble(33);assert.equal(m.tris.length,2*32*32);
 assert.equal(m.nodes.length,33*33);
 for(const k of [0,1,17,500,1088]){
  let total=0;
  for(const [j,v] of m.rows[k]){
   near(v,m.rows[j].get(k)??0,1e-10);
   total+=v;
  }
  near(total,0,1e-9);
 }
});
test("manufactured linear potential solves the Laplace equation",()=>{
 const s=solve({grid:33},{scenario:"linear"});
 assert.ok(s.solver.converged);
 const worst=s.nodes.reduce((mx,p,k)=>Math.max(mx,Math.abs(s.values[k]-p.x*1000)),0);
 assert.ok(worst<1e-4,`linear manufactured solution error ${worst} V`);
 const f=electricField(s,15,17);
 near(f.ex,-1000,0.005);near(f.ey,0,.005);
 const analytic=0.5*EPSILON0*1e6*(2*HALF_DOMAIN)**2;
 assert.ok(Math.abs(energyPerDepth(s)-analytic)/analytic<1e-5);
});
test("electrode problem solves with declared voltages and grounded enclosure",()=>{
 const s=solve({grid:33,voltage:200,offsetMm:9});
 assert.ok(s.solver.converged);
 assert.ok(s.electrodes.length===2);
 assert.ok(s.labels.some(x=>x===1) && s.labels.some(x=>x===2));
 for(let j=0;j<s.n;j++)for(let i=0;i<s.n;i++){
  const k=j*s.n+i;
  if(i===0||j===0||i===s.n-1||j===s.n-1)near(s.values[k],0,0);
  if(s.labels[k]===1)near(s.values[k],100,0);
  if(s.labels[k]===2)near(s.values[k],-100,0);
 }
 assert.ok(energyPerDepth(s)>0);
});
test("symmetric pair has near-zero whole-group force with nonzero individual forces",()=>{
 const s=solve({grid:33,offsetMm:0});
 const f=forceContours(s);
 assert.ok(f.individual[0].magnitude>1e-8);
 assert.ok(f.individual[1].magnitude>1e-8);
 assert.ok(f.group.magnitude<1e-9,`null group: ${f.group.magnitude}`);
 assert.ok(Math.hypot(f.wholeSystemResidual.fx,f.wholeSystemResidual.fy)<1e-9);
});
test("asymmetric device balances force with external enclosure reaction independently",()=>{
 const r=run({grid:33,offsetMm:15});
 assert.ok(r.force.group.magnitude>1e-9);
 const residual=Math.hypot(r.force.wholeSystemResidual.fx,r.force.wholeSystemResidual.fy);
 assert.ok(residual<r.force.group.magnitude*0.10,
  `residual ${residual} vs group ${r.force.group.magnitude}`);
 near(r.force.wallReaction.fx,-r.force.outer.fx,0);
 near(r.force.wallReaction.fy,-r.force.outer.fy,0);
 assert.ok(Math.hypot(r.force.separateVsGroup.fx,r.force.separateVsGroup.fy)
   <r.force.group.magnitude*0.15);
});
test("mirror geometry changes horizontal force parity, not conservation",()=>{
 const x=run({grid:33,offsetMm:15,mirror:false});
 const y=run({grid:33,offsetMm:15,mirror:true});
 near(x.force.group.fx,-y.force.group.fx,3e-8);
 near(x.force.group.fy,y.force.group.fy,3e-8);
});
test("2x Dirichlet voltages yield 2x field and 4x Maxwell stress and stored energy",()=>{
 const x=run({grid:33,voltage:120,offsetMm:12});
 const y=run({grid:33,voltage:240,offsetMm:12});
 const f=x.force.individual[0].fx,g=y.force.individual[0].fx;
 assert.ok(Math.abs(f)>1e-9);
 near(g/f,4,0.001);
 near(y.storedEnergy_J_per_m/x.storedEnergy_J_per_m,4,0.001);
});
test("zero-voltage null gives zero E, energy and force",()=>{
 const x=run({grid:33,voltage:0,offsetMm:20});
 assert.equal(x.force.group.magnitude,0);
 assert.equal(x.storedEnergy_J_per_m,0);
 const s=solve({grid:33,voltage:0});
 const e=electricField(s,16,16);
 near(e.ex,0,0);near(e.ey,0,0);
});
test("Maxwell stress tensor signs and 2D units are explicit",()=>{
 const e=stressAt(1000,0);
 near(e.xx,0.5*EPSILON0*1e6);
 near(e.yy,-e.xx);
 near(e.xy,0);
 assert.throws(()=>electricField(solve({grid:33}),0,3),RangeError);
});
test("mesh refinement compares independent grids, no forced numerical closure",()=>{
 const r=refinement({voltage:250,offsetMm:15});
 assert.deepEqual(r.checks.map(x=>x.grid),[33,49,65]);
 assert.ok(r.checks.every(x=>x.converged && x.iterations>0));
 assert.ok(r.checks.every(x=>Number.isFinite(x.fx_N_per_m) && x.energy_J_per_m>0));
 assert.ok(Number.isFinite(r.changeFineVsMid_N_per_m));
 assert.match(r.evidence,/no automatic/);
});
test("bounded configuration, evidence limits and original ES1 are preserved",()=>{
 const cfg=configure({grid:500,voltage:500000,offsetMm:-100,mirror:"yes"});
 assert.equal(cfg.grid,DEFAULTS.grid);
 assert.equal(cfg.voltage,500);
 assert.equal(cfg.offsetMm,-25);
 assert.equal(cfg.mirror,false);
 const r=run({grid:33,offsetMm:15});
 assert.equal(r.mesh.triangles,2048);
 assert.equal(r.provenance.origin,"SIMULATED");
 assert.equal(r.provenance.authority,"NONE");
 assert.equal(r.provenance.experimental,false);
 assert.equal(r.provenance.thrustClaim,false);
 assert.match(r.provenance.method,/FEM/);
 assert.ok(r.field.potential_V.length===1089);
});
