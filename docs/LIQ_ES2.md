# LIQ-ES2 — Finite-Element Electrostatic Fields and Closed-Surface Momentum Ledger

**Rev:** 0.1.0 · **Date:** 2026-10-30  
**Research status:** SIMULATED ONLY · **Authority:** NONE · **Empirical validation:** NONE  
**Material model:** vacuum permittivity, fixed-potential conductors, static fields  
**Units:** volt / meter, N/m of out-of-plane depth, J/m of out-of-plane depth  
**Project link:** [LIQ-ES2 browser lab](../electrostatics-fem.html)

## Core question

An offset electrode device can experience nonzero electrostatic forces **from its grounded surroundings**. How do we distinguish the force on one component, on the electrode assembly, and on the complete electrode-plus-enclosure system?

LIQ-ES1 previously demonstrated mutual Coulomb forces with point charges. LIQ-ES2 uses finite rectangular conductive regions, actual potential boundary conditions and an independently integrated electrostatic Maxwell stress around multiple closed loops. This is a different, more detailed numerical model. **It is not a geometry-accurate replication of any claimed Exodus T-Blade device.**

The experiment is designed to falsify erroneous *bookkeeping* claims, not to endorse reactionless thrust.

## Exact model

A square planar domain spans x,y ∈ [-0.1,0.1] meters. The exterior square is a **grounded conductor**, part of the physical boundary and not the claimed isolated device. Within it, two rectangular electrodes have half widths 8 mm and half heights 14 mm, approximately centered at x = -40 mm and +40 mm. Electrode B can be shifted vertically by up to ±25 mm. A mirror option reverses both x positions.

A is assigned +V/2 and B -V/2, with 0 ≤ V ≤ 500 V. The entire external wall is maintained at 0 V. Metal interior is assumed equipotential. Nothing models the circuit, voltage-source mass, dielectric nonlinearity, field emission, ionization or physical mount.

The charge-free vacuum domain obeys the static equation

```
∇ · (ε0 ∇φ) = 0
E = -∇φ
ε0 = 8.8541878128e-12 F/m
```

This is **not** an independent or new physical force law.

## Galerkin P1 triangular FEM

The 2D square is a uniform structured grid, but **each square is explicitly split into two linear triangular finite elements**. Each triangle has nodal scalar basis N_i. With area A and derivative coefficients b_i = y_j - y_k and c_i = x_k - x_j, the assembled element stiffness matrix is

```
K_ij = (b_i b_j + c_i c_j) / (4 A)
```

The uniform factor ε0 is omitted while solving Dirichlet potentials because it cancels from the homogeneous equation; it is restored for energy and forces. Triangles are assembled into a symmetric sparse global matrix. Fixed nodes at the electrodes and enclosure impose Dirichlet voltage values. Successive over-relaxation solves free potentials to a declared per-update voltage threshold, using a 5000-sweep cap and explicit convergence status.

Allowed mesh sizes are 33×33, 49×49 and 65×65 nodes (each with 2(n-1)² triangles). This is not adaptive meshing or an industrial-accuracy solver.

## Field sampling and Maxwell stress

From the solved nodal potentials, central differences estimate the electric field at **interior grid nodes**. These reconstructed values differ from raw per-triangle P1 gradients, which are piecewise constant. Their accuracy depends on contour placement and grid resolution.

For a vacuum electrostatic field:

```
T = ε0 (E ⊗ E - 1/2 |E|² I)
T_xx = ε0/2 (Ex² - Ey²)
T_xy = ε0 Ex Ey
T_yy = -T_xx

F_per_depth = ∮ (T · n) ds
```

The 2D closed-contour integral is a **force per unit out-of-plane depth** (N/m). It cannot be treated as the total force on a three-dimensional apparatus without specifying 3D geometry, end effects and depth.

The software evaluates three logically distinct boundaries:
1. Individual rectangular contours in the dielectric around each electrode.
2. A larger closed rectangular contour containing **both electrodes**.
3. A separately integrated outer contour near, but inside, the grounded enclosure.

The reported quantities are independently calculated:

```
F_A, F_B             = Maxwell stress integrals around A and B
F_group              = integral enclosing A and B
F_outer              = integral near grounded enclosure
F_wall_reaction      = -F_outer (inferred from the outer contour)
R_whole              = F_group + F_wall_reaction
R_contour_individual = F_A + F_B - F_group
```

The physically relevant **electrode-plus-enclosure momentum boundary** includes the grounded wall. Numerically, R_whole should tend toward zero with adequate resolution and stable contours in the uniform charge-free region. It is not imposed or rounded to zero in the code.

