# ΦGrooveDrive · Liquid Interface Lab

**The space between motion.**

[![LIQ-E0 numerical qualification](https://github.com/MichaelWave369/PhiGrooveDrive/actions/workflows/ci.yml/badge.svg)](https://github.com/MichaelWave369/PhiGrooveDrive/actions/workflows/ci.yml)

**Status: E0 computational simulation, not an observed propulsion system.** This experimental research app translates Liquid dancer handflow intuition into a measurable control vocabulary. Two "bubble" modules carry masses, finger-like "gear" articulation illustrates control surfaces, and their gap is commanded through a variable-equilibrium spring. No hands, magnetic fields, or physical thrust are being measured.

**[Launch browser lab (after Pages is enabled and deployed)](https://michaelwave369.github.io/PhiGrooveDrive/)**

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
