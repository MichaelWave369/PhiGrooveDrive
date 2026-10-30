// LIQ-ES2: 2D electrostatic linear-triangle FEM and closed-contour Maxwell stress.
// Research-quality *method demonstration*, NOT calibrated propulsion or a 3D device.
// Uniform vacuum permittivity; zero space charge; fixed-potential conductors and grounded box.
export const EPSILON0=8.8541878128e-12; // F/m
export const HALF_DOMAIN=0.10; // m; 0.2 m square
export const DEFAULTS=Object.freeze({grid:49,voltage:250,offsetMm:0,mirror:false});
const finite=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const idx=(i,j,n)=>j*n+i;
export function configure(source={}) {
  const n=Number(source.grid);
  return {
    grid:[33,49,65].includes(n)?n:DEFAULTS.grid,
    voltage:clamp(finite(source.voltage,DEFAULTS.voltage),0,500),
    offsetMm:clamp(finite(source.offsetMm,DEFAULTS.offsetMm),-25,25),
    mirror:source.mirror===true,
    // Both electrode and outer-surface boundary conditions are declared.
    geometry:"two finite rectangular Dirichlet conductors; grounded square enclosure",
    medium:"vacuum (uniform epsilon_0)",
    dimensionality:"2D planar; results are per unit out-of-plane depth"
  };
}
export function conductors(p) {
  const sign=p.mirror?-1:1;
  return [
    {id:"A",cx:-0.040*sign,cy:0,hx:0.008,hy:0.014,V:p.voltage/2},
    {id:"B",cx:0.040*sign,cy:p.offsetMm/1000,hx:0.008,hy:0.014,V:-p.voltage/2}
  ];
}
// Linear triangular element stiffness. The global matrix is assembled from
// Galerkin integrals of grad(N_i)·grad(N_j) over each triangle.
// Epsilon_0 is a uniform scalar and cancels out of the Dirichlet potential solve.
export function triangleStiffness(points){
  const [a,b,c]=points;
  const cross=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);
  const area=Math.abs(cross)/2;
  if(!(area>0)) throw new RangeError("degenerate finite element triangle");
  const bb=[b.y-c.y,c.y-a.y,a.y-b.y];
  const cc=[c.x-b.x,a.x-c.x,b.x-a.x];
  const K=[];
  for(let i=0;i<3;i++)K.push([0,1,2].map(j=>(bb[i]*bb[j]+cc[i]*cc[j])/(4*area)));
  return {area,K};
}
function geometry(n){
 const h=2*HALF_DOMAIN/(n-1);
 const nodes=Array.from({length:n*n},(_,k)=>{
  const i=k%n,j=Math.floor(k/n);
  return {x:-HALF_DOMAIN+i*h,y:-HALF_DOMAIN+j*h};
 });
 const tris=[];
 for(let j=0;j<n-1;j++)for(let i=0;i<n-1;i++){
  const a=idx(i,j,n),b=idx(i+1,j,n),c=idx(i+1,j+1,n),d=idx(i,j+1,n);
  tris.push([a,b,c],[a,c,d]);
 }
 return {n,h,nodes,tris};
}
export function assemble(grid=33){
 const mesh=geometry(grid);
 const rows=Array.from({length:grid*grid},()=>new Map());
 for(const tri of mesh.tris){
  const {K}=triangleStiffness(tri.map(k=>mesh.nodes[k]));
  for(let a=0;a<3;a++)for(let b=0;b<3;b++){
   const row=rows[tri[a]],col=tri[b];
   row.set(col,(row.get(col)||0)+K[a][b]);
  }
 }
 return {...mesh,rows};
}
function boundary(mesh,p,scenario){
 const fixed=new Uint8Array(mesh.nodes.length);
 const values=new Float64Array(mesh.nodes.length);
 const labels=new Uint8Array(mesh.nodes.length);
 const electrodes=scenario==="linear"?[]:conductors(p);
 for(let k=0;k<mesh.nodes.length;k++){
  const j=Math.floor(k/mesh.n),i=k%mesh.n,{x,y}=mesh.nodes[k];
  if(i===0||j===0||i===mesh.n-1||j===mesh.n-1){
   fixed[k]=1;values[k]=scenario==="linear"?x*1000:0;
  }
  if(scenario!=="linear"){
   for(let m=0;m<electrodes.length;m++){
    const c=electrodes[m];
    if(Math.abs(x-c.cx)<=c.hx+1e-12&&Math.abs(y-c.cy)<=c.hy+1e-12){
     fixed[k]=1;values[k]=c.V;labels[k]=m+1;
    }
   }
  }
 }
 return {fixed,values,labels,electrodes};
}
export function solve(input={},options={}){
 const p=configure(input),scenario=options.scenario==="linear"?"linear":"electrodes";
 const mesh=assemble(p.grid);
 const masks=boundary(mesh,p,scenario);
 const {fixed,values}=masks;
 const diag=new Float64Array(values.length);
 const entries=new Array(values.length);
 let free=0;
 for(let k=0;k<values.length;k++){
  if(fixed[k])continue;
  free++;
  diag[k]=mesh.rows[k].get(k);
  entries[k]=[...mesh.rows[k]].filter(([col])=>col!==k&&Math.abs(mesh.rows[k].get(col))>1e-14);
 }
 const omega=p.grid===33?1.72:p.grid===49?1.81:1.86;
 const tolerance=Math.max(1,Math.abs(p.voltage))*1e-9;
 let iterations=0,maxDelta=Infinity;
 for(let cycle=0;cycle<5000;cycle++){
  maxDelta=0;
  for(let k=0;k<values.length;k++){
   if(fixed[k])continue;
   let sum=0;
   for(const [col,a] of entries[k]) sum+=a*values[col];
   const proposed=-sum/diag[k];
   const delta=omega*(proposed-values[k]);
   values[k]+=delta;
   maxDelta=Math.max(maxDelta,Math.abs(delta));
  }
  iterations=cycle+1;
  if(maxDelta<tolerance)break;
 }
 const converged=maxDelta<tolerance;
 return {...mesh,...masks,p,values,scenario,solver:{method:"Galerkin P1 triangular FEM; SOR on assembled sparse stiffness",iterations,freeNodes:free,maxDelta_V:maxDelta,tolerance_V:tolerance,converged}};
}
export function electricField(solution,i,j){
 const {n,h,values}=solution;
 if(i<=0||j<=0||i>=n-1||j>=n-1)throw new RangeError("field sample needs a 1-cell interior margin");
 return {
   ex:-(values[idx(i+1,j,n)]-values[idx(i-1,j,n)])/(2*h),
   ey:-(values[idx(i,j+1,n)]-values[idx(i,j-1,n)])/(2*h)
 };
}
export function stressAt(ex,ey) {
 const xx=0.5*EPSILON0*(ex*ex-ey*ey);
 const xy=EPSILON0*ex*ey;
 return {xx,xy,yy:-xx}; // N/m^2 in SI; integrated 2D returns N/m of depth
}
function bounds(solution,x0,x1,y0,y1){
 const {n,h}=solution;
 const snap=x=>Math.max(1,Math.min(n-2,Math.round((x+HALF_DOMAIN)/h)));
 const i0=snap(x0),i1=snap(x1),j0=snap(y0),j1=snap(y1);
 if(i1<=i0+1||j1<=j0+1)throw new RangeError("invalid contour");
 return {i0,i1,j0,j1,x0:-HALF_DOMAIN+i0*h,x1:-HALF_DOMAIN+i1*h,y0:-HALF_DOMAIN+j0*h,y1:-HALF_DOMAIN+j1*h};
}
export function integrateContour(solution,rect){
 const {i0,i1,j0,j1}=rect,ds=solution.h;
 let fx=0,fy=0;
 function add(i,j,nx,ny,weight=1){
  const {ex,ey}=electricField(solution,i,j),t=stressAt(ex,ey);
  fx+=(t.xx*nx+t.xy*ny)*ds*weight;
  fy+=(t.xy*nx+t.yy*ny)*ds*weight;
 }
 for(let j=j0;j<=j1;j++){
  const w=(j===j0||j===j1)?0.5:1;
  add(i0,j,-1,0,w);add(i1,j,1,0,w);
 }
 for(let i=i0;i<=i1;i++){
  const w=(i===i0||i===i1)?0.5:1;
  add(i,j0,0,-1,w);add(i,j1,0,1,w);
 }
 return {fx,fy,magnitude:Math.hypot(fx,fy),units:"N/m",rectangle:rect};
}
export function forceContours(solution){
 if(solution.scenario!=="electrodes")return null;
 const {electrodes}=solution;
 const individual=electrodes.map(e=>({id:e.id,...integrateContour(solution,bounds(solution,
  e.cx-e.hx-.017,e.cx+e.hx+.017,
  e.cy-e.hy-.017,e.cy+e.hy+.017))}));
 const lowY=Math.min(...electrodes.map(e=>e.cy-e.hy))-.029;
 const highY=Math.max(...electrodes.map(e=>e.cy+e.hy))+.029;
 const group=integrateContour(solution,bounds(solution,-.078,.078,lowY,highY));
 const outer=integrateContour(solution,bounds(solution,-.0875,.0875,-.0875,.0875));
 const sum={fx:individual.reduce((x,r)=>x+r.fx,0),fy:individual.reduce((x,r)=>x+r.fy,0)};
 // In the charge-free region between contours, div(T)=0; independent
 // integrals should agree as the mesh refines. Report, never overwrite, errors.
 const groupVsOuter={fx:group.fx-outer.fx,fy:group.fy-outer.fy};
 const separateVsGroup={fx:sum.fx-group.fx,fy:sum.fy-group.fy};
 return {individual,group,outer,wallReaction:{fx:-outer.fx,fy:-outer.fy},
  sumIndividual:sum,groupVsOuter,separateVsGroup,
  wholeSystemResidual:groupVsOuter};
}
export function energyPerDepth(solution){
 // Piecewise-constant P1 element gradients; energy includes every element.
 let total=0;
 for(const t of solution.tris){
  const p=t.map(k=>solution.nodes[k]),v=t.map(k=>solution.values[k]);
  const det=(p[1].x-p[0].x)*(p[2].y-p[0].y)-(p[2].x-p[0].x)*(p[1].y-p[0].y);
  const ex=-((p[1].y-p[2].y)*v[0]+(p[2].y-p[0].y)*v[1]+(p[0].y-p[1].y)*v[2])/det;
  const ey=-((p[2].x-p[1].x)*v[0]+(p[0].x-p[2].x)*v[1]+(p[1].x-p[0].x)*v[2])/det;
  total+=0.5*EPSILON0*(ex*ex+ey*ey)*Math.abs(det)/2;
 }
 return total;
}
export function run(input={}){
 const s=solve(input),force=forceContours(s);
 return {
  settings:s.p,
  mesh:{grid:s.n,nodeCount:s.nodes.length,triangles:s.tris.length,h_m:s.h},
  solver:s.solver,
  electrodeRects:s.electrodes,
  force,
  storedEnergy_J_per_m:energyPerDepth(s),
  field:{n:s.n,potential_V:Array.from(s.values),fixed:Array.from(s.fixed)},
  provenance:{experiment:"LIQ-ES2",origin:"SIMULATED",authority:"NONE",calibrated:false,
   experimental:false,thrustClaim:false,hardwareClaim:false,depthConvention:"N/m and J/m",
   method:"2D P1 FEM with Maxwell stress sampled by centered differences along rectangular loops",
   caveats:["2D slice with vacuum epsilon only","no space charge or ionic wind","no dynamic magnetic field","grounded enclosure is an external body","contour-force discretization error is measured, not corrected"] }
 };
}
export function refinement(input={}){
 const checks=[33,49,65].map(grid=>{
  const r=run({...input,grid});
  const f=r.force.group;
  return {grid,h_m:r.mesh.h_m,iterations:r.solver.iterations,converged:r.solver.converged,
    fx_N_per_m:f.fx,fy_N_per_m:f.fy,
    wallBalance_N_per_m:Math.hypot(r.force.groupVsOuter.fx,r.force.groupVsOuter.fy),
    energy_J_per_m:r.storedEnergy_J_per_m};
 });
 const mid=checks[1],fine=checks[2];
 return {checks,changeFineVsMid_N_per_m:Math.hypot(fine.fx_N_per_m-mid.fx_N_per_m,fine.fy_N_per_m-mid.fy_N_per_m),
   evidence:"mesh-refinement comparison only; no automatic accuracy/physical validation claim"};
}
