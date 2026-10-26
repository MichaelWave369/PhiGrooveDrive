import {DEFAULTS, initialState, step, ledger, run, keyholePair} from "./physics.mjs";

const $=id=>document.getElementById(id);
const canvas=$("stage"), plot=$("chart");
const settings={...DEFAULTS};
let state=initialState(settings), playing=true, accumulator=0, lastFrame=0, lastTrace=0, lastMetrics=0;
let history=[{t:0,gap:ledger(state).gap,rest:state.restGap}];
const fixed=1/240;
const fields=[
  ["bpm",v=>Math.round(v)+" BPM",v=>Number(v)],
  ["amplitude",v=>Number(v).toFixed(2)+" M",v=>Number(v)],
  ["springK",v=>Math.round(v)+" N/M",v=>Number(v)],
  ["damping",v=>Number(v).toFixed(2),v=>Number(v)]
];
function restart(){
  state=initialState(settings);history=[{t:0,gap:ledger(state).gap,rest:state.restGap}];
  accumulator=0;lastTrace=0;lastMetrics=0;updateStats();
}
fields.forEach(([id,label,parse])=>{
  $(id).addEventListener("input",e=>{
    settings[id]=parse(e.target.value);$(id+"Value").textContent=label(settings[id]);
    restart();
  });
});
document.querySelectorAll("[data-mode]").forEach(btn=>btn.addEventListener("click",()=>{
  settings.mode=btn.dataset.mode;
  document.querySelectorAll("[data-mode]").forEach(x=>{
    const active=x===btn;x.classList.toggle("active",active);x.setAttribute("aria-pressed",String(active));
  });
  restart();
}));
$("play").addEventListener("click",()=>{
  playing=!playing;$("play").textContent=playing?"Ⅱ PAUSE":"▶ PLAY";
});
$("reset").addEventListener("click",restart);
function exportTrace(){
  const duration=Math.max(1,Math.min(10,state.time||6));
  const record=run(settings,duration,fixed);
  const payload={
    title:"ΦGrooveDrive LIQ-E0 reproducible trace",
    disclaimer:"Computational model only; not a propulsion or electromagnetic field measurement",
    settings:{...settings},
    ...record,
    generatedUTC:new Date().toISOString()
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="phigroovedrive-liq-e0-trace.json";
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
}
$("export").addEventListener("click",exportTrace);

const pair=keyholePair();
$("futureA").textContent=pair.futureA.toFixed(4)+" m";
$("futureB").textContent=pair.futureB.toFixed(4)+" m";
$("futureDiff").textContent=Math.abs(pair.difference).toFixed(4)+" m";

function audit(){
  const results=["lock","liquid","wave","pop"].map(mode=>{
    const result=run({...settings,mode},6,1/240);
    return {mode,...result.metrics};
  });
  const tol=0.005;
  const pass=results.every(r=>
    Math.abs(r.momentumError)<1e-9 && Math.abs(r.centerDrift)<1e-9 &&
    Math.abs(r.residual)<tol && Number.isFinite(r.total)
  ) && Math.abs(keyholePair().difference)>0.01;
  $("auditResult").textContent=pass
   ?"PASS · 4 control modes preserve isolated-system momentum; energy residual < 0.005 J; matched coarse Keyhole states diverge after intervention. This is numerical evidence only."
   :"FAIL · A numerical conservation or Keyhole gate exceeded tolerance. Do not interpret the visual output as validated dynamics.";
  $("auditResult").style.color=pass?"#89e3cc":"#f49eaa";
}
$("audit").addEventListener("click",audit);

function metric(n){if(Math.abs(n)<1e-10)return "0.0000";return n.toFixed(4);}
function updateStats(){
  const m=ledger(state);
  $("gapLarge").innerHTML=m.gap.toFixed(3)+" <small>m</small>";
  $("momentum").textContent=metric(m.momentumError);
  $("comDrift").textContent=metric(m.centerDrift);
  $("residual").textContent=metric(m.residual);
  $("work").textContent=metric(m.work);
  $("stored").textContent=metric(m.total);
  $("loss").textContent=metric(m.loss);
  $("time").textContent="T + "+state.time.toFixed(2)+" S";
  const passes=Math.abs(m.momentumError)<1e-9&&Math.abs(m.centerDrift)<1e-9&&Math.abs(m.residual)<0.01;
  $("ledgerStatus").textContent=passes?"NUMERICAL LEDGER WITHIN TOLERANCE":"CHECK NUMERICAL CONSERVATION";
  $("ledgerStatus").parentElement.style.color=passes?"#8deacb":"#ff9fa6";
}
function surface(ctx,el){
  const rect=el.getBoundingClientRect();
  const dpr=Math.min(2,devicePixelRatio||1);
  const w=Math.max(1,rect.width),h=Math.max(1,rect.height);
  const width=Math.round(w*dpr),height=Math.round(h*dpr);
  if(el.width!==width||el.height!==height){el.width=width;el.height=height}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return {w,h};
}
const stageCtx=canvas.getContext("2d"),chartCtx=plot.getContext("2d");
function sphere(ctx,x,y,r,rgb,side,time){
  ctx.save();
  const glow=ctx.createRadialGradient(x,y,r*0.05,x,y,r*1.7);
  glow.addColorStop(0,"rgba("+rgb+",0.18)");
  glow.addColorStop(0.5,"rgba("+rgb+",0.14)");
  glow.addColorStop(1,"rgba("+rgb+",0)");
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,1.75*r,0,2*Math.PI);ctx.fill();
  const body=ctx.createRadialGradient(x-r*.35,y-r*.42,r*.04,x,y,r);
  body.addColorStop(0,"rgba("+rgb+",0.29)");
  body.addColorStop(.5,"rgba("+rgb+",0.10)");
  body.addColorStop(1,"rgba("+rgb+",0.035)");
  ctx.fillStyle=body;ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.fill();
  for(let k=0;k<3;k++){
    ctx.lineWidth=k===0?2:1;
    ctx.strokeStyle="rgba("+rgb+","+[.9,.43,.16][k]+")";
    ctx.beginPath();ctx.ellipse(x,y,r*(1+k*.21),r*(0.94+k*.17),time*.16*(side?1:-1)+k*.4,0,2*Math.PI);ctx.stroke();
  }
  // Gear fingers: articulated control markers, not literal magnetic field data.
  const direction=side?-1:1;
  for(let k=0;k<5;k++){
    const angle=(side?Math.PI:0)+(k-2)*.34;
    const sway=Math.sin(time*5+k*.8)*(2+k*.18);
    const px=x+(r-2)*Math.cos(angle),py=y+(r-2)*Math.sin(angle);
    const qx=px+direction*(11+sway),qy=py+(k-2)*3;
    ctx.strokeStyle="rgba("+rgb+",.68)";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(qx,qy);ctx.stroke();
    ctx.fillStyle="#d9faff";ctx.beginPath();ctx.arc(qx,qy,3.1,0,2*Math.PI);ctx.fill();
    ctx.strokeStyle="rgba("+rgb+",0.85)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(px,py,7.5,0,2*Math.PI);ctx.stroke();
  }
  ctx.fillStyle="rgba("+rgb+",.9)";ctx.beginPath();ctx.arc(x,y,3,0,2*Math.PI);ctx.fill();
  ctx.restore();
}
function stage(){
  const ctx=stageCtx,{w,h}=surface(ctx,canvas);
  ctx.clearRect(0,0,w,h);
  const t=state.time;
  // Grid and coordinate axes in screen space.
  ctx.strokeStyle="rgba(88,130,178,.085)";ctx.lineWidth=1;
  for(let x=0;x<w;x+=33){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
  for(let y=0;y<h;y+=33){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  const cy=h*.47,scale=Math.min(w*.30,164),rad=Math.max(31,Math.min(w*.105,72));
  const x1=w/2+state.x1*scale,x2=w/2+state.x2*scale;
  ctx.save();
  ctx.setLineDash([5,7]);ctx.strokeStyle="rgba(142,177,212,.22)";
  ctx.beginPath();ctx.moveTo(0,cy);ctx.lineTo(w,cy);ctx.stroke();ctx.setLineDash([]);ctx.restore();
  // Nonphysical flow illustration around the measured inter-module gap.
  for(let k=0;k<10;k++){
    const shift=(k-4.5)*13;
    const travel=Math.sin(t*3+k*.62)*8;
    ctx.strokeStyle=k%2===0?"rgba(75,224,243,.19)":"rgba(219,130,246,.2)";
    ctx.lineWidth=k%3===0?1.6:.8;
    ctx.beginPath();ctx.moveTo(x1+rad*.7,cy+shift*.28);
    ctx.bezierCurveTo(x1+rad+25,cy+shift*2.1+travel,x2-rad-25,cy+shift*2.1-travel,x2-rad*.7,cy+shift*.28);
    ctx.stroke();
  }
  const mid=(x1+x2)/2;
  const glow=ctx.createRadialGradient(mid,cy,3,mid,cy,Math.max(32,rad*.83));
  glow.addColorStop(0,"rgba(202,174,255,.29)");glow.addColorStop(.7,"rgba(119,100,233,.09)");glow.addColorStop(1,"rgba(119,100,233,0)");
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(mid,cy,Math.max(32,rad*.83),0,2*Math.PI);ctx.fill();
  for(let k=0;k<3;k++){
    ctx.save();ctx.translate(mid,cy);ctx.rotate(t*.32+k*.75);
    ctx.strokeStyle=["rgba(139,209,242,.27)","rgba(219,135,242,.22)","rgba(190,183,246,.14)"][k];
    ctx.beginPath();ctx.ellipse(0,0,rad*.38,rad*.85,k*.5,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  sphere(ctx,x1,cy,rad,"62,221,243",0,t);
  sphere(ctx,x2,cy,rad,"207,121,247",1,t);
  // Actual physical gap visual markers; separation overlay intentionally stylized.
  const left=x1+rad*.33,right=x2-rad*.33;
  ctx.lineWidth=1;ctx.strokeStyle="rgba(237,200,139,.6)";ctx.setLineDash([3,5]);
  ctx.beginPath();ctx.moveTo(left,cy+rad+19);ctx.lineTo(right,cy+rad+19);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle="#d4b67b";ctx.beginPath();ctx.arc(mid,cy+rad+19,3,0,2*Math.PI);ctx.fill();
}
function drawChart(){
  const ctx=chartCtx,{w,h}=surface(ctx,plot),left=38,right=w-18,top=18,bottom=h-29;
  ctx.clearRect(0,0,w,h);
  const min=.25,max=1.35;
  ctx.font="10px Segoe UI,Arial,sans-serif";
  ctx.strokeStyle="rgba(105,144,181,.18)";ctx.fillStyle="#7698b3";
  for(let k=0;k<5;k++){
    const value=min+(max-min)*k/4;
    const y=bottom-(bottom-top)*k/4;
    ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();
    ctx.fillText(value.toFixed(2),4,y+3);
  }
  if(history.length<2)return;
  const start=history[0].t,end=Math.max(start+.01,history[history.length-1].t);
  const yOf=v=>bottom-(v-min)/(max-min)*(bottom-top);
  const series=[["gap","#5cdbef"],["rest","#e7bd70"]];
  for(const [key,color] of series){
    ctx.beginPath();ctx.lineWidth=2;ctx.strokeStyle=color;
    history.forEach((p,i)=>{
      const x=left+(p.t-start)/(end-start)*(right-left);
      const y=yOf(p[key]);
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    });ctx.stroke();
  }
  ctx.fillStyle="#7894ab";ctx.fillText(start.toFixed(1)+"s",left,bottom+16);
  ctx.fillText(end.toFixed(1)+"s",Math.max(left,right-26),bottom+16);
}
function animation(now){
  if(!lastFrame)lastFrame=now;
  const elapsed=Math.min(.07,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
  if(playing){
    accumulator+=elapsed;
    let count=0;
    while(accumulator>=fixed && count<16){
      state=step(state,fixed);accumulator-=fixed;count++;
      if(state.time-lastTrace>1/30){
        history.push({t:state.time,gap:ledger(state).gap,rest:state.restGap});
        if(history.length>230)history.shift();
        lastTrace=state.time;
      }
    }
    if(count===16)accumulator=0; // never simulate unbounded hidden-tab backlog
  }
  stage();drawChart();
  if(now-lastMetrics>100){updateStats();lastMetrics=now}
  requestAnimationFrame(animation);
}
updateStats();
requestAnimationFrame(animation);
