# RED Control Tower result

**Scenario:** scn-surge
**Model:** nvidia/nemotron-3-ultra-550b-a55b

## Diagnosis

El incidente probablemente es real. Afecta a tres recorridos, cuatro paraderos y aproximadamente 800 pasajeros durante los próximos 20 minutos.

## Recommendation

Enviar un bus de refuerzo. Esta opción reduce el impacto estimado frente a esperar.

- **Action:** dispatch_relief
- **Passenger-minutes (20 min):** 1170
- **Reduction vs baseline:** 77%

## Alternatives

- `wait`: 5140 passenger-minutes; cost low; risk high
- `dispatch_relief`: 1170 passenger-minutes; cost high; risk medium

## Authorization

- **Status:** pending_human
- **Operator decision:** None
- **Applied:** False

## Limitations

- The system does not change routes.
- Recommendations require human approval before any operational change.
