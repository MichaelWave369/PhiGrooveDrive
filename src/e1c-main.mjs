import {DEFAULT,MODES,configure,forces,report,simulate,energies} from "./e1c-physics.mjs";

const $=id=>document.getElementById(id);
const config={...DEFAULT};
let results=null,last=0,clock=0,playing=true,timer=null;
const stage=$("magStage"),plot=$("magTrace");
const stageCtx=stage.getContext("2d"),plotCtx=plot.getContext("2d");
const inputs=[
  ["bpm",v=>Math.round(v)+" BPM"],
  ["voltage",v=>v.toFixed(1)+" V"],
  ["magC",v=>(v*1000).toFixed(2)+" mJ·m²"],
  ["motorK",v=>v.toFixed(2)+" N/A"],
  ["resistance",v=>v.toFixed(2)+" Ω"],
  ["damping",v=>v.toFixed(2)]
];
const norm=n=>Math.abs(n)<1e-10?"0.000000":n.toFixed(6);
const finite=n=>Number.isFinite(n);
function safeNum(n,digits=3){return finite(n)?n.toFixed(digits):"INVALID";}
function calc(){
  try{
    const next=simulate(config);
    if(!Number.isFinite(next.metrics.residual)||!next.history.every(h=>Number.isFinite(h.gap)&&Number.isFinite(h.current)))throw Error("Model instability");
    results=next;clock=0;
    const m=next.metrics, s=next.final;
    $("busIn").innerHTML=safeNum(s.busIn)+" <small>J</small>";
    $("busReturn").innerHTML=safeNum(s.busReturn)+" <small>J</small>";
    $("busNet").innerHTML=safeNum(m.busNet)+" <small>J</small>";
    $("stored").textContent=safeNum(m.energy.total,5)+" J";
    $("copper").textContent=safeNum(s.copperHeat,5)+" J";
    $("mechanical").textContent=safeNum(s.mechanicalHeat,5)+" J";
    $("residual").textContent=norm(m.residual)+" J";
    $("peak").textContent=safeNum(m.maxCurrent,3)+" A";
    $("minGap").textContent=safeNum(m.minGap,3)+" M";
    $("momentum").textContent=norm(m.momentum)+" KG·M/S";
    $("com").textContent=norm(m.com)+" M";
    const valid=Math.abs(m.residual)<1e-4&&m.minGap>.04&&Math.abs(m.momentum)<1e-10;
    $("status").textContent=valid?"NUMERICAL CONSERVATION PASSED":"MODEL OUTSIDE QUALIFIED BOUNDS";
    $("status").style.color=valid?"#7dddbf":"#ff9da3";
    if(!valid)$("auditText").textContent="This setting exceeds at least one numerical qualification. Do not interpret it as a physically valid prototype.";
    drawTrace();
  }catch(error){
    results=null;$("status").textContent="INVALID MODEL STATE / RESET SETTINGS";
    $("status").style.color="#ff9da3";$("auditText").textContent=String(error);
  }
}
function schedule(){clearTimeout(timer);timer=setTimeout(calc,110);}
inputs.forEach(([id,fmt])=>{
  $(id).addEventListener("input",e=>{
    config[id]=Number(e.target.value);$(id+"Value").textContent=fmt(config[id]);schedule();
  });
});
document.querySelectorAll("[data-mode]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    config.mode=btn.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach(item=>{
      const active=item===btn;item.classList.toggle("active",active);item.setAttribute("aria-pressed",String(active));
    });
    $("modeNow").textContent=config.mode.toUpperCase()+" CHOREOGRAPHY";
    schedule();
  });
});
$("play").addEventListener("click",()=>{
  playing=!playing;$("play").textContent=playing?"Ⅱ PAUSE":"▶ PLAY";
});
$("restart").addEventListener("click",()=>{
  clock=0;playing=true;$("play").textContent="Ⅱ PAUSE";
});
$("download").addEventListener("click",()=>{
  if(!results)return;
  const payload={...results,exportedAtUTC:new Date().toISOString(),
   notes:"Simulation only; ideal 4-quadrant source absorbs return; no calibrated magnet / measured regeneration / thrust."};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");
  a.href=url;a.download="phigroovedrive-liq-e1c-energy.json";
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$("audit").addEventListener("click",()=>{
  const a=simulate(DEFAULT),b=simulate({...DEFAULT,magC:0}),c=simulate({...DEFAULT,mode:"off"});
  const good=[a,b,c].every(x=>Math.abs(x.metrics.residual)<1e-5&&Math.abs(x.metrics.momentum)<1e-11
    && x.metrics.minGap>.05 && Math.abs(x.metrics.com)<1e-11) &&
    b.final.gap>0 && c.final.busIn===0 && c.final.busReturn===0 &&
    a.final.busReturn>.01 && a.final.busIn>a.final.busReturn;
  $("auditText").textContent=good?
   "PASS · Equal/opposite momentum, conservative magnetic potential, back-EMF coupling, no-drive bus isolation and full source/work/heat closure. Returned energy assumes an ideal bidirectional source. These are simulation checks, not hardware proof.":
   "FAIL · A conservation or null-control check failed. Model conclusions are not promoted.";
  $("auditText").style.color=good?"#84e1c6":"#ff9eaa";
});
function dims(ctx,canvas){
 const box=canvas.getBoundingClientRect(),scale=Math.min(2,window.devicePixelRatio||1);
 const w=Math.max(1,box.width),h=Math.max(1,box.height);
 if(canvas.width!==Math.round(w*scale)||canvas.height!==Math.round(h*scale)){
   canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
 }
 ctx.setTransform(scale,0,0,scale,0,0);return {w,h};
}
function sample(t){
 const s=results?.history||[];if(s.length<2)return null;
 const target=Math.min(results.input.duration,Math.max(0,t%results.input.duration));
 let lo=0,hi=s.length-1;
 while(lo+1<hi){let mid=(lo+hi)>>1;if(s[mid].t<target)lo=mid;else hi=mid;}
 const a=s[lo],b=s[hi],u=Math.max(0,Math.min(1,(target-a.t)/Math.max(1e-9,b.t-a.t)));
 return Object.fromEntries(["gap","velocity","current","voltage","busReturn","busIn","residual"].map(k=>[k,a[k]+u*(b[k]-a[k])]).concat([["t",target]]));
}
function bubble(ctx,x,y,r,rgb,angle,sign){
 const gl=ctx.createRadialGradient(x,y,0,x,y,r*1.8);
 gl.addColorStop(0,"rgba("+rgb+",.22)");gl.addColorStop(1,"rgba("+rgb+",0)");
 ctx.fillStyle=gl;ctx.beginPath();ctx.arc(x,y,r*1.8,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="rgba("+rgb+",.08)";
 ctx.strokeStyle="rgba("+rgb+",.91)";ctx.lineWidth=2;
 ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.fill();ctx.stroke();
 for(let k=0;k<3;k++){
  ctx.lineWidth=1;ctx.strokeStyle="rgba("+rgb+","+(.35-k*.09)+")";
  ctx.beginPath();ctx.ellipse(x,y,r*(1+.18*k),r*(1-.09*k),angle+k*.65,0,2*Math.PI);ctx.stroke();
 }
 for(let finger=0;finger<5;finger++){
  const a=sign===1?(finger-2)*.28:Math.PI+(finger-2)*.28;
  const px=x+Math.cos(a)*(r-6),py=y+Math.sin(a)*(r-6);
  ctx.strokeStyle="rgba("+rgb+",.8)";
  ctx.beginPath();ctx.arc(px,py,6,0,2*Math.PI);ctx.stroke();
  ctx.fillStyle="#d6f9ff";ctx.beginPath();ctx.arc(px+sign*6,py,2.7,0,2*Math.PI);ctx.fill();
 }
}
function drawStage(t){
 const ctx=stageCtx,{w,h}=dims(ctx,stage);
 ctx.clearRect(0,0,w,h);const s=sample(t);if(!s)return;
 const cy=h*.48,scale=Math.min(w*.8,1150),radius=Math.min(w*.12,61);
 // Amplify displacement for illustration, while keeping numeric gap readouts exact.
 const center=w/2,baseOffset=Math.min(w*.27,178);
 const displacement=Math.max(-80,Math.min(80,(s.gap-results.input.initialGap)*scale));
 const left=center-baseOffset-displacement*.5,right=center+baseOffset+displacement*.5;
 ctx.strokeStyle="#7f9dc01b";ctx.lineWidth=1;
 for(let x=0;x<w;x+=34){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
 for(let y=0;y<h;y+=34){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
 ctx.save();ctx.setLineDash([4,6]);ctx.strokeStyle="#a6d7e548";
 ctx.beginPath();ctx.moveTo(0,cy);ctx.lineTo(w,cy);ctx.stroke();ctx.restore();
 for(let k=0;k<10;k++){
  const offset=(k-4.5)*15;
  ctx.strokeStyle=k%2===0?"#59dce944":"#bf8bfc49";ctx.lineWidth=k%3===0?1.5:1;
  ctx.beginPath();ctx.moveTo(left+radius*.65,cy+offset*.15);
  ctx.bezierCurveTo(left+radius+40,cy+offset*.95+Math.sin(t*3+k)*10,
  right-radius-40,cy+offset*.95-Math.sin(t*3+k)*10,right-radius*.65,cy+offset*.15);
  ctx.stroke();
 }
 const mid=center;
 const light=ctx.createRadialGradient(mid,cy,0,mid,cy,radius*1.4);
 light.addColorStop(0,"#c39ef540");light.addColorStop(1,"#c39ef500");
 ctx.fillStyle=light;ctx.beginPath();ctx.arc(mid,cy,radius*1.4,0,2*Math.PI);ctx.fill();
 bubble(ctx,left,cy,radius,"69,220,239",t*.35,1);
 bubble(ctx,right,cy,radius,"208,126,244",-t*.35,-1);
 ctx.font="10px Segoe UI,Arial";ctx.fillStyle="#dfbffa";ctx.textAlign="center";
 ctx.fillText("I = "+s.current.toFixed(3)+" A",center,cy+radius+39);
 ctx.fillText("V = "+s.voltage.toFixed(2)+" V",center,cy-radius-40);
 $("gap").textContent=s.gap.toFixed(4)+" M";
 $("clock").textContent="T + "+t.toFixed(2)+" S";
}
function drawTrace(){
 if(!results)return;
 const ctx=plotCtx,{w,h}=dims(ctx,plot);
 ctx.clearRect(0,0,w,h);const data=results.history,l=35,r=w-16,top=15,b=h-25;
 ctx.strokeStyle="#7893ad29";ctx.lineWidth=1;
 for(let j=0;j<=4;j++){const y=top+j*(b-top)/4;ctx.beginPath();ctx.moveTo(l,y);ctx.lineTo(r,y);ctx.stroke();}
 const curves=[
  {key:"gap",color:"#66e3ed",zero:false},
  {key:"current",color:"#ce92ed",zero:true},
  {key:"busReturn",color:"#e7c183",zero:false}
 ];
 for(const line of curves){
  const values=data.map(s=>s[line.key]);
  const low=Math.min(...values),high=Math.max(...values);
  const scale=Math.max(.001,high-low);
  ctx.strokeStyle=line.color;ctx.lineWidth=2;ctx.beginPath();
  data.forEach((s,i)=>{
   const x=l+(s.t/results.input.duration)*(r-l);
   const y=b-((s[line.key]-low)/scale)*(b-top)*.83-(b-top)*.085;
   if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  });ctx.stroke();
 }
 ctx.fillStyle="#849cb4";ctx.font="10px Segoe UI";ctx.fillText("0",l,b+16);
 ctx.fillText(results.input.duration.toFixed(1)+" s",r-27,b+16);
}
function animate(now){
 if(!last)last=now;
 const dt=Math.min(.06,Math.max(0,(now-last)/1000));last=now;
 if(playing)clock+=dt;
 drawStage(clock);
 requestAnimationFrame(animate);
}
calc();
requestAnimationFrame(animate);
