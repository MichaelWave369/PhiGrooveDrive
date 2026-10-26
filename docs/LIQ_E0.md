# LIQ-E0 Protocol — Two-module conservation and relational gap control

**Revision:** 0.1.0  
**Authority:** NONE  
**Origin:** SIMULATED  
**Date:** 2026-10-26  
**Formal motivation:** [NBG LIQUID-BGA-01](https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/LIQUID_INTERFACE_BUBBLE_GEAR_ALTERMATH_V0_1.md)

## Scope

A deterministic one-dimensional model: two finite masses coupled by a rest-gap-controlled Hookean spring. The control parameter is **rest gap**, not a measured magnetic field. Internal equal/opposite forces alter relative motion but cannot accelerate the center of mass.

For positions x1,x2 (m), common illustrative radius r, and commanded rest gap d0:

    d = x2 - x1 - 2r
    F1 = k (d - d0)
    F2 = -F1

The rest-gap command is actively varied, requiring external drive work. No physical magnetic force law is assumed.

## Energy ledger

    K = (m1 v1² + m2 v2²) / 2
    U = k (d - d0)² / 2
    Δ(K+U) + Q_dissipated - W_actuator = ε_numeric

A rest-gap update changes U at fixed mass positions, counted as actuator work. Mechanics advance with velocity Verlet. An exponential relative-velocity damping update conserves center-of-mass velocity, and its exact reduction of kinetic energy is counted as dissipated heat. Residual ε_numeric should shrink with numerical time step.

No electrical regeneration is simulated. Negative signed actuator work in this mechanical abstraction is not proven bus-side recoverable electricity.

## Control patterns

- LOCK: constant rest gap, not a mechanically engaged physical brake.
- WAVE: time-periodic sinusoidal target, not yet a true spatial traveling wave.
- POP: smooth sharp unilateral pulses.
- LIQUID: first and second harmonic combination with a phase offset.

## Qualification gates

1. Momentum error less than 1e-9 kg m/s in four test patterns.
2. COM law error less than 1e-9 m, including an initial nonzero-momentum test.
3. Absolute energy ledger residual less than 0.005 J in the eight-second 240-Hz trial.
4. Passive spring approximately conserves total energy within 0.001 J without damping or drive.
5. Damping dissipates energy and does not increase unforced total mechanical energy beyond solver tolerance.
6. Coarse-equivalent Keyhole states diverge by more than 0.01 m after 150 ms under the same intervention.
7. Selected 240 vs 480 Hz results agree within 0.003 m.
8. Unreasonable input values are clamped to numerical bounds.

### Keyhole controls

Initial pair: x1=-0.62 m, x2=+0.62 m, r=.22 m, observed gap=.8 m, m1=m2=1 kg, initial velocities zero. A has rest gap=.65 m, B has rest gap=.95 m. Both have initial stored energy 0.1575 J and zero aggregate internal force, but equal-magnitude opposing signed preload. A coarse Keyhole retaining COM, gap, stored energy, kinetic energy, and aggregate force cannot distinguish them. A signed internal-force or rest-gap observation immediately distinguishes them; the ordinary hold dynamics produces divergent subsequent gaps.

The result concerns causal observability under a defined projection, not a novel force.

## Limitations and promotion

The visual bubbles, finger gears and curved lines are stylized. The simulation omits gravity, collisions, magnetic coils, fluid forces, true fin thrust, circuit losses, actual regeneration, and human body-motion capture. It is **not evidence of isolated reactionless propulsion**.

After this E0 qualification, LIQ-E1 should introduce explicit external momentum exchange (water, air or contact), with matched control baselines and net-energy measurements. LIQ-E2 requires guarded hardware, calibrated force and electrical measurements, thermal limits, uncertainty reports, and an independent emergency stop.

Export provenance remains SIMULATED and authority NONE regardless of how green CI becomes.
