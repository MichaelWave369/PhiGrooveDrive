# LIQ-E1 v0.1 — Six-segment Liquid fin with external fluid resistance

**Status:** SIMULATED / uncalibrated / no physical device
**Authority:** NONE
**Foundation:** [NBG LIQUID-BGA-01](https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/LIQUID_INTERFACE_BUBBLE_GEAR_ALTERMATH_V0_1.md)

## Research question

Can choreographed spatial traveling waves produce a streamwise force on a fin when it exchanges momentum with an **external medium**? What survives equal-amplitude and equal-energy controller comparisons? This version answers those questions **only inside a simplified, explicitly uncalibrated model**.

## Model

Six equally spaced nodes at fixed longitudinal coordinates x_i = iL/5, i=0…5, L=1 m, undergo prescribed transverse y(x,t) motion. They are attached to a fixed mount; the fin does **not** free-swim. The baseline wave is

    y(x,t) = A sin(ωt + kx + φ),
    ω = 2π BPM/60, k = 2π waves/L.

A positive spatial phase makes the wave propagate in the negative x direction, giving positive streamwise force for the anisotropic drag assumption below. Reverse the sign of k to reverse it.

With slope m=∂y/∂x and transverse speed v=∂y/∂t, the local tangent and normal are

    t = (1,m)/sqrt(1+m²),
    n = (-m,1)/sqrt(1+m²).

An idealized local **linear resistive-force** law supplies drag on each segment:

    f = -c_parallel (V·t)t - c_perp (V·n)n
    V=(0,v)
    F_node=fluidScale * f * segment_length_weight

Equivalently:

    F_x = fluidScale * Δx * (c_perp-c_parallel) v m/(1+m²)
    F_y = -fluidScale * Δx * v (c_parallel m²+c_perp)/(1+m²)

Interior segments have full Δx quadrature weight, endpoints half. c_parallel and c_perp are nonnegative effective drag coefficients with dimensions N·s/m², *not measured water parameters*; fluidScale is dimensionless.

When c_perp > c_parallel, spatial waves can create longitudinal force. This is a **resistive surrogate**, not CFD, hydrodynamic validation, magnetic field simulation, or a predictive water-tank force model. Fluid inertia, vortices, 3D wakes, body dynamics, motor mechanics and fin compliance are omitted.

### Momentum and work

The surrounding fluid receives an equal and opposite impulse. The fixed mount provides the balancing structural reaction:

    J_fin = integral(F_x dt)
    J_fluid = -J_fin
    impulse_residual = J_fin + J_fluid = 0.

The work needed to impose transverse motion against dissipative drag is represented by

    P_node = -F_y * v >= 0
    E_modeled = integral(sum(P_node) dt).

This is an ideal mechanical drag work term only. There is no electricity bus, thermal actuator loss, coil current or recovered electricity. It must not be called proven regeneration or experimental efficiency. The controller creates no extra reaction mass. An isolated apparatus without an external medium cannot turn internal forces into center-of-mass acceleration.

## Six choreography modes

- **WAVE:** simple traveling sinusoid.
- **LIQUID:** 0.72 fundamental + 0.28 second harmonic with phase offset.
- **POP:** smooth sharp traveling pulse sin(phase)^5.
- **STANDING:** sin(πx/L) sin(ωt), zero cycle-mean streamwise force by symmetry.
- **SYNC:** all nodes move together with no longitudinal slope, zero streamwise force.
- **REVERSE:** traveling sinusoid with opposite spatial wave direction, reversing streamwise load.

“Bubbles” and “gear-fingers” remain metaphors rendered on the stage. Actual electromagnetic forces, spring-loaded neighbor interactions, and proprioceptive human motion capture are **not implemented in this stage**. Altermath retains the NBG Keyhole definition of causally relevant structure hidden by coarse cancellation.

## Fair comparisons

Report both:

1. **Same amplitude:** identical peak commanded amplitude, wave count, tempo, and fluid coefficients, but different modeled energies.
2. **Same modeled drag work:** define baseline as WAVE over **eight whole periods**. Binary-search each alternative's amplitude in 0–0.30 m to target the same integrated resistive work. If target energy is unattainable or zero, return **NO MATCH** or N/A, not an invented value.

The energy-matching procedure is internal to this uncalibrated model, not a matched electrical-input, propulsive efficiency or physical hardware comparison. Any ranking might change under more realistic hydrodynamics.

## Numerical qualification gates

1. Six nodes occupy prescribed fixed x locations and form spatially phased waves.
2. Fluid and fin forces/impulses cancel exactly as reciprocal interactions.
3. With no medium, force and hydrodynamic power vanish.
4. With zero amplitude, force and power vanish.
5. With isotropic resistance c_perp=c_parallel, forward force vanishes even when drag dissipates energy.
6. Uniform sync movement has zero forward force; standing-wave means cancel over full periods.
7. Reversing the traveling wave reverses streamwise force, with unchanged work under symmetric assumptions.
8. Drag dissipation remains nonnegative for nonnegative drag coefficients.
9. 240 Hz and 480 Hz quadrature predictions agree within specified small tolerances.
10. Equal-energy comparison must converge within 1%, else declare no match.
11. Invalid input is bounded; simulation exports preserve SIMULATED / NONE / calibration false.

Run: npm run validate, or npm run test:e1 for this experiment alone.

Passing tests supports numerical fidelity to assumptions, **not real-world validation**.

## Interface / exports

The browser lab is served from e1.html at the repository root. Controls change BPM, amplitude, spatial wave count, tangential/normal drag and fluid scale. The six-node stage shows geometric phase and force arrows; additional arcs are **artistic**, not electromagnetic field solutions. The telemetry chart uses independent normalized axes for force and power, whereas numeric metrics and exported JSON use stated SI units. Every export has configuration, traces, model provenance, matched-energy comparison, and explicit simulated-only wording.

## Research ladder

- **E1a (this PR):** six-node traveling waves + local anisotropic drag + conservation/zero controls + matched mechanical drag effort.
- **E1b (future):** independently solved fluid model, verified boundary-condition regimes, perturbation/noise tests and qualitative comparisons against published experimental data.
- **E1c (future):** calibrated electromechanical actuator circuit: coil current, inductance, force and bus energy, with controlled negative tests and electrical regeneration measurement.
- **E2 (future):** low-energy physical rig, force-cell calibration, independent electrical/thermal instruments, mechanical guards, current limit and hard stop.
- **Liquid motion capture (future):** optional consent-based tracking of actual finger/hand choreography to create recorded control trajectories and compare against tuned baselines.

## Scientific reference points (not proof of this proposal)

- [Body–fluid interaction in undulatory swimming](https://pmc.ncbi.nlm.nih.gov/articles/PMC3027469/), fitted resistive/reactive force and power distribution.
- [Resistive force theory and wave dynamics](https://pmc.ncbi.nlm.nih.gov/articles/PMC8323821/), segment-wise tangent/normal resistance.
- [Robotic ribbon-fin hydrodynamics](https://pubmed.ncbi.nlm.nih.gov/18931321/), CFD + experimental flow work revealing important limits of simplified local drag.
- [Fin stiffness and robotic ribbon-fin propulsion](https://pubmed.ncbi.nlm.nih.gov/29182095/), actual fin thrust and power data that this testbed has not reproduced.

**Claim firewall:** This experiment is not new physics, reactionless propulsion, an observed magnetic effect, or measured energy recovery. The numerical result is not evidence that Liquid control outperforms a real fin.
