# LIQ-H1: Nested Mirror Helix / relational coupling experiment

**Version:** 0.1.0
**Date:** 2026-10-27
**Origin:** SIMULATED
**Authority:** NONE
**Calibration:** NONE
**Units:** dimensionless
**Status:** research toy model, not empirical physics
**Browser:** [Open LIQ-H1](../helix.html)

## 1. The originating idea and precise boundaries

An imaginative analogy proposes a double helix with one strand labeled universe and another anti-universe, each containing nested bubble/gear structures, and relational rungs described metaphorically as gravity, magnetism or Altermath.

**This model DOES NOT derive, model, or verify an actual universe or anti-universe, spacetime foam, CPT cosmology, biological DNA/RNA, gravitation, magnetism, antimatter, or propulsion.** In the 2018 Boyle–Finn–Turok CPT cosmology, the anti-universe is a *pre-Big-Bang epoch*, not a spatially adjacent DNA-shaped strand. DNA is bound by ordinary chemistry, with complementary base pairs and molecular stacking. This lab borrows only the mathematics of complementary relationships.

The operational question is narrower: how do two coupled phase networks behave when each node has an inner and outer state, with the two networks preferring opposite phases? Can identical coarse observations hide causally relevant distinctions?

The existing NBG meaning of **Altermath** is preserved: hidden causal differences under a defined Keyhole, not a new force in the physical gap.

## 2. State and Hamiltonian-like model

There are N paired rungs (default N=12). Each has four dynamic angles in radians:

- outer strand A: a_i, inner strand A: alpha_i
- outer strand B: b_i, inner strand B: beta_i

and their corresponding angular velocities. Outer inertia is I_o=1; inner inertia I_i=0.35. These are **dimensionless phase coordinates**, not measured angular momentum of actual objects.

The *assumed* potential is

    V = J Σ_(s=A,B) Σ_(i=0..N−2) [1−cos(q_s,i+1−q_s,i)]
      + K Σ_i [1−cos(a_i+b_i)]
      + G Σ_i ([1−cos(a_i−alpha_i)] + [1−cos(b_i−beta_i)])

J: adjacent **same-strand** coupling; K: complementary **rung** coupling; G: **nested** inner/outer coupling. The chain has open boundaries, not a ring. In particular, the PLUS sign in a_i+b_i means the lowest-energy rung occurs when b_i=-a_i modulo 2π. This is a deliberate coupling rule, not CPT symmetry derived from field equations.

The equations of motion for each phase q_x are

    I_x qddot_x = −(∂V/∂q_x) − c qdot_x + u_x(t).

u_x(t) is a prescribed external torque. For the default travel wave:

    f_i(t)=D sin(2π f t − 2π i/N).

Mode OFF: all u=0. Mode ONE-SIDED: u_outerA,i=f_i, others 0. Mode BALANCED: u_outerA,i=f_i and u_outerB,i=−f_i. BALANCED describes opposing drive torques, **not** guaranteed equal electrical or mechanical work.

There is no rigid-body translation, external fluid, Maxwell solver, Einstein equation, electromagnetic circuit, physical thrust or power generation.

## 3. Metrics and numerical ledger

Define **mirror fidelity** to target the correct complement, not merely a synchronous offset:

    M=(1/N) Σ_i [1+cos(a_i+b_i)]/2.

M lies from 0 to 1. M=1 when the phases are complementary. A constant incorrect phase offset does NOT count as complete mirror agreement. Inner/outer alignment is the average of [1+cos(a−alpha)]/2 and [1+cos(b−beta)]/2.

    T= Σ_x 0.5 I_x qdot_x²
    E=T+V
    W_drive=∫Σ_x u_x qdot_x dt
    H_loss=∫Σ_x c qdot_x² dt  ≥0
    R_E=E(t)-E(0)+H_loss-W_drive.

The browser and tests use RK4 integration for state variables AND these work/loss integrals. Small residual R_E is a software check, not experimental confirmation. Negative signed drive work is not evidence of an actual regenerative electrical circuit.

The potential remains invariant under uniform A phase shift +delta and B shift -delta (outer and inner shift together on each side). Consequently, the **undriven and undamped** toy model conserves the generalized phase charge

    Q=Σ_i(va_i + 0.35 valpha_i − vb_i − 0.35 vbeta_i).

