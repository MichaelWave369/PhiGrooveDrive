// LIQ-E1 v0.1: six-node kinematic fin with anisotropic linear local drag.
// This is an illustrative reduced-order resistive-force surrogate, NOT CFD.
// Fluid interaction supplies reaction impulse; the fin is FIXED to a mount.
// Fluid coefficients are assumed parameters, not experimentally calibrated.
export const E1_VERSION="LIQ-E1-0.1.0";
export const MODES=Object.freeze(["wave","liquid","pop","standing","sync","reverse"]);
export const DEFAULT_E1=Object.freeze({
  segments:6,length:1,amplitude:0.12,bpm:120,waves:1,
  tangentialDrag:1,normalDrag:2,fluidScale:1,duration:4,dt:1/240,
  mode:"liquid",phase:0
});
const bound=(x,min,max,fallback)=>Number.isFinite(Number(x))?Math.max(min,Math.min(max,Number(x))):fallback;
export function parameters(input={}){
  const p={...DEFAULT_E1,...input};
  return {
    segments:6,
    length:1,
    amplitude:bound(p.amplitude,0,0.3,0.12),
    bpm:bound(p.bpm,40,240,120),
    waves:bound(p.waves,0.2,2,1),
    tangentialDrag:bound(p.tangentialDrag,0,20,1),
    normalDrag:bound(p.normalDrag,0,30,2),
    fluidScale:bound(p.fluidScale,0,3,1),
    duration:bound(p.duration,0.1,20,4),
    dt:bound(p.dt,1/2000,1/60,1/240),
    mode:MODES.includes(p.mode)?p.mode:"liquid",
    phase:bound(p.phase,-2*Math.PI,2*Math.PI,0)
  };
}
export function nodeState(pInput,t,index){
  const p=parameters(pInput);
  const s=index/(p.segments-1), x=p.length*s;
  const omega=2*Math.PI*p.bpm/60;
  const sign=p.mode==="reverse"?-1:1;
  const k=sign*2*Math.PI*p.waves/p.length;
  const a=omega*t+k*x+p.phase;
  let f=0,dphase=0,dx=0,dt=0;
  switch(p.mode){
    case "liquid":
      f=.72*Math.sin(a)+.28*Math.sin(2*a+Math.PI/3);
      dphase=.72*Math.cos(a)+.56*Math.cos(2*a+Math.PI/3);
      dx=p.amplitude*dphase*k;dt=p.amplitude*dphase*omega;
      break;
    case "pop":{
      const sn=Math.sin(a);
      f=sn**5;dphase=5*sn**4*Math.cos(a);
      dx=p.amplitude*dphase*k;dt=p.amplitude*dphase*omega;
      break;
    }
    case "standing":
      f=Math.sin(Math.PI*s)*Math.sin(omega*t+p.phase);
      dx=p.amplitude*Math.PI/p.length*Math.cos(Math.PI*s)*Math.sin(omega*t+p.phase);
      dt=p.amplitude*Math.sin(Math.PI*s)*omega*Math.cos(omega*t+p.phase);
      break;
    case "sync":
      f=Math.sin(omega*t+p.phase);
      dx=0;dt=p.amplitude*omega*Math.cos(omega*t+p.phase);
      break;
    default:
      f=Math.sin(a);dphase=Math.cos(a);
      dx=p.amplitude*dphase*k;dt=p.amplitude*dphase*omega;
  }
  return {index,s,x,y:p.amplitude*f,vy:dt,slope:dx,phase:a};
}
export function instant(input={},t=0){
  const p=parameters(input);
  const dx=p.length/(p.segments-1);
  const nodes=[];
  let fx=0,fy=0,power=0;
  for(let i=0;i<p.segments;i++){
    const n=nodeState(p,t,i);
    const factor=(i===0||i===p.segments-1)?0.5:1;
    const ds=dx*factor;
    const tangentSq=n.slope*n.slope;
    const denom=1+tangentSq;
    // Local linear RFT: F = -c_t v_t t - c_n v_n n (per length).
    // Velocity is only in y, because x coordinates are mounted/fixed.
    const coefficient=p.fluidScale*(p.normalDrag-p.tangentialDrag);
    const xForce=ds*coefficient*n.vy*n.slope/denom;
    const yForce=-ds*p.fluidScale*n.vy*
      (p.tangentialDrag*tangentSq+p.normalDrag)/denom;
    const segmentPower=-yForce*n.vy; // >=0 for c_t,c_n >=0.
    n.fx=xForce;n.fy=yForce;n.power=segmentPower;
    fx+=xForce;fy+=yForce;power+=segmentPower;
    nodes.push(n);
  }
  return {t,nodes,fx,fy,power,fluidFx:-fx,fluidFy:-fy,
    mounted:true,origin:"SIMULATED",authority:"NONE"};
}
export function experiment(input={}){
  const p=parameters(input), steps=Math.max(1,Math.ceil(p.duration/p.dt));
  const dt=p.duration/steps;
  let impulseX=0,impulseY=0,energy=0,positiveImpulse=0,peakForce=0;
  const history=[];
  const stride=Math.max(1,Math.ceil(steps/240));
  for(let i=0;i<steps;i++){
    const at=(i+.5)*dt;
    const s=instant(p,at);
    impulseX+=s.fx*dt;impulseY+=s.fy*dt;
    energy+=s.power*dt;
    positiveImpulse+=Math.max(s.fx,0)*dt;
    peakForce=Math.max(peakForce,Math.abs(s.fx));
    if(i%stride===0||i===steps-1){
      history.push({time:at,thrust:s.fx,power:s.power,finImpulse:impulseX,
        fluidImpulse:-impulseX,energy});
    }
  }
  const meanThrust=impulseX/p.duration;
  const meanPower=energy/p.duration;
  return {
    config:p,
    metrics:{
      meanThrust,meanPower,finImpulse:impulseX,
      fluidImpulse:-impulseX,lateralImpulse:impulseY,fluidLateralImpulse:-impulseY,
      energy,positiveImpulse,peakForce,
      impulsePerJoule:energy>1e-12?impulseX/energy:null,
      momentumResidual:impulseX+(-impulseX),
      lateralResidual:impulseY+(-impulseY)
    },
    history,
    provenance:{experiment:"LIQ-E1",version:E1_VERSION,model:"six-node-mounted-fin-linear-anisotropic-local-drag",
      origin:"SIMULATED",authority:"NONE",externalMedium:"idealized anisotropic resistance",calibrated:false}
  };
}
export function compare(input={},options={}){
  const p=parameters(input);
  // Test exactly eight integer cycles to limit waveform endpoint bias.
  const cycles=bound(options.cycles,2,20,8);
  const duration=cycles*60/p.bpm;
  const base={...p,duration,mode:"wave"};
  const baseline=experiment(base);
  const target=baseline.metrics.energy;
  const order=["wave","liquid","pop","standing","sync","reverse"];
  const rows=order.map(mode=>{
    const fixed=experiment({...base,mode,amplitude:p.amplitude});
    let match=null;
    if(target>1e-10&&p.fluidScale>0){
      const maximum=experiment({...base,mode,amplitude:.3});
      if(maximum.metrics.energy>=target){
        let low=0,high=.3,mid=0,trial=maximum;
        for(let j=0;j<19;j++){
          mid=(low+high)/2;
          trial=experiment({...base,mode,amplitude:mid});
          if(trial.metrics.energy<target)low=mid;else high=mid;
        }
        match={achieved:true,amplitude:mid,meanThrust:trial.metrics.meanThrust,
          meanPower:trial.metrics.meanPower,energy:trial.metrics.energy,
          ratio:target>0?trial.metrics.energy/target:null};
      }else{
        match={achieved:false,reason:"Energy target exceeds this mode's bounded amplitude range"};
      }
    }
    return {mode,meanThrust:fixed.metrics.meanThrust,meanPower:fixed.metrics.meanPower,
      energy:fixed.metrics.energy,matched:match};
  });
  return {duration,cycles,baselineEnergy:target,rows,
    disclaimer:"Comparisons are outputs of an uncalibrated RFT surrogate; matched input-energy estimates are not validated hardware measurements."};
}
export function crossCheck(input={}){
  const a=instant(input,0.143),p=parameters(input);
  const powerFromKinematics=-a.nodes.reduce((sum,n)=>sum+n.fy*n.vy,0);
  const nonnegative=a.nodes.every(n=>n.power>=-1e-12);
  const reversed=experiment({...p,mode:"reverse",duration:4*60/p.bpm});
  const forward=experiment({...p,mode:"wave",duration:4*60/p.bpm});
  return {powerResidual:a.power-powerFromKinematics,nonnegative,
    impulseReactionResidual:forward.metrics.momentumResidual,
    forwardMeanThrust:forward.metrics.meanThrust,
    reverseMeanThrust:reversed.metrics.meanThrust,
    signReversal:Math.abs(forward.metrics.meanThrust+reversed.metrics.meanThrust)<1e-8,
    origin:"SIMULATED"};
}
