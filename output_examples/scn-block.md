# RED Control Tower result

**Scenario:** scn-block
**Model:** fixture

## Diagnosis

El incidente probablemente es real. Afecta a cuatro recorridos, nueve paraderos y aproximadamente 1.800 pasajeros durante los próximos 20 minutos.

## Recommendation

Con la evidencia REP_BLK_1, la opción recomendada reduce 1488 minutos-pasajero en 20 minutos (38% vs esperar).

- **Action:** relief_and_divert_210
- **Passenger-minutes (20 min):** 1488
- **Reduction vs baseline:** 38%
- **Explanation source:** reporter

## Alternatives

- `wait`: 2400 passenger-minutes; cost low; risk high
- `divert_210`: 1560 passenger-minutes; cost medium; risk medium
- `dispatch_relief`: 1716 passenger-minutes; cost high; risk medium
- `relief_and_divert_210`: 1488 passenger-minutes; cost high; risk medium

## Authorization

- **Status:** pending_human
- **Operator decision:** None
- **Applied:** False

## Limitations

- The system does not change routes.
- Recommendations require human approval before any operational change.
