import {compare,settings,CASES} from "./helix-compare.mjs";
const $=id=>document.getElementById(id),ids=["referenceDrive","maxDrive","frequency","periods","rungK","nestedK","strandK","damping"];
const fmt=(n,d=4)=>Number.isFinite(n)?n.toFixed(d):"N/A",sci=n=>Number.isFinite(n)?n.toExponential(2):"N/A";
let latest=null;
function input(){const raw={};for(const id of ids)raw[id]=Number($(id).value);return settings(raw);}
function labels(){for(const id of ids)$(id+"Val").textContent=Number($(id).value).toFixed(id==="periods"?0:2);}
for(const id of ids)$(id).addEventListener("input",()=>{labels();latest=null;$("export").disabled=true;$("status").textContent="Controls changed. Rerun to compare with the new settings.";});
function cell(tr,text,cls){const td=document.createElement("td");td.textContent=text;if(cls)td.className=cls;tr.appendChild(td);return td;}
function render(r){
 const arms=r.cases,matched=arms.filter(a=>a.status==="MATCHED").length;
 $("reference").textContent=fmt(r.baselineGrossPositiveWork,5);$("matchCount").textContent=matched+" / 3";$("matchTol").textContent=(r.settings.tolerance*100).toFixed(1)+"%";
 const body=$("results");body.replaceChildren();
 for(const arm of arms){
   const tr=document.createElement("tr"),name=CASES.find(c=>c.id===arm.id).label;
   cell(tr,name);
   cell(tr,arm.status,arm.status==="NO_MATCH"?"tag warn":"tag");
   if(arm.status==="NO_MATCH"){
     cell(tr,"N/A");cell(tr,arm.closestWork===undefined?"N/A":fmt(arm.closestWork,4)+" nearest");
     cell(tr,"N/A");cell(tr,"N/A");cell(tr,"N/A");body.appendChild(tr);
     const details=document.createElement("tr");
     const td=cell(details,"NO MATCH: "+arm.reason+" · target "+fmt(arm.targetWork,5),"small");td.colSpan=7;body.appendChild(details);continue;
   }
   const m=arm.trial.metrics;
   cell(tr,fmt(arm.drive,4),"num");
   const w=cell(tr,fmt(m.positiveWork,5),"num"),small=document.createElement("small");
   small.textContent=arm.status==="REFERENCE"?"baseline":"work mismatch "+(arm.relativeError*100).toFixed(2)+"%";w.appendChild(small);
   const fidelity=cell(tr,fmt(m.mirrorScore,3),"num");
   const bar=document.createElement("div");bar.className="bar";
   const inner=document.createElement("span");inner.style.width=(100*m.mirrorScore).toFixed(1)+"%";bar.appendChild(inner);fidelity.appendChild(bar);
   const delta=document.createElement("small");delta.textContent="change "+(m.mirrorChange>=0?"+":"")+fmt(m.mirrorChange,3);fidelity.appendChild(delta);
   cell(tr,fmt(m.nestedAlignment,3),"num");cell(tr,sci(m.energyResidual),"num");body.appendChild(tr);
 }
 const detail=$("detail");detail.replaceChildren();
 const title=document.createElement("div");title.className="label";title.textContent="INTERPRETATION";detail.appendChild(title);
 const summary=document.createElement("p");summary.className="small";summary.textContent=matched+" of 3 alternatives matched the input-work target within "+(100*r.settings.tolerance).toFixed(1)+"%. Compare changes in mirror and nested alignment only for matched arms.";detail.appendChild(summary);
 const base=arms[0].trial.metrics,pre=document.createElement("pre");
 pre.textContent="BASELINE LEDGER\npositive actuator work  "+fmt(base.positiveWork,6)+"\nnegative actuator work  "+fmt(base.negativeWork,6)+"\nsigned drive work       "+fmt(base.signedDriveWork,6)+"\nheat loss surrogate     "+fmt(base.heat,6)+"\ngross work residual     "+sci(base.grossAccountingResidual)+"\nenergy residual         "+sci(base.energyResidual);
 detail.appendChild(pre);
 const note=document.createElement("p");note.className="small";note.textContent="No model outcome implies physical thrust, new forces, electricity recovery or a cosmological mechanism.";detail.appendChild(note);
 $("status").textContent="Simulation complete: "+matched+" matched alternatives. A reproducible JSON receipt is ready.";$("export").disabled=false;
}
$("run").addEventListener("click",()=>{
 $("run").disabled=true;$("export").disabled=true;$("status").textContent="Calculating the bounded work matches locally...";
 requestAnimationFrame(()=>setTimeout(()=>{
   try{latest=compare(input());render(latest);}catch(e){latest=null;$("status").textContent="Bench failed: "+e.message;}finally{$("run").disabled=false;}
 },0));
});
$("export").addEventListener("click",()=>{
 if(!latest)return;const blob=new Blob([JSON.stringify(latest,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="phigroovedrive-liq-h2-matched-work.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
labels();
