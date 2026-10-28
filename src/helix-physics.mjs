// LIQ-H1: nested mirror-helix toy oscillator network.
// DIMENSIONLESS computational analogy. Not CPT cosmology, gravitation, or a force law.
// Four phases per rung: outer/inner on two complementary strands.
export const DEFAULTS = Object.freeze({
  rungs: 12, strandK: 0.65, rungK: 0.9, nestedK: 0.35,
  damping: 0.08, drive: 0.22, frequency: 0.4,
  mirrorOffset: 0.55, turns: 2.2, mode: "one-sided",
  duration: 12, dt: 1 / 240
});
const KEYS = ["a", "b", "ia", "ib", "va", "vb", "via", "vib"];
const ANGLES = ["a", "b", "ia", "ib"];
const VELOCITIES = ["va", "vb", "via", "vib"];
const INERTIA = Object.freeze({ a: 1, b: 1, ia: 0.35, ib: 0.35 });
const clamped = (v, min, max, fallback) => {
  if (v === null || v === undefined || v === "" || !Number.isFinite(Number(v))) return fallback;
  return Math.min(max, Math.max(min, Number(v)));
};
export function configure(raw = {}) {
  return {
    rungs: Math.round(clamped(raw.rungs, 6, 30, DEFAULTS.rungs)),
    strandK: clamped(raw.strandK, 0, 3, DEFAULTS.strandK),
    rungK: clamped(raw.rungK, 0, 3, DEFAULTS.rungK),
    nestedK: clamped(raw.nestedK, 0, 3, DEFAULTS.nestedK),
    damping: clamped(raw.damping, 0, 1, DEFAULTS.damping),
    drive: clamped(raw.drive, 0, 2, DEFAULTS.drive),
    frequency: clamped(raw.frequency, 0.05, 2, DEFAULTS.frequency),
    mirrorOffset: clamped(raw.mirrorOffset, -Math.PI, Math.PI, DEFAULTS.mirrorOffset),
    turns: clamped(raw.turns, 0.5, 5, DEFAULTS.turns),
    mode: ["off", "one-sided", "balanced"].includes(raw.mode) ? raw.mode : DEFAULTS.mode,
    duration: clamped(raw.duration, 0.05, 30, DEFAULTS.duration),
    dt: clamped(raw.dt, 1 / 3000, 1 / 30, DEFAULTS.dt)
  };
}
export function energy(s, p) {
  let potential = 0, kinetic = 0;
  const n = p.rungs;
  for (const key of ANGLES) {
    const vKey = "v" + key;
    const inertia = INERTIA[key];
    for (let i = 0; i < n; i++) kinetic += 0.5 * inertia * s[vKey][i] ** 2;
  }
  for (const key of ["a", "b"]) {
    for (let i = 0; i < n - 1; i++)
      potential += p.strandK * (1 - Math.cos(s[key][i + 1] - s[key][i]));
  }
  for (let i = 0; i < n; i++) {
    potential += p.rungK * (1 - Math.cos(s.a[i] + s.b[i]));
    potential += p.nestedK * (2 - Math.cos(s.a[i] - s.ia[i]) - Math.cos(s.b[i] - s.ib[i]));
  }
  return { kinetic, potential, total: kinetic + potential };
}
export function initialState(raw = {}) {
  const p = configure(raw), n = p.rungs;
  const s = { t: 0, work: 0, heat: 0, steps: 0, initialEnergy: 0, initialCharge: 0 };
  for (const key of KEYS) s[key] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    s.a[i] = 0.28 * Math.sin(2 * Math.PI * i / n);
    s.b[i] = -s.a[i] + p.mirrorOffset;
    s.ia[i] = s.a[i] + 0.07 * Math.cos(2 * Math.PI * i / n);
    s.ib[i] = s.b[i] - 0.07 * Math.cos(2 * Math.PI * i / n);
  }
  s.initialEnergy = energy(s, p).total;
  s.initialCharge = conjugateCharge(s);
  return s;
}
// Noether-like *generalized phase charge* for the passive system:
// outer+inner phase shift on A and opposite shift on B leaves the potential invariant.
// This is not claimed to be physical angular momentum.
export function conjugateCharge(s) {
  let q = 0;
  for (let i = 0; i < s.a.length; i++)
    q += s.va[i] + 0.35 * s.via[i] - s.vb[i] - 0.35 * s.vib[i];
  return q;
}
export function dynamics(s, p) {
  const n = p.rungs;
  const t = { a: Array(n).fill(0), b: Array(n).fill(0),
    ia: Array(n).fill(0), ib: Array(n).fill(0) };
  for (const key of ["a", "b"]) {
    for (let i = 0; i < n - 1; i++) {
      const f = p.strandK * Math.sin(s[key][i + 1] - s[key][i]);
      t[key][i] += f; t[key][i + 1] -= f;
    }
  }
  let inputPower = 0, lossPower = 0;
  for (let i = 0; i < n; i++) {
    const rung = -p.rungK * Math.sin(s.a[i] + s.b[i]);
    t.a[i] += rung; t.b[i] += rung;
    for (const [outer, inner] of [["a", "ia"], ["b", "ib"]]) {
      const f = -p.nestedK * Math.sin(s[outer][i] - s[inner][i]);
      t[outer][i] += f; t[inner][i] -= f;
    }
    if (p.mode !== "off") {
      const f = p.drive * Math.sin(2 * Math.PI * p.frequency * s.t - 2 * Math.PI * i / n);
      t.a[i] += f;
      inputPower += f * s.va[i];
      if (p.mode === "balanced") {
        t.b[i] -= f; inputPower -= f * s.vb[i];
      }
    }
    for (const key of ANGLES) {
      const v = s["v" + key][i];
      t[key][i] -= p.damping * v;
      lossPower += p.damping * v * v;
    }
  }
  return { torques: t, inputPower, lossPower };
}
function derivative(s, p) {
  const f = dynamics(s, p);
  const k = { t: 1, work: f.inputPower, heat: f.lossPower };
  for (const key of ANGLES) {
    k[key] = s["v" + key].slice();
    k["v" + key] = f.torques[key].map(v => v / INERTIA[key]);
  }
  return k;
}
function offset(s, k, h) {
  const out = { ...s, t: s.t + h, work: s.work + h * k.work, heat: s.heat + h * k.heat };
  for (const key of KEYS) out[key] = s[key].map((v, i) => v + h * k[key][i]);
  return out;
}
export function step(state, raw = {}, h) {
  const p = configure(raw);
  if (state.a.length !== p.rungs) throw new RangeError("State rung count does not match configuration");
  const dt = clamped(h, 1 / 3000, 1 / 30, p.dt);
  const k1 = derivative(state, p);
  const k2 = derivative(offset(state, k1, dt / 2), p);
  const k3 = derivative(offset(state, k2, dt / 2), p);
  const k4 = derivative(offset(state, k3, dt), p);
  const s = { ...state, t: state.t + dt,
    work: state.work + dt * (k1.work + 2 * k2.work + 2 * k3.work + k4.work) / 6,
    heat: state.heat + dt * (k1.heat + 2 * k2.heat + 2 * k3.heat + k4.heat) / 6,
    steps: state.steps + 1 };
  for (const key of KEYS)
    s[key] = state[key].map((v, i) =>
      v + dt * (k1[key][i] + 2 * k2[key][i] + 2 * k3[key][i] + k4[key][i]) / 6);
  return s;
}
export function report(s, raw = {}) {
  const p = configure(raw), e = energy(s, p);
  let mirrorScore = 0, signedMismatch = 0, innerAlignment = 0;
  for (let i = 0; i < p.rungs; i++) {
    mirrorScore += (1 + Math.cos(s.a[i] + s.b[i])) / 2;
    signedMismatch += Math.sin(s.a[i] + s.b[i]);
    innerAlignment += (2 + Math.cos(s.a[i] - s.ia[i]) + Math.cos(s.b[i] - s.ib[i])) / 4;
  }
  return { ...e, mirrorScore: mirrorScore / p.rungs,
    signedMismatch: signedMismatch / p.rungs,
    nestedAlignment: innerAlignment / p.rungs,
    work: s.work, heat: s.heat,
    energyResidual: e.total - s.initialEnergy + s.heat - s.work,
    conjugateCharge: conjugateCharge(s),
    chargeDrift: conjugateCharge(s) - s.initialCharge };
}
export function simulateFrom(start, raw, seconds) {
  const p = configure(raw), duration = clamped(seconds, 0.05, 30, p.duration);
  const count = Math.ceil(duration / p.dt), dt = duration / count;
  const stride = Math.max(1, Math.ceil(count / 240));
  let s = start, history = [{ t: s.t, ...report(s, p) }];
  for (let i = 0; i < count; i++) {
    s = step(s, p, dt);
    if ((i + 1) % stride === 0 || i === count - 1)
      history.push({ t: s.t, ...report(s, p) });
  }
  return { final: s, history, metrics: report(s, p) };
}
export function simulate(raw = {}) {
  const p = configure(raw);
  const result = simulateFrom(initialState(p), p, p.duration);
  return { input: p, ...result, provenance: {
    experiment: "LIQ-H1", origin: "SIMULATED", authority: "NONE",
    calibration: false, physicalUnits: false, gravityModel: false,
    cptCosmologyModel: false, propulsionClaim: false,
    description: "dimensionless nested mirror-phase oscillator analogy"
  } };
}
// NBG Keyhole: equal coarse A strand, energy and mirror score, but the sign
// of B's hidden phase offset changes A's future under an identical hold.
export function keyholePair(seconds = 0.24) {
  const p = configure({ mode: "off", damping: 0, mirrorOffset: 0, rungs: 12,
    strandK: 0.65, rungK: 0.9, nestedK: 0.35 });
  function make(sign) {
    const s = initialState(p);
    for (const key of KEYS) s[key].fill(0);
    s.b[0] = sign * 0.55;
    s.ib[0] = sign * 0.55;
    s.initialEnergy = energy(s, p).total;
    s.initialCharge = conjugateCharge(s);
    return s;
  }
  const plus = make(1), minus = make(-1);
  const futurePlus = simulateFrom(plus, p, seconds).final;
  const futureMinus = simulateFrom(minus, p, seconds).final;
  return { coarse: { observedOuterA: plus.a.slice(), totalEnergy: energy(plus, p).total,
      mirrorScore: report(plus, p).mirrorScore },
    initialEnergyDifference: energy(plus, p).total - energy(minus, p).total,
    initialMirrorScoreDifference: report(plus, p).mirrorScore - report(minus, p).mirrorScore,
    futureAPlus: futurePlus.a[0], futureAMinus: futureMinus.a[0],
    futureDifference: futurePlus.a[0] - futureMinus.a[0],
    hiddenVariable: "sign of B[0] phase",
    origin: "SIMULATED", authority: "NONE" };
}
