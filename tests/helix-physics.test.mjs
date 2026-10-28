import test from "node:test";
import assert from "node:assert/strict";
import { configure, initialState, energy, dynamics, step, report,
  simulate, keyholePair, conjugateCharge } from "../src/helix-physics.mjs";

test("configuration bounds and provenance firewall", () => {
  const p = configure({ rungs: 999, rungK: -10, damping: "oops", mode: "gravity" });
  assert.equal(p.rungs, 30);
  assert.equal(p.rungK, 0);
  assert.equal(p.damping, 0.08);
  assert.equal(p.mode, "one-sided");
  const r = simulate({ duration: 0.1 });
  assert.equal(r.provenance.origin, "SIMULATED");
  assert.equal(r.provenance.cptCosmologyModel, false);
  assert.equal(r.provenance.propulsionClaim, false);
});
test("zero coupling, zero drive and static initial velocities stay static", () => {
  const p = configure({ strandK: 0, rungK: 0, nestedK: 0, damping: 0, mode: "off" });
  const a = initialState(p), b = step(a, p, 1/240);
  for (const key of ["a", "b", "ia", "ib"])
    assert.deepEqual(b[key], a[key]);
  assert.equal(report(b, p).energyResidual, 0);
});
test("the analytic coupling torques equal negative potential gradients", () => {
  const p = configure({ mode: "off", damping: 0 });
  const s = initialState(p);
  for (const [key, i] of [["a", 0], ["a", 4], ["b", 3], ["ia", 7], ["ib", 2]]) {
    const eps = 1e-6;
    const plus = { ...s, [key]: s[key].slice() };
    const minus = { ...s, [key]: s[key].slice() };
    plus[key][i] += eps; minus[key][i] -= eps;
    const numeric = -(energy(plus, p).potential - energy(minus, p).potential) / (2*eps);
    const analytic = dynamics(s, p).torques[key][i];
    assert.ok(Math.abs(numeric - analytic) < 1e-7, key + " mismatch");
  }
});
test("passive undamped system approximately conserves energy and phase charge", () => {
  const p = configure({ mode: "off", damping: 0, duration: 6, dt: 1/240 });
  const r = simulate(p);
  assert.ok(Math.abs(r.metrics.energyResidual) < 1e-7, "energy residual " + r.metrics.energyResidual);
  assert.ok(Math.abs(r.metrics.chargeDrift) < 1e-8, "charge drift " + r.metrics.chargeDrift);
});
test("driven and damped system records signed work and nonnegative dissipation", () => {
  const r = simulate({ duration: 6, mode: "one-sided" });
  assert.ok(r.metrics.heat >= 0);
  assert.ok(Math.abs(r.metrics.energyResidual) < 1e-6, "ledger " + r.metrics.energyResidual);
  assert.ok(r.history.length > 10);
});
test("mirror score distinguishes aligned versus anti-aligned rungs", () => {
  const a = report(initialState({ mirrorOffset: 0 }), { mirrorOffset: 0 });
  const b = report(initialState({ mirrorOffset: Math.PI }), { mirrorOffset: Math.PI });
  assert.ok(a.mirrorScore > 0.999);
  assert.ok(b.mirrorScore < 0.001);
});
test("undriven mirror reversal produces opposite trajectories", () => {
  const p = configure({ mode: "off", damping: 0.04, mirrorOffset: 0.3 });
  const a = initialState(p);
  const b = { ...a };
  for (const key of ["a", "b", "ia", "ib", "va", "vb", "via", "vib"])
    b[key] = a[key].map(x => -x);
  b.initialEnergy = energy(b, p).total;
  b.initialCharge = conjugateCharge(b);
  const nextA = step(a, p, 1 / 120), nextB = step(b, p, 1 / 120);
  for (const key of ["a", "b", "ia", "ib", "va", "vb", "via", "vib"])
    for (let i = 0; i < p.rungs; i++)
      assert.ok(Math.abs(nextA[key][i] + nextB[key][i]) < 1e-12, key);
});
test("NBG keyhole has matched coarse measurements but divergent future", () => {
  const r = keyholePair();
  assert.ok(Math.abs(r.initialEnergyDifference) < 1e-12);
  assert.ok(Math.abs(r.initialMirrorScoreDifference) < 1e-12);
  assert.ok(Math.abs(r.futureDifference) > 0.001, "future distinction too small: " + r.futureDifference);
});
