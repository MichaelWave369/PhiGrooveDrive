# ΦGrooveDrive · Liquid Interface Lab

**The space between motion.**

[![LIQ-E0 numerical qualification](https://github.com/MichaelWave369/PhiGrooveDrive/actions/workflows/ci.yml/badge.svg)](https://github.com/MichaelWave369/PhiGrooveDrive/actions/workflows/ci.yml)

**Status: E0 computational simulation, not an observed propulsion system.** This experimental research app translates Liquid dancer handflow intuition into a measurable control vocabulary. Two "bubble" modules carry masses, finger-like "gear" articulation illustrates control surfaces, and their gap is commanded through a variable-equilibrium spring. No hands, magnetic fields, or physical thrust are being measured.

**[Launch browser lab (after Pages is enabled and deployed)](https://michaelwave369.github.io/PhiGrooveDrive/)**

## LIQ-H2 · Matched Positive-Work Relational Benchmark (SIMULATED)

[Launch the H2 benchmark after merge and Pages deployment](https://michaelwave369.github.io/PhiGrooveDrive/helix-compare.html) · [Formal protocol](docs/LIQ_H2.md)

Compare the full nested mirror helix with inter-strand **rung ablation**, **inner/outer nesting ablation**, and **opposing choreography**. Each accepted alternative matches the same **integrated positive actuator mechanical work** (per-port, dimensionless) to within a declared tolerance. Bounded drive search can return honest NO MATCH. Inspect mirror fidelity, nested alignment, signed/negative work, modeled heat and the energy residual; export a full JSON simulation receipt. This does NOT demonstrate gravity, electromagnetic forces, cosmological anti-universes, electrical recovery or propulsion. Existing laboratories remain untouched.

## LIQ-H1 · Nested Mirror Helix (SIMULATED / DIMENSIONLESS)

[Open the new Mirror Helix lab after merge and Pages deployment](https://michaelwave369.github.io/PhiGrooveDrive/helix.html) · [LIQ-H1 formal protocol](docs/LIQ_H1.md)

A self-contained, coupled-strand phase simulator with **12 paired rungs and two nested levels per node**. Explore neighbor/rung/inner couplings, one-sided vs balanced drives, mirror fidelity, energy and conserved phase-charge checks. An NBG Keyhole illustrates how opposite hidden B-phase signs produce different observed A-phase futures under identical dynamics. Export JSON receipts. This is a computational analogy **not** a gravity, magnetism, biological DNA, universe/anti-universe or propulsion model. Existing E0/E1/E1c labs remain unchanged.

## LIQ-E1c · Magnetic gap / reversible-bus laboratory (SIMULATED)

[Open the Magnetic Loop lab after merge and Pages deployment](https://michaelwave369.github.io/PhiGrooveDrive/e1c.html) · [Formal model and qualification](docs/LIQ_E1C.md)

An independent two-body electromechanical testbench adds a **conservative repulsive potential**, an ideal linear voice-coil model with coupled back-EMF, and separate **gross bus input, ideal bus-return, copper heat, mechanical damping and stored energy** accounting. Choose Liquid, Wave, Pop, Return, Reverse, or Off voltage choreography and inspect time traces, zero-impulse center-of-mass balance, numeric energy closure, and JSON receipts. The return path is an **ideal bidirectional voltage-source assumption**, not a built or verified battery/regenerative circuit. No externally coupled thrust occurs in this isolated E1c model. The original E0 and fluid-based E1 labs stay available.

## LIQ-E1 · Six-segment fluid-resistance testbed (SIMULATED)

[Launch E1 research lab after merge/deploy](https://michaelwave369.github.io/PhiGrooveDrive/e1.html) · [LIQ-E1 model, controls and falsifiers](docs/LIQ_E1.md)

The E1 page extends LIQ-E0 with a **six-node traveling-wave fin held on a fixed mount**, modeled with idealized local anisotropic linear drag. The external fluid receives the opposite of the force on the fin, avoiding reactionless-propulsion claims. Compare LIQUID, WAVE, POP, STANDING, SYNC and REVERSE modes; adjust BPM, amplitude, wave count and resistance; view live phase/force visualization and derived thrust and power; run null tests; export JSON; and inspect equal-amplitude versus **equal modeled mechanical-energy** benchmarks. All results are **SIMULATED**, uncalibrated, and not CFD, water-tank measurements, real electromagnetics or electric regeneration. Existing E0 is preserved.

## What is implemented

- **LIQ-E0 simulator:** 1D equal/opposite spring coupling, actively controlled rest gap, momentum-preserving relative damping, deterministic velocity-Verlet integration at 240 Hz.
- **Liquid / Wave / Pop / Lock:** four rest-gap control programs. The names are movement metaphors, not physically captured dance movements.
- **Live readouts:** actual gap, target gap, momentum error, center-of-mass drift, drive work, stored energy, heat dissipation, ledger residual.
- **NBG Keyhole:** equal coarse initial observables with different signed preload, then different future gaps under the same intervention.
- **Export:** JSON deterministic trace + configuration + provenance SIMULATED / authority NONE.
- **Audit:** reruns four modes and checks momentum, center of mass, and energy closure in-browser. GitHub CI runs eight Node automated tests.

Read the [LIQ-E0 experimental protocol](docs/LIQ_E0.md) and the [NBG LIQUID-BGA-01 proposal](https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/LIQUID_INTERFACE_BUBBLE_GEAR_ALTERMATH_V0_1.md).

## Launch and deploy

**Browser:** after deployment succeeds, open https://michaelwave369.github.io/PhiGrooveDrive/ . No login, backend, or local installation is required.

To enable Pages after merging the PR:
1. Repository **Settings → Pages → Build and deployment → GitHub Actions**.
2. Run **Actions → Publish ΦGrooveDrive Lab → Run workflow** if the first automatic run happened before Pages was enabled.
3. Confirm the deploy run is successful before sharing the site as live.

Optional local preview: run python -m http.server 8000 from the repository folder, then visit http://localhost:8000/ .

To run tests with Node.js 22 or newer: run npm run validate. No dependencies or bundling are required.

## Scientific limits

This is a **two-mass internal actuation demo**, not a propulsion model. Equal/opposite forces cannot accelerate the isolated system's center of mass. Varying the spring equilibrium requires external work. The field arcs are illustrative, not an electromagnetic field calculation. No regenerative electrical bus or hydrodynamics is modeled.

Altermath retains its formal NBG meaning: causally relevant structure hidden by a coarse Keyhole. The physical gap is not automatically Altermath; the controlled hidden-preload example is an ordinary observability result, not new physics.

Passing numerical tests supports only the behavior of the implementation under its assumed equations, not real-world accuracy, propulsion efficiency, or a new force.

## Research ladder

| Stage | Status | Scope |
| --- | --- | --- |
| LIQ-E0 | Implemented in software | Coupled masses, conservation, Keyhole, gap control |
| LIQ-E1 | Proposed | Fluid-coupled six-segment fin, controller comparisons |
| LIQ-E2 | Proposed | Calibrated low-energy electromagnetic/regenerative bench |
| PhiBox bridge | Future | Optional bounded BPM/event source |
| PhiOS integration | Future | Governed hardware commands with physical interlocks |

## Attribution and license

Inspired by Michael “Mikey” Hughes's long-practiced Liquid/handflow vocabulary. Open-source MIT software.

**Ledger above ego.**
