import {DEFAULTS,configure,evaluate,sweep,audit} from "./es1-physics.mjs";
const $=id=>document.getElementById(id);
const controls=["asymmetry","spacingCm","chargeNC","wallChargeNC","wallGapCm"];
let selectedForce="internal";
const format=(n)=>Math.abs(n)<1e-10?"0.000000":(n*1000).toFixed(6);
function values(){
 const input={mode:$("mode").value,mirror:$("mirror").checked};
 for(const k of controls) input[k]=Number($(k).value);
 return configure(input);
}
function schematics(result) {
 const nodes=[...result.electrodes];
 if(result.wall)nodes.push({...result.wall,id:"W"});
 const xMin=Math.min(...nodes.map(n=>n.x))-0.045;
 const xMax=Math.max(...nodes.map(n=>n.x))+0.045;
 const scale=x=>82+596*(x-xMin)/(xMax-xMin);
 const chargeColors={A:"#71e1ee",B:"#e3acff",C:"#f1d389",W:"#e6ebf2"};
 const left=scale(Math.min(...result.electrodes.map(n=>n.x)))-34;
 const right=scale(Math.max(...result.electrodes.map(n=>n.x)))+34;
 const parts=[
   '<rect x="22" y="28" width="716" height="180" rx="12" fill="none" stroke="#293e56"/>',
   '<line x1="40" y1="110" x2="718" y2="110" stroke="#547187" stroke-width="2" stroke-dasharray="5 8"/>',
   `<rect x="${left}" y="63" width="${right-left}" height="105" rx="16" fill="#2b5362" fill-opacity=".17" stroke="#73c3cb" stroke-dasharray="8 5"/>`,
   `<text x="${left+8}" y="48" fill="#95edec" font-size="11">DEVICE BOUNDARY</text>`
 ];
 for(const n of nodes){
   const x=scale(n.x),outer=n.id==="W";
   parts.push(`<circle cx="${x}" cy="110" r="${outer?19:23}" stroke="${chargeColors[n.id]}" stroke-width="2" fill="${chargeColors[n.id]}" fill-opacity=".22"/>`);
   parts.push(`<text x="${x}" y="115" text-anchor="middle" fill="#f4fcff" font-size="13" font-weight="800">${n.id}</text>`);
   parts.push(`<text x="${x}" y="157" text-anchor="middle" fill="#bbd2df" font-size="10">${(n.q*1e9).toFixed(2)} nC</text>`);
   if(outer)parts.push(`<text x="${x}" y="85" text-anchor="middle" fill="#f2d49b" font-size="10">OUTSIDE</text>`);
 }
 $("diagram").innerHTML=parts.join("");
}
function forceRows(r){
 const forces=r.forceN.map(row=>({name:row.id,value:row[selectedForce]*1000}));
 const maximum=Math.max(1e-10,...forces.map(row=>Math.abs(row.value)));
 $("forceRows").replaceChildren();
 for(const row of forces){
   const el=document.createElement("div");el.className="forcerow";
   const name=document.createElement("strong");name.textContent=row.name;
   const track=document.createElement("div");track.className="track";
   const zero=document.createElement("div");zero.className="zero";
   const bar=document.createElement("div");bar.className="bar "+(selectedForce==="external"?"external":selectedForce==="total"?"total":"");
   const width=44*Math.abs(row.value)/maximum;
   bar.style.width=width+"%";
   bar.style.left=(row.value<0?50-width:50)+"%";
   track.append(zero,bar);
   const value=document.createElement("span");value.textContent=row.value.toFixed(5)+" mN";
   el.append(name,track,value);$("forceRows").append(el);
 }
}
function sweepTable(settings){
 const rows=sweep(settings);
 $("sweep").replaceChildren();
 for(const row of rows){
   const tr=document.createElement("tr");
   for(const value of [row.asymmetry.toFixed(2),row.internalNet_mN.toFixed(6),row.deviceTotal_mN.toFixed(6),row.wallReaction_mN.toFixed(6)]){
     const td=document.createElement("td");td.textContent=value;tr.append(td);
   }
   $("sweep").append(tr);
 }
}
function render(){
 const p=values(),r=evaluate(p);
 for(const key of controls){
   $(""+key+"Value").textContent=key==="asymmetry"?p[key].toFixed(2):p[key]+(key==="chargeNC"||key==="wallChargeNC"?" nC":" cm");
 }
 $("wallChargeNC").disabled=p.mode!=="wall";
 $("wallGapCm").disabled=p.mode!=="wall";
 $("internalNet").textContent=format(r.totalsN.internalNet)+" mN";
 $("deviceExternal").textContent=format(r.totalsN.deviceExternal)+" mN";
 $("deviceTotal").textContent=format(r.totalsN.deviceTotal)+" mN";
 $("reactionOnWall").textContent=format(r.totalsN.reactionOnWall)+" mN";
 $("combinedResidual").textContent=format(r.totalsN.combinedResidual)+" mN";
 $("interpretation").textContent=p.mode==="isolated"
   ?"All force pairs belong to the device, so its total static Coulomb force cancels even when the geometry is asymmetric."
   :"The device experiences a force from the outside charged object. That object receives the opposite reaction. This is external coupling, not a reactionless engine.";
 schematics(r);forceRows(r);sweepTable(p);
}
for(const k of [...controls,"mode","mirror"]) $(k).addEventListener("input",render);
document.querySelectorAll("[data-kind]").forEach(b=>b.addEventListener("click",()=>{
 selectedForce=b.dataset.kind;
 document.querySelectorAll("[data-kind]").forEach(x=>x.classList.toggle("active",x===b));
 render();
}));
$("qualify").addEventListener("click",()=>{
 const r=audit();$("auditResult").textContent=r.pass
   ?`PASS · ${r.caseCount} synthetic conservation cases. No empirical force has been measured.`
   :"FAIL · numerical force balance exceeded tolerance.";
 $("auditResult").style.color=r.pass?"#9de4cc":"#ff9ea9";
});
$("export").addEventListener("click",()=>{
 const settings=values();
 const record={schema:"PHIGROOVEDRIVE_LIQ_ES1_V1",generatedUTC:new Date().toISOString(),
  ...evaluate(settings),sweep:sweep(settings),qualification:audit()};
 const blob=new Blob([JSON.stringify(record,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="phigroovedrive-liq-es1-simulated.json";
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
render();
