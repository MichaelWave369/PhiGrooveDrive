# LIQ-E1c — Magnetic Liquid Interface and Ideal Energy Return

**Revision:** 0.1.0 · **Date:** 2026-10-26  
**Status:** SIMULATED / no physical device · **Authority:** NONE  
**Calibration:** NONE · **Propulsion claim:** NONE · **Real recovery claim:** NONE

This laboratory translates Liquid handflow's opposing near-contact motion into a two-body electromechanical control model. Hands become bounded mechanical modules ("bubbles"), finger articulations suggest distributed control, and the gap becomes a measured internal state. Altermath retains its formal NBG meaning: causally important hidden structure under a coarse Keyhole, **not** a new force between the hands. The model is **isolated** and cannot propel its center of mass.

[NBG LIQUID-BGA-01 formal proposal](https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/LIQUID_INTERFACE_BUBBLE_GEAR_ALTERMATH_V0_1.md)

## Dynamics

Let two inertial modules have masses m1,m2, gap d, relative velocity u, reduced mass mu=m1*m2/(m1+m2), spring stiffness ks, equilibrium gap deq and mechanical damping c. The model assumes a conservative, non-calibrated repulsive magnetic **surrogate**:

    U_magnetic(d) = C / (d+a)^2
    F_magnetic(d) = 2*C / (d+a)^3

C has units J·m², the softening parameter a is in meters. These equations are not a physical magnet field map. Their derivative consistency is tested.

The motor is an ideal linear voice coil, sharing a single transduction constant K between force and back-electromotive force:

    F_coil = K*I
    EMF = K*u
    L*dI/dt = V - R*I - K*u

The mechanical equation is

    mu*du/dt = F_magnetic(d) - ks*(d-deq) + K*I - c*u
    dd/dt = u.

Internal forces on the two bodies are equal and opposite, so the isolated center of mass never accelerates. There is no fluid or expelled propellant in this experiment. The same K used for force and EMF enforces equal electrical and mechanical conversion power K*I*u, the conventional ideal voice-coil relation. Real coils vary with position, field geometry, current, heating, and saturation. [Linear servomotor modeling](https://doi.org/10.3390/electronics12040977) gives the established relationship; [FEMM driver dynamics](https://www.femm.info/doku/doku.php?id=driverdynamics) explains the power identity.

## Full electrical and mechanical energy ledger

The experiment deliberately assumes an **ideal reversible (four-quadrant) terminal voltage source**. It can supply electrical power when V*I is positive and absorb it when V*I is negative. This is a theoretical source boundary, not evidence of real battery charging or implementation of a safe regenerative drive.

    P_terminal = V*I
    E_bus_in = integral max(P_terminal, 0) dt
    E_bus_return = integral max(-P_terminal, 0) dt
    E_bus_net = E_bus_in - E_bus_return.

Potential, kinetic and coil energy:

    E_stored = 1/2*mu*u²
             + 1/2*ks*(d-deq)²
             + C/(d+a)²
             + 1/2*L*I².

Heat is counted independently:

    E_copper = integral R*I² dt
    E_mechanical = integral c*u² dt.

Energy closure:

    E_stored(final) - E_stored(initial)
      + E_copper + E_mechanical
      - E_bus_net
      = numerical_residual.

The model uses fourth-order Runge-Kutta for states and energy integrals, and retains positive and negative terminal power separately. The default tolerance is 1e-5 J over the six-second qualification. Energy returned to the ideal source can coexist with **positive net energy consumption**. Return energy is not a newly created energy supply. The default experiment contains no real electrical regeneration measurement, converter, battery chemistry, switching losses, or hardware limits.

## Choreographic voltage patterns

- LIQUID: sinusoid with a second-harmonic phase contribution.
- WAVE: simple sine wave.
- POP: narrow smooth positive pulses.
- RETURN: smooth positive pulse followed by a smooth negative-voltage interval.
- REVERSE: opposite signed sinusoidal drive.
- OFF: zero terminal voltage; internally stored energy can still decay through mechanical and copper losses.

These are controller patterns motivated by movement, not data captured from a dancer. Gear-finger markings and curved field lines in the browser are **visual explanations**, not solved magnetic field vectors or a five-actuator array.

## Qualification controls

1. All six patterns close the energy balance within 1e-5 joules with positive qualified gaps.
2. Internal pair momentum and center of mass remain zero for equal or unequal masses.
3. Magnetic repulsive force equals negative derivative of the declared potential.
4. Removing the magnetic coefficient removes both magnetic force and stored magnetic energy.
5. Coil force and back-EMF use the same coupling K, maintaining conversion power equality.
6. With drive OFF, ideal bus input and return are exactly zero even when preload relaxes.
7. Under selected drive modes, instantaneous negative power generates a nonnegative return tally, while default net bus energy remains positive.
8. Lowering the integration step verifies numerical convergence.
9. Inputs are bounded and receipts remain explicitly SIMULATED, authority NONE, calibration false and hardwareRecoveryClaim false.

Run npm run validate for all E0/E1/E1c suites, or npm run test:e1c for this lab.

A green workflow confirms numerical consistency under the model. It does not validate a physical magnetic field or establish recovered electrical output.

## Relationship to the other labs

- **E0**: isolated two-body mechanical energy and momentum model.
- **E1**: six-segment fin with an idealized external resistive medium that receives momentum.
- **E1c**: isolated pair with a conservative repulsive surrogate plus a reversible electric transducer. It does NOT currently propel a fin, calculate net water thrust or drive a physical electromagnet.

Combining E1c and E1 requires a physical geometry, electrical driver, coupled actuator dynamics, current/temperature protection and externally measured thrust. Only a later validated bench experiment can compare real energy per delivered propulsion task.

## Physical validation proposal

Begin with a *guarded, low-energy* linear-bearing test rig, distance sensor, force instrument, separately metered coil terminals and a hard stop. If using a reversible electrical driver, its sink/storage circuit, voltage/current limits, dump resistance, thermal limits and protective design must be documented and evaluated by an experienced electrical engineer. Test null cases (no repulsive element, actuator disconnected, reversing mechanical preload) and report uncertainty and repeated traces before making any empirical claims.

The original movement intuition comes from Michael "Mikey" Hughes's Liquid dance practice. The technical architecture is an experimental mathematical formalization.

**Ledger above ego.**
