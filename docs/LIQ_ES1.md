# LIQ-ES1 — Electrostatic Geometry, External Coupling and Momentum Audit

**Revision:** 0.1.0 · **Date:** 2026-10-30  
**Status:** SOFTWARE RESEARCH / NO HARDWARE · **Evidence authority:** NONE  
**Origin:** SIMULATED · **Calibration:** NONE · **Propellantless-thrust claim:** NONE

## Why this track exists

Charles Buhler and Andrew Aurigema's Exodus Propulsion Technologies describe asymmetric electrodes that reportedly yield net force, including under vacuum. Their patent [US11511891B2](https://patents.google.com/patent/US11511891B2/en), granted in 2022, proposes forces from asymmetric electrostatic pressure. The patent is a record of a claimed invention, **not experimental validation**. Exodus' own [technical overview](https://ept.space/about/) describes T-Blade apparatus, vacuum measurements and force instrumentation. [APEC's August 2026 program](https://www.altsci.net/apec-8-29-2026/) describes continuing model and test updates. Those are primary **proponent reports**, not independent proof.

As of the 2026-10-30 research check, a publicly accessible independent, peer-reviewed reproduction of the claimed reactionless effect was not verified. A high-impact control reference is [Tajmar, Kößling & Neunzig, Scientific Reports 14, 19427 (2024)](https://doi.org/10.1038/s41598-024-70286-w), which tests other claims of electromagnetic/gravity coupling with sensitive apparatus, **not the precise Exodus design**.

Our question is: **when does an electric-force signal become net momentum transfer across a properly specified system boundary?**

## Three distinct propositions

1. Charged surfaces exert forces. Established.
2. Changing charge distribution, electrode geometry and external surroundings can change measured forces. Established.
3. A **self-contained** electrostatic assembly can continually accelerate its centre of mass with no external momentum exchange. Unverified and in conflict with ordinary momentum conservation.

Electricity is an energy supply, not automatically a momentum sink. “Countering 1 g” on a scale does not, by itself, demonstrate gravity manipulation or propellantless spacecraft motion. `F > mg` may instead involve the apparatus and environment.

## LIQ-ES1 browser model: exactly what it computes

This first rung intentionally uses a **1D, static, fixed point-charge** system, not Exodus electrode details and not a finite-element solver. Three labelled charges A/B/C at distinct positions `x[i]` have assigned charges `q[i]`. Geometric asymmetry varies C's position. For each distinct pair i,j:

```
F_on_i_from_j = k * q[i] * q[j] * sign(x[i] - x[j]) / |x[i] - x[j]|^2
F_on_j_from_i = -F_on_i_from_j
k = 8.9875517923e9 N m^2 C^-2
```

All pair forces are summed per element. The `ISOLATED` mode includes **only these internal forces**, so their sum is zero even when individual electrode forces are large and geometry is asymmetric.

In `EXTERNAL WALL` mode, a separate, stationary point charge represents an idealized **outside charged fixture / chamber coupling**. It exerts a force on the internal charges and receives the exact opposite reaction. The assembly alone may now have nonzero net force, but the **expanded system containing the wall** retains zero net force. The wall is an illustrative explicit environment, not a physically solved vacuum chamber. This distinction is the central lesson of the rung.

Charge signs, point locations and source magnitudes are defined assumptions. The model does **not** solve for fixed-potential conductors, dielectrics, surface charge migration, Maxwell stress on finite surfaces, mechanical mounts, power cables, air, charge emission or variable electric fields. It is not an electrostatic simulation of a specific patented device.

### Output accounting

- `internalNet`: sum of all mutual electrode forces.
- `deviceExternal`: sum of forces from the separate charged object.
- `deviceTotal = internalNet + deviceExternal`: total force on the three-charge subsystem.
- `reactionOnWall = -deviceExternal`: equal and opposite external reaction.
- `combinedResidual = deviceTotal + reactionOnWall`: must be approximately zero.

Positive or negative `deviceTotal` in wall mode **is not reactionless thrust**. All displayed forces are computed, not measured. A geometry sweep and downloaded JSON receipt preserve settings, assumptions, full pair-force accounting and the source-provenance boundary.

## Experimental logic for a later independently measured bench

**Pre-register** sample sizes, allowed exclusions, environmental conditions, reference direction, calibration and primary test statistic before examining unknown results. Distinguish repeatability inside one team from external replication by independently built apparatus.

| Control | Why it matters | Expected diagnostic |
| --- | --- | --- |
| Device OFF / zero-field / dummy load | Baseline drift and readout contamination | No synchronous electromechanical response |
| Symmetric and asymmetric electrode geometry | Test geometrical dependence | Predicted force parity within a declared ordinary EM model |
| Device reversal and 180° rotation | Separate lab-frame from body-frame effects | A genuine body-frame signal should reverse appropriately |
| Charge-polarity reversal | Probe sign/parity and systematic offsets | Prediction must be declared for each model; no universal sign rule |
| External conductive shield and fixture-distance sweep | Look for electrostatic attraction to the room | Coupling should change with external geometry when present |
| Wiring/ground/isolated-supply changes | Expose cable and return-path impulses | Identify energy and momentum paths; control for wiring motion |
| Residual-pressure sweep with recorded pressure | Distinguish gas, ion wind and outgassing | Quantify pressure dependence with error bars |
| Thermal and vibration logging | Reject heating, buoyancy and mechanical drift | Time-correlated artifact signatures |
| Instrument swap / blind sign coding | Catch readout and operator bias | Repeat across independent instruments and operators |
| Sealed complete system vs component-only balance | Define the momentum boundary | Isolated assembly must survive a whole-system test |

**Do not claim a null test passed if it was only modelled.** For a physical measurement, report unprocessed time series, load-cell/torsion-balance calibration, source supply location, pressure, current, temperature, chamber diagram, grounding, uncertainty budget, pressure-to-force curve and signed reversal results.

A claimed sustained force `F` on a free object of total mass `m` implies acceleration `a=F/m`; proving this requires trajectory measurement or an equivalent calibrated dynamical measurement with all external impulses considered. A static scale reading alone is insufficient.

### Suggested falsification order

- **ES1 (this PR):** show algebraic cancellation of pairwise Coulomb forces under asymmetry; switch external charged environment ON/OFF.
- **ES2:** finite-element electrostatic field maps with conductive boundaries and closed-surface Maxwell-stress accounting; convergence and mesh-refinement tests. Include explicit chamber walls and cables.
- **ES3:** synthetic force-instrument contamination model with preregistered blind analysis and sensitivity / false-positive maps.
- **ES4:** only after electrical and mechanical design review, build a professionally supervised, suitably rated, low-energy guarded measurement setup. Do not improvise high-voltage apparatus from this software.

For quasi-static closed-surface EM calculations the Maxwell stress tensor provides the systematic field accounting, rather than summing visible pressure patches and ignoring the balancing surfaces. Transient EM requires field momentum as well. For an isolated entire system, momentum conservation must include matter and EM fields and any outgoing radiation or expelled material.

## Connection with the existing ΦGrooveDrive ladder

- **LIQ-E0:** canonical internal equal/opposite two-mass actuation. A control null for centre-of-mass claims.
- **LIQ-E1:** real external-medium coupling, simulated using idealized fluid resistance.
- **LIQ-E1c:** conservative magnet surrogate and ideal electrical energy-return ledger; not a new force.
- **LIQ-H1/H2:** dimensionless mirror-helix relational dynamics; not an EM field solver.
- **LIQ-ES1:** electrostatic **system-boundary** and external-coupling audit, without altering earlier models.

Liquid choreography and “opposing bubbles / gear fingers” remain design inspiration for *controllable geometry*. A movement metaphor does not establish momentum transfer, gravity modification or any relation to the Exodus Effect. Future simulation modules should publish their distinct equations and calibration evidence.

## Qualification

Run `node --test tests/es1-physics.test.mjs` or `npm run validate`.

Automated checks cover:
1. Coulomb force sign and Newton-pair antisymmetry.
2. Zero internal force sum for asymmetric and symmetric isolated layouts.
3. Equal and opposite reaction when an external charged object is included.
4. Disappearance of device net force when external object is removed.
5. Charge-squared and inverse-square scaling.
6. Mirror-force parity and varied wall geometry.
7. Bounded inputs and deterministic sweep receipts.
8. Visible SIMULATED / authority NONE / no physical thrust claim markers.

All numerical passes are **software invariants of the assumed model**. They cannot validate unusual propulsion.

## Sources (evidence classes deliberately separated)

- **Inventor patent / proposed mechanism:** https://patents.google.com/patent/US11511891B2/en
- **Company's own overview / demonstration claims:** https://ept.space/about/
- **Proponents' 2026 APEC presentation listing:** https://www.altsci.net/apec-8-29-2026/
- **Independent peer-reviewed experimental methodology, different apparatus:** https://doi.org/10.1038/s41598-024-70286-w
- **Outside evaluation distinguishing claim from replication:** https://www.scribeinvestigations.com/scribe-v1-scr-077-exodus-propulsion

**Ledger above ego.**
