import {HALF_DOMAIN,configure,electricField,run,refinement} from "./es2-physics.mjs";
const $=id=>document.getElementById(id);
const fields=["voltage","offsetMm"];
let latest=null,meshStudy=null;
const fmt=(v,d=4)=>Number.isFinite(v)?v.toFixed(d):"non-finite";
const magnitude=v=>Math.hypot(v.fx,v.fy);
function settings(){
 return configure({grid:Number($("grid").value),voltage:Number($("voltage").value),
  offsetMm:Number($("offsetMm").value),mirror:$("mirror").checked});
}
function showInputs(){
 $("voltageVal").textContent=$("voltage").value+" V";
 $("offsetMmVal").textContent=$("offsetMm").value+" mm";
}
function placeContour(ctx,box,canvasWidth,canvasHeight,color,dash=[7,5],lineWidth=2){
 const x=x0=>(x0+HALF_DOMAIN)/(2*HALF_DOMAIN)*canvasWidth;
 const y=y0=>(HALF_DOMAIN-y0)/(2*HALF_DOMAIN)*canvasHeight;
 ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.setLineDash(dash);
 ctx.strokeRect(x(box.x0),y(box.y1),x(box.x1)-x(box.x0),y(box.y0)-y(box.y1));
 ctx.setLineDash([]);
}
function draw(receipt){
 const canvas=$("field"),ctx=canvas.getContext("2d");
 const n=receipt.mesh.grid,V=receipt.field.potential_V;
 const small=document.createElement("canvas");small.width=n;small.height=n;
 const sc=small.getContext("2d"),pixels=sc.createImageData(n,n);
 const max=Math.max(1,receipt.settings.voltage/2);
 for(let row=0;row<n;row++)for(let col=0;col<n;col++){
  const pot=V[(n-1-row)*n+col],scaled=Math.max(-1,Math.min(1,pot/max));
  const intensity=Math.pow(Math.abs(scaled),0.62);
  const rgb=scaled>=0?[28+199*intensity,49+106*intensity,75+60*intensity]:
  [28+34*intensity,49+139*intensity,75+135*intensity];
  const k=4*(row*n+col);
  pixels.data[k]=rgb[0];pixels.data[k+1]=rgb[1];
  pixels.data[k+2]=rgb[2];pixels.data[k+3]=255;
 }
 sc.putImageData(pixels,0,0);
 const dpr=Math.min(2,window.devicePixelRatio||1),w=canvas.clientWidth||720,h=canvas.clientHeight||720;
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=true;ctx.drawImage(small,0,0,w,h);
 const x=x0=>(x0+HALF_DOMAIN)/(2*HALF_DOMAIN)*w;
 const y=y0=>(HALF_DOMAIN-y0)/(2*HALF_DOMAIN)*h;
 // Display the Dirichlet conductor rectangles, no fake field lines.
 for(const e of receipt.electrodeRects){
  ctx.strokeStyle=e.id==="A"?"#ffc8a3":"#a3f5f5";
  ctx.lineWidth=3;ctx.setLineDash([]);
  const lx=x(e.cx-e.hx),rx=x(e.cx+e.hx),ty=y(e.cy+e.hy),by=y(e.cy-e.hy);
  ctx.strokeRect(lx,ty,rx-lx,by-ty);
  ctx.fillStyle="#fff";ctx.font="bold 14px system-ui";
  ctx.fillText(e.id,lx+4,ty+19);
 }
 placeContour(ctx,receipt.force.group.rectangle,w,h,"#b3f3aa",[7,4],2.4);
 placeContour(ctx,receipt.force.outer.rectangle,w,h,"#ecdd92",[6,4],2.4);
 for(const e of receipt.force.individual)placeContour(ctx,e.rectangle,w,h,"#b9d5f4",[3,4],1.1);
 ctx.font="11px system-ui";ctx.fillStyle="#e4f8ff";ctx.textAlign="left";
 ctx.fillText("POTENTIAL V(x,y)",12,20);
 ctx.fillText(`GRID ${n} × ${n} · ${receipt.mesh.triangles} TRIANGLES`,12,h-14);
}
function fillStats(r){
 $("groupForce").textContent=fmt(magnitude(r.force.group)*1e6);
 $("wallForce").textContent=fmt(magnitude(r.force.wallReaction)*1e6);
 $("residual").textContent=fmt(magnitude(r.force.wholeSystemResidual)*1e6);
 $("contourDiff").textContent=fmt(magnitude(r.force.separateVsGroup)*1e6);
 $("energy").textContent=fmt(r.storedEnergy_J_per_m*1e6,5);
 $("iterations").textContent=String(r.solver.iterations);
 const group=magnitude(r.force.group),err=magnitude(r.force.wholeSystemResidual);
 $("interpretation").textContent=!r.solver.converged?
  "Numerical solver did not meet the declared voltage tolerance. Interpret force output as unresolved.":
  group<1e-9?
  "Symmetry/null case: the grouped force is very small, though each electrode experiences a substantial mutual force. Absolute contour errors are reported.":
  `The electrodes exchange force with the grounded enclosure. Contour difference = ${fmt(err*1e6,5)} µN/m; no reactionless thrust is inferred.`;
}
function setBusy(busy,txt){
 for(const k of ["solve","refine","export"])$(k).disabled=busy;
 $("status").textContent=txt;
}
function waitForPaint(){return new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));}
async function calculate(){
 showInputs();setBusy(true,"Solving Galerkin potential and evaluating closed stress contours…");
 await waitForPaint();
 try{
  latest=run(settings());meshStudy=null;
  $("meshRows").innerHTML='<tr><td colspan="4">Run a new mesh study for these settings.</td></tr>';
  $("meshSummary").textContent="Mesh refinement was not run for this configuration.";
  draw(latest);fillStats(latest);
  $("status").textContent=latest.solver.converged?
   `SIMULATED · solver converged after ${latest.solver.iterations} iterations · no physical evidence`:
   "WARNING · potential solver did not converge";
 }catch(error){$("status").textContent="Model error: "+String(error.message||error);}
 finally{for(const k of ["solve","refine","export"])$(k).disabled=false;}
}
async function refine(){
 if(!latest)await calculate();
 setBusy(true,"Solving 33, 49 and 65-node meshes independently…");
 await waitForPaint();
 try{
  meshStudy=refinement(settings());
  $("meshRows").replaceChildren();
  for(const data of meshStudy.checks){
   const tr=document.createElement("tr");
   for(const value of [String(data.grid),fmt(data.fx_N_per_m*1e6,4),fmt(data.fy_N_per_m*1e6,4),fmt(data.wallBalance_N_per_m*1e6,4)]){
    const td=document.createElement("td");td.textContent=value;tr.append(td);
   }
   $("meshRows").append(tr);
  }
  $("meshSummary").textContent="49→65 force-vector change: "+
    fmt(meshStudy.changeFineVsMid_N_per_m*1e6,4)+" µN/m ("+
    fmt(100*meshStudy.relativeChangeFineVsMid,1)+"% relative). "+
    meshStudy.stabilityScreen+". Mesh and staircase geometry error remain; no propulsion inference.";
  $("status").textContent="SIMULATED · "+meshStudy.stabilityScreen+
   " · three-grid results are not calibrated measurements.";
 }catch(error){$("status").textContent="Mesh study error: "+String(error.message||error);}
 finally{for(const k of ["solve","refine","export"])$(k).disabled=false;}
}
$("solve").addEventListener("click",calculate);
$("refine").addEventListener("click",refine);
$("export").addEventListener("click",()=>{
 if(!latest){$("status").textContent="Solve the current model before exporting.";return;}
 const receipt={schema:"PHIGROOVEDRIVE_LIQ_ES2_V1",createdUTC:new Date().toISOString(),
  ...latest,refinement:meshStudy};
 const b=new Blob([JSON.stringify(receipt,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(b),a=document.createElement("a");
 a.href=url;a.download="phigroovedrive-liq-es2-simulated.json";
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1200);
});
for(const k of fields)$(k).addEventListener("input",showInputs);
for(const k of [...fields,"grid","mirror"])$(k).addEventListener("change",()=>{
 $("status").textContent="Settings changed. Select SOLVE FIELDS to recompute and invalidate previous results.";
 latest=null;meshStudy=null;
});
window.addEventListener("resize",()=>{if(latest)draw(latest);});
showInputs();calculate();
