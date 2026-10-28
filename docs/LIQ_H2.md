# LIQ-H2 — Matched Positive-Work Relational Coupling Benchmark

**Version:** 0.1.0 · **Date:** 2026-10-27
**Status:** SIMULATED / DIMENSIONLESS · **Authority:** NONE · **Calibration:** NONE
**Parent:** [LIQ-H1 Nested Mirror Helix](LIQ_H1.md)
**Browser:** [Open H2 bench](../helix-compare.html)

## Research question

With the LIQ-H1 nested complementary-phase oscillator equations held fixed, does removing the inter-strand or the nested coupling alter future dynamics under approximately equal modeled *positive mechanical actuator input work*?

This is a math/control-system experiment, not physical DNA, an anti-universe, electromagnetic or gravitational fields, a CPT-cosmology test, a propulsion device or energy recovery.

The NBG term **Altermath** retains its narrower meaning: causally relevant structure concealed by a stated coarse Keyhole. The ordinary interface or a coupling term is not inherently Altermath.

## Four preregistered arms

The baseline and all alternatives have 12 paired rungs, identical phase/velocity initial conditions, identical damping, identical drive frequency, identical number of whole drive cycles and the same solver step. Only the stated intervention and its drive-amplitude calibration change.

| Arm | Intervention |
| --- | --- |
| Full | J, K, G active, one-sided outer A drive; this sets reference work |
| No rungs | K=0, disable inter-strand complement coupling |
| No nesting | G=0, disable outer/inner coupling |
| Opposing | J, K, G unchanged, equal-and-opposite torque waveforms on outer A and B |

J is the nearest-neighbor strand coupling. K is the rung coupling. G is the nested coupling. For complete equations see [LIQ-H1](LIQ_H1.md).

Default reference: J=0.65, K=0.9, G=0.35, drive amplitude D=0.35, frequency=0.4 cycles per arbitrary time unit, damping=0.08, duration=3 complete forcing periods.

## Gross positive actuator work: matching criterion

For EACH actuator port j with modeled torque u_j and modeled phase rate qdot_j:

    W_positive = integral sum_j max(0, u_j * qdot_j) dt
    W_negative = integral sum_j max(0, -u_j * qdot_j) dt
    W_signed = integral sum_j u_j * qdot_j dt

The positive and negative portions are separated per port **before summing**, so opposing ports cannot cancel each other's positive mechanical input in the matching metric. Positive work represents an abstract actuator mechanical-work supply; negative work is NOT automatically recovered electricity.

Positive and negative portions use a trapezoidal integral along the RK4 simulated state trajectory. The separate H1 RK4 integral supplies signed net work. Their small bookkeeping difference is reported as grossAccountingResidual.

The mechanical energy ledger is:

    E(t) - E(0) + loss - W_signed = residual.

Loss is modeled nonnegative viscous heat. This is NOT an external experimental energy/power measurement.

Define target W_reference as the full arm's W_positive. For each alternative, search drive amplitudes D between 0 and the user-configured maximum (default 1.5). Evaluate 13 evenly spaced amplitudes. Refine every observed target crossing with up to 16 bracketed bisections; keep the candidate with the smallest observed relative error.

A comparison can be called MATCHED only if:

    abs(W_positive(D) - W_reference) / W_reference <= 0.01

(default 1% tolerance). If reference positive work is zero or invalid, or if no match is found under the bounded search, return explicit NO_MATCH. Nearest trial work and amplitude may be reported for diagnostics, but the failed arm is excluded from comparisons. Because the system can respond nonmonotonically, this numerical search cannot guarantee it finds all possible narrow solutions. NO_MATCH means the bounded search failed, not mathematical impossibility.

## Measures and interpretation

For each matched arm record:
- drive amplitude and relative work-match error;
- W_positive, W_negative and independent signed drive-work integral;
- final mirror fidelity and change from starting mirror fidelity;
- final nested alignment, initial/final mechanical energy and modeled loss;
- energy residual and per-port gross-work closure check;
- time trace, precise settings and explicit simulated-only provenance.

Different arms can have different initial potential energies because removing a coupling changes the Hamiltonian. Therefore matched positive *external* actuator work does not mean matched total mechanical energy, matched electrical consumption, equal phase trajectories or equal performance.

Any differences are effects **within chosen assumed equations**. No claim of antimatter, gravity, novel propulsion or experimentally observed resonances follows.

## Qualification and controls

1. Input settings are bounded and deterministic.
2. Zero drive makes gross positive and negative actuator drive work zero.
3. W_positive - W_negative approximately equals RK4 net signed work as timestep shrinks.
4. H1 total mechanical energy ledger approximately closes in driven scenarios.
5. Both actuator ports contribute to gross work in opposing-drive mode.
6. An unreachable requested work target returns NO_MATCH and no fabricated alternative metrics.
7. Identical inputs give identical phase scores and work receipts.
8. Every accepted matched alternative satisfies the stated relative matching tolerance.
9. Negative work is recorded independently and never described as recovered electrical energy.
10. The existing LIQ-E0/E1/E1c/H1 simulations and tests remain unchanged.

To run tests: use npm run validate (Node 22 or later, no dependencies), or npm run test:helix-h2.

## Next numerical and experimental rungs

H3 could preregister sensitivity against timestep refinement, phase seeds, longer horizons, matching tolerance and alternative work metrics. Results should report uncertainty/robustness and failed comparisons, not only favorable matches.

A physical device would require calibrated actuators, hardware protection, independent force/electrical instrumentation and uncertainty budgets. A cosmological claim would require a distinct relativistic field theory and observational predictions, not a helix drawing or coupled-oscillator simulation.

**Claim firewall:** SIMULATED, AUTHORITY NONE, DIMENSIONLESS. No gravity solver, no electromagnetic field model, no external-momentum exchange, no demonstrated thrust or free energy.

**Ledger above ego.**