The contour result can change with discretization even when the potential solver converges. For reliable force extraction one would study contour placement, triangulation, mesh quality, field reconstruction, stress smoothing, virtual work and independent solvers. The present module is an educational/experimental verification rung.

## Numerical tests and falsifiers

| Gate | Expectation |
| --- | --- |
| FEM matrix reciprocity | Symmetric stiffness and zero row sums before Dirichlet constraints |
| Manufactured Laplace solution | φ(x,y)=1000x satisfies zero-volume-charge equation within tolerance |
| Grounding and electrode boundaries | Enclosure 0 V; electrode nodes at imposed ±V/2 |
| Equal and opposite configuration | Centered/symmetric geometry returns near-null whole-group force; separate electrode forces may be nonzero |
| Electrode offset | Nonzero group force can appear, but the separately integrated wall reaction should nearly compensate |
| Geometric mirror | Horizontal force reverses on reflection; vertical force is preserved |
| Voltage scaling | Doubled V produces doubled E and approximately fourfold energy/stress |
| OFF null | V=0 yields zero fields, energy and forces |
| Three-grid mesh study | 33/49/65 independent solves; 49→65 force change remains visible |
| Claim integrity | Every receipt says SIMULATED, authority NONE, no empirical or thrust claims |

A pass in these tests verifies the **implementation under the declared equations**, not an anomalous force.

## What this does NOT test

- A fabricated Exodus device or a published dimensional engineering drawing of it.
- A complete spacecraft, an isolated power supply, the wiring, mounts or the vacuum chamber assembly.
- Real force measurements, thermal drift, pressure dependence, discharges or gas transport.
- Any three-dimensional edge forces, cable mechanical paths, charged exhaust, fluid forces, magnetic transient fields or radiation recoil.
- Arbitrary dielectrics, nonlinear permittivity, floating electrodes or a true isolated (non-Dirichlet) closed system.
- Constant-current/constant-charge controls or charge leakage.

**A chamber-relative force is not necessarily propellantless spacecraft acceleration.** In this model the grounded enclosure supplies an external force exchange by construction.

## Convergence and decision discipline

Run the 33 / 49 / 65 mesh study with unchanged physical dimensions. Record the pair force vector (Fx,Fy), group-vs-outer residual magnitude and electrostatic stored energy. Differences between coarse and fine meshes are **not automatically a converged answer**. The implementation also reports a 10% screening flag; passing that screen would not prove accuracy. The rectangular conductors are represented by fixed Dirichlet grid nodes, yielding **staircase geometry that changes with the mesh**. These mesh-dependent geometry and contour effects can dominate any apparent force difference. A failed screen is recorded as `MESH_SENSITIVITY_UNRESOLVED`, never treated as a new-force observation. Compare against an independent FEM or finite-difference solver in a future rung.

Pre-register any later hardware measurement: closed momentum boundary, raw signed traces, instrument calibration, fixed geometry and environment, forward/reverse orientation, electrode OFF and dummy loads, zero-voltage null, shielding, chamber-distance sweep, pressure and thermal controls, blind analysis, independent reproduction. A high-voltage device is **not** justified by a green GitHub action.

## Research context

- [Exodus patent US11511891B2](https://patents.google.com/patent/US11511891B2/en): proponent invention claims, not independent validation.
- [Ansys: Electrostatic stress and force](https://ansyshelp.ansys.com/public/Views/Secured/corp/v252/en/ans_thry/thy_emg3.html): standard numerical stress evaluation.
- [Wolfram: Electrostatic FEM and Maxwell stress](https://reference.wolfram.com/language/PDEModels/tutorial/Electromagnetics/Electrostatics.html.en): established electrostatic force method.
- [FEMM: weighted Maxwell stress / contour dependence](https://femm.info/doku/doku.php?id=weightedstresstensor): a magnetic-field analogy for numerical contour path sensitivity; the derivation and tensor differ for electrostatics.
- [Tajmar et al., 2024, Scientific Reports](https://doi.org/10.1038/s41598-024-70286-w): independent null-result methodology for **different** exotic electromagnetic propulsion claims; not a test of the exact Exodus geometry.

## Roadmap

- **LIQ-ES2:** completed simulation code: uniform electrostatic P1 FEM and closed-contour stress audit.
- **LIQ-ES2b:** contour placement sweep, energy-force virtual-displacement cross-check, external grounded wall spacing, mesh error normalization, independent solver comparator.
- **LIQ-ES3:** modeled instrument artifacts (cables, supports, thermal and pressure effects), blinded synthetic data analysis; no invented experimental readings.
- **LIQ-ES4:** consider a professionally supervised low-energy measurement proposal only after independent numerical cross-check and physical risk review.

No part of this rung authorizes unsupervised high-voltage hardware assembly.

**Ledger above ego.**
