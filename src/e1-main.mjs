import {DEFAULT_E1,MODES,parameters,instant,experiment,compare,crossCheck} from "./e1-physics.mjs";

const byId=id=>document.getElementById(id);
const controls={...DEFAULT_E1};
let elapsed=0,lastFrame=0,playing=true;
let result=null,comparison=null,recomputeTimer=null;
const canvas=byId("fin"),chart=byId("trace");
const cc=canvas.getContext("2d"),gc=chart.getContext("2d");
const bindSliders=[
  ["bpm",v=>Math.round(v)+" BPM"],
  ["amplitude",v=>v.toFixed(2)+" M"],
  ["waves",v=>v.toFixed(2)],
  ["normalDrag",v=>v.toFixed(1)],
  ["tangentialDrag",v=>v.toFixed(1)],
  ["fluidScale",v=>v.toFixed(2)]
];
function refresh(){
  const p=parameters(controls);
  result=experiment(p);
  comparison=compare(p);
  const m=result.metrics;
  byId("thrust").innerHTML=m.meanThrust.toFixed(3)+" <small>N</small>";
  byId("power").innerHTML=m.meanPower.toFixed(3)+" <small>W</small>";
  byId("efficiency").innerHTML=(m.impulsePerJoule===null?"N/A":m.impulsePerJoule.toFixed(3))+" <small>N·S/J</small>";
  byId("finImpulse").textContent=m.finImpulse.toFixed(4)+" N·S";
  byId("fluidImpulse").textContent=m.fluidImpulse.toFixed(4)+" N·S";
  byId("residual").textContent=m.momentumResidual.toFixed(8)+" N·S";
  byId("energy").textContent=m.energy.toFixed(4)+" J";
  const ratio=p.tangentialDrag===0?"∞":(p.normalDrag/p.tangentialDrag).toFixed(2);
  byId("hudAnisotropy").textContent=ratio+" : 1";
  byId("direction").textContent=m.meanThrust>0.00001?"FORWARD FORCE":m.meanThrust<-.00001?"REVERSE FORCE":"NO NET FORWARD FORCE";
  byId("status").innerHTML="<i class='signal'></i> "+
    (Math.abs(m.momentumResidual)<1e-10&&m.energy>=0?"FLUID REACTION BALANCED":"CHECK REACTION / WORK");
  byId("rows").innerHTML=comparison.rows.map(row=>{
    const equal=row.matched?.achieved?row.matched.meanThrust.toFixed(4)+" N":"N/A";
    const accuracy=row.matched?.achieved?((row.matched.ratio-1)*100).toFixed(3)+"%":"NO MATCH";
    return "<tr><td>"+row.mode.toUpperCase()+"</td><td>"+row.meanThrust.toFixed(4)+" N</td><td>"+
      row.meanPower.toFixed(4)+" W</td><td class='"+(!row.matched?.achieved?"muted":"")+"'>"+
      equal+"</td><td>"+accuracy+"</td></tr>";
  }).join("");
  drawChart();
}
function scheduleRefresh(){
  clearTimeout(recomputeTimer);
  recomputeTimer=setTimeout(refresh,90);
}
bindSliders.forEach(([name,label])=>{
  const control=byId(name);
  control.addEventListener("input",e=>{
    controls[name]=Number(e.target.value);
    byId(name+"Value").textContent=label(controls[name]);
    elapsed=0;scheduleRefresh();
  });
});
document.querySelectorAll("[data-mode]").forEach(button=>button.addEventListener("click",()=>{
  controls.mode=button.dataset.mode;elapsed=0;
  document.querySelectorAll("[data-mode]").forEach(b=>{
    const selected=b===button;b.classList.toggle("active",selected);
    b.setAttribute("aria-pressed",String(selected));
  });
  scheduleRefresh();
}));
byId("reset").addEventListener("click",()=>{elapsed=0;playing=true;byId("play").textContent="Ⅱ PAUSE";});
byId("play").addEventListener("click",()=>{playing=!playing;byId("play").textContent=playing?"Ⅱ PAUSE":"▶ PLAY";});
byId("export").addEventListener("click",()=>{
  const p=parameters(controls);
  const payload={
    label:"PhiGrooveDrive LIQ-E1 trace and matched-energy comparison",
    exportedAtUTC:new Date().toISOString(),
    experiment:experiment(p),
    compare:compare(p),
    physicalStatus:"SIMULATED / NOT CFD / NOT CALIBRATED",
    modelNotes:"Fixed-mount six-node prescribed kinematics with anisotropic local linear drag; no magnetic/regen hardware."
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const href=URL.createObjectURL(blob);
  const anchor=document.createElement("a");anchor.href=href;anchor.download="phigroovedrive-liq-e1.json";
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(href),1000);
});
byId("audit").addEventListener("click",()=>{
  const p=parameters(controls);
  const clean={...p,amplitude:Math.max(.08,p.amplitude),fluidScale:1,normalDrag:2,tangentialDrag:1,mode:"wave"};
  const noMedium=experiment({...clean,fluidScale:0}).metrics;
  const noMotion=experiment({...clean,amplitude:0}).metrics;
  const isotropic=experiment({...clean,normalDrag:1,tangentialDrag:1}).metrics;
  const reversed=experiment({...clean,mode:"reverse"}).metrics;
  const forward=experiment(clean).metrics;
  const chk=crossCheck(clean);
  const pass=noMedium.finImpulse===0&&noMedium.energy===0&&
    noMotion.finImpulse===0&&noMotion.energy===0&&
    Math.abs(isotropic.finImpulse)<1e-10&&
    forward.meanThrust>0&&reversed.meanThrust<0&&
    Math.abs(forward.meanThrust+reversed.meanThrust)<1e-8&&
    chk.nonnegative&&Math.abs(chk.powerResidual)<1e-10&&
    Math.abs(chk.impulseReactionResidual)<1e-12;
  byId("auditMessage").textContent=pass?
    "PASS · No fluid/no motion => zero drag work and thrust; equal tangent/normal drag => zero axial force; direction reversal flips thrust sign; water reaction cancels fin impulse; dissipated power stays nonnegative. Numerical model checks only.":
    "FAIL · One or more controlled equations did not satisfy the expected numerical gate. This does not validate real-world thrust.";
  byId("auditMessage").style.color=pass?"#7fe3c8":"#ff9b9e";
});