Q is a Noether-like invariant of our chosen coordinates. It is NOT physical angular momentum, a new natural law or an antimatter property. Numerical tests check both energy and Q in the passive limit.

## 4. Keyhole protocol: the Altermath-like hidden sign

Construct two *stationary* full states, P and N:
- all outer/inner A phases 0
- all outer/inner B phases 0 except rung 0 has phase +0.55 in P or -0.55 in N (for both outer and inner B)
- all velocities 0 and no drive or damping.

The **coarse Keyhole** H reveals the entire outer A sequence, the scalar total energy and the scalar mirror-fidelity score. These values are exactly equal for P and N because the potential and fidelity use cosine.

The full states differ in the omitted sign of B[0]. Release them under **identical dynamics** for 0.24 arbitrary time units. The observed outer A phase at rung 0 diverges. This satisfies the operational criterion of hidden causal distinction under a deliberately coarse observer. A sensor that observes the signed hidden B phase removes the ambiguity. **No new field is implied.**

## 5. Qualification / preregistered negative controls

1. **Zero interaction null:** J=K=G=c=D=0, initially zero velocities; all phase angles remain constant.
2. **Gradient consistency:** compare analytic coupling torques against finite-difference negative gradients of V.
3. **Passive energy:** set drive OFF and c=0, check small R_E over six simulated time units.
4. **Passive phase charge:** under the same conditions, Q(t)-Q(0) remains small.
5. **Driven energy:** with a one-sided traveling drive and c>0, R_E remains small and H_loss>=0.
6. **Complement specificity:** a_i+b_i=0 yields M=1 and a_i+b_i=π yields M=0.
7. **Reflection test:** when drive OFF, negating every phase and velocity negates the next state.
8. **Keyhole test:** equal coarse initial observables, different future outer A phase under the same intervention.
9. **Parameter bounds:** reject unrecognized modes and clamp scalar parameters.

These are automated by the Node test suite; the browser audit runs a shorter energy-ledger check only.

Suggested ablations: K=0 vs K>0, G=0 vs G>0, and ONE-SIDED vs BALANCED **with matched integrated work**. The browser has controls for exploration but does not yet automatically enforce matched-work comparisons. No performance advantage should be claimed before that protocol is implemented.

## 6. What would constitute progress?

**Current achievement:** a mathematically explicit, nontrivial nested coupled oscillator toy model with falsifiable computational controls, deterministic receipts and an independently specified Keyhole.

**Not achieved:** empirical validation, gravity or magnetism prediction, cosmology observation, physical energy harvesting, anomaly detection or reactionless propulsion.

For a physical motor/gear/coil bench, a new experiment must supply actual geometry, SI units, calibrated interaction forces and torques, accurate sensor and electrical input/output measurements, matched baselines, error bars, hardware limits, and external momentum exchange before any thrust statement. Any cosmology claim requires a *separate* field-theoretic derivation and observational predictions; do not infer it from this diagram.

## 7. Literature and links

- Boyle, Finn & Turok, *CPT-Symmetric Universe*, PRL 121, 251301 (2018): https://doi.org/10.1103/PhysRevLett.121.251301
- Boyle, Finn & Turok, *The Big Bang, CPT, and neutrino dark matter* (2022): https://doi.org/10.1016/j.aop.2022.168767
- NIH, *Double Helix*: https://research.nih.gov/genetics-glossary/Double-Helix
- NCBI Bookshelf, *Structure and Function of DNA*: https://www.ncbi.nlm.nih.gov/books/NBK26821/
- S. Carlip, *Spacetime foam: a review* (2023): https://pubmed.ncbi.nlm.nih.gov/37080192/
- Acebrón et al., *The Kuramoto model*, Rev. Mod. Phys. 77, 137 (2005): https://doi.org/10.1103/RevModPhys.77.137
- NBG LIQUID-BGA-01 conceptual formalism: https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/LIQUID_INTERFACE_BUBBLE_GEAR_ALTERMATH_V0_1.md

Ledger above ego. All exports carry origin SIMULATED and authority NONE.
