# RED Control Tower result

**Scenario:** scn-stopped
**Model:** fixture

## Diagnosis

El incidente probablemente es real. Afecta a un recorridos, cuatro paraderos y aproximadamente 240 pasajeros durante los próximos 20 minutos.

## Recommendation

Con la evidencia BUS_210_04, la opción recomendada reduce 234 minutos-pasajero en 20 minutos (91% vs esperar).

- **Action:** dispatch_relief
- **Passenger-minutes (20 min):** 234
- **Reduction vs baseline:** 91%
- **Explanation source:** reporter
- **Host sentence:** Enviar un bus de refuerzo. Esta opción reduce el impacto estimado frente a esperar.

## Alternatives

- `wait`: 2700 passenger-minutes; cost low; risk high
- `dispatch_relief`: 234 passenger-minutes; cost high; risk medium

## Authorization

- **Status:** pending_human
- **Operator decision:** None
- **Applied:** False

## Limitations

- The system does not change routes.
- Recommendations require human approval before any operational change.