function dimensions(ctx,el){
  const box=el.getBoundingClientRect();
  const dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(1,box.width),h=Math.max(1,box.height);
  const pw=Math.round(w*dpr),ph=Math.round(h*dpr);
  if(el.width!==pw||el.height!==ph){el.width=pw;el.height=ph}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return {w,h};
}
function arrow(ctx,x,y,dx,dy,color){
  const length=Math.hypot(dx,dy);
  if(length<2)return;
  const a=Math.atan2(dy,dx);
  ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1.8;
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx,y+dy);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+dx,y+dy);
  ctx.lineTo(x+dx-6*Math.cos(a-.6),y+dy-6*Math.sin(a-.6));
  ctx.lineTo(x+dx-6*Math.cos(a+.6),y+dy-6*Math.sin(a+.6));
  ctx.closePath();ctx.fill();
}
function finStage(t){
  const ctx=cc,{w,h}=dimensions(ctx,canvas);
  ctx.clearRect(0,0,w,h);
  const p=parameters(controls),now=instant(p,t);
  const left=Math.max(34,w*.085),right=w-left,scaleY=Math.min(245,h*.78);
  const cy=h*.50;
  ctx.strokeStyle="rgba(95,137,179,.09)";ctx.lineWidth=1;
  for(let x=0;x<w;x+=34){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
  for(let y=0;y<h;y+=34){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  ctx.save();ctx.setLineDash([4,7]);ctx.strokeStyle="rgba(123,185,216,.18)";
  ctx.beginPath();ctx.moveTo(left,cy);ctx.lineTo(right,cy);ctx.stroke();ctx.restore();
  const points=now.nodes.map(n=>({x:left+n.s*(right-left),y:cy-n.y*scaleY,node:n}));
  const fill=ctx.createLinearGradient(left,0,right,0);fill.addColorStop(0,"rgba(46,207,227,.08)");fill.addColorStop(1,"rgba(217,109,244,.13)");
  ctx.fillStyle=fill;
  ctx.beginPath();ctx.moveTo(points[0].x,cy);
  points.forEach(q=>ctx.lineTo(q.x,q.y));
  ctx.lineTo(points[points.length-1].x,cy);ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(125,231,246,.62)";ctx.lineWidth=3;
  ctx.shadowBlur=14;ctx.shadowColor="#39bfd8";
  ctx.beginPath();points.forEach((point,i)=>{if(i===0)ctx.moveTo(point.x,point.y);else ctx.lineTo(point.x,point.y)});ctx.stroke();
  ctx.shadowBlur=0;
  // Flow arcs are graphical explanations only, not solved electromagnetic streamlines.
  for(let j=0;j<4;j++){
    ctx.beginPath();ctx.strokeStyle="rgba(132,156,231,"+(.13-j*.025)+")";ctx.lineWidth=1;
    points.forEach((point,i)=>{const y=point.y+(j+1)*10*Math.sin(i*.9+t*2);if(i===0)ctx.moveTo(point.x,y);else ctx.lineTo(point.x,y)});
    ctx.stroke();
  }
  points.forEach((point,i)=>{
    const r=Math.max(12,Math.min(20,w*.024));
    const rgb=i<3?"75,219,243":"205,132,245";
    const glow=ctx.createRadialGradient(point.x,point.y,0,point.x,point.y,r*2.4);
    glow.addColorStop(0,"rgba("+rgb+",.40)");glow.addColorStop(1,"rgba("+rgb+",0)");
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(point.x,point.y,r*2.4,0,2*Math.PI);ctx.fill();
    ctx.fillStyle="rgba("+rgb+",.20)";
    ctx.strokeStyle="rgba("+rgb+",.9)";ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(point.x,point.y,r,0,2*Math.PI);ctx.fill();ctx.stroke();
    // Five fingers/gears per bubble, for explanatory visualization.
    for(let g=0;g<5;g++){
      const angle=(g/5)*2*Math.PI+t*(i%2?.8:-.8);
      const gx=point.x+Math.cos(angle)*(r+3),gy=point.y+Math.sin(angle)*(r+3);
      ctx.fillStyle="#c6f5fb";ctx.beginPath();ctx.arc(gx,gy,2.4,0,2*Math.PI);ctx.fill();
    }
    ctx.textAlign="center";ctx.font="700 10px Segoe UI, sans-serif";ctx.fillStyle="#e1f5ff";
    ctx.fillText(String(i+1),point.x,point.y+3);
    ctx.font="9px Segoe UI, sans-serif";ctx.fillStyle="#89acc7";
    ctx.fillText("SEG "+(i+1),point.x,cy+Math.min(105,h*.27));
    // Fixed mount: all nodes have fixed longitudinal coordinates.
    const force=point.node.fx;
    const sgn=Math.sign(force);
    if(Math.abs(force)>1e-7) arrow(ctx,point.x,point.y-29,sgn*Math.min(45,8+Math.abs(force)*140),0,"#db95ed");
    if(Math.abs(force)>1e-7) arrow(ctx,point.x,point.y+29,-sgn*Math.min(35,6+Math.abs(force)*110),0,"#edbf7e");
  });
}
function chart(){
  if(!result)return;
  const ctx=gc,{w,h}=dimensions(ctx,chart);
  ctx.clearRect(0,0,w,h);
  const l=36,r=w-14,top=16,bottom=h-26;
  ctx.font="10px Segoe UI";ctx.lineWidth=1;
  for(let j=0;j<=4;j++){
    const y=top+(bottom-top)*j/4;
    ctx.strokeStyle="rgba(124,151,179,.15)";
    ctx.beginPath();ctx.moveTo(l,y);ctx.lineTo(r,y);ctx.stroke();
  }
  const samples=result.history,maxTime=result.config.duration;
  const largestF=Math.max(.005,...samples.map(p=>Math.abs(p.thrust)));
  const largestP=Math.max(.005,...samples.map(p=>p.power));
  const series=[
    {key:"thrust",color:"#6bdced",scale:largestF,center:(top+bottom)/2,span:(bottom-top)*.43},
    {key:"power",color:"#e6be79",scale:largestP,center:bottom,span:(bottom-top)*.72}
  ];
  for(const ser of series){
    ctx.strokeStyle=ser.color;ctx.lineWidth=2;ctx.beginPath();
    samples.forEach((point,i)=>{
      const x=l+(point.time/maxTime)*(r-l);
      const y=ser.center-(point[ser.key]/ser.scale)*ser.span;
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    });ctx.stroke();
  }
  ctx.fillStyle="#7895ad";ctx.font="10px Segoe UI";ctx.fillText("0",l,bottom+16);
  ctx.fillText(maxTime.toFixed(1)+"s",r-27,bottom+16);
}
function loop(now){
  if(!lastFrame)lastFrame=now;
  const delta=Math.max(0,Math.min(.05,(now-lastFrame)/1000));lastFrame=now;
  if(playing)elapsed+=delta;
  finStage(elapsed);
  byId("clock").textContent="T + "+elapsed.toFixed(2)+" S";
  requestAnimationFrame(loop);
}
refresh();
requestAnimationFrame(loop);
