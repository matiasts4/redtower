import type { ChromeLang } from "./copy";
import type { ScenarioId } from "./scenarios";

export interface ScenarioMeta {
  id: ScenarioId;
  title: Record<ChromeLang, string>;
  subtitle: Record<ChromeLang, string>;
  incidentType: Record<ChromeLang, string>;
  severity: "critical" | "warning" | "nominal" | "info";
  severityLabel: Record<ChromeLang, string>;
  statusLabel: Record<ChromeLang, string>;
  icon: string;
  badgeClass: string;
}

export const SCENARIO_METADATA: Record<string, ScenarioMeta> = {
  "scn-block": {
    id: "scn-block",
    title: {
      es: "Bloqueo de Corredor Vial",
      en: "Corridor Obstruction",
    },
    subtitle: {
      es: "Corte en Av. Pajaritos (Paradero 6 a 14)",
      en: "Obstruction at Av. Pajaritos (Stops 06-14)",
    },
    incidentType: {
      es: "Corte de Vía / Bloqueo Severo",
      en: "Road Blockage / Severe Obstruction",
    },
    severity: "critical",
    severityLabel: {
      es: "Alerta Crítica",
      en: "Critical Alert",
    },
    statusLabel: {
      es: "Incidente Confirmado",
      en: "Confirmed Real Incident",
    },
    icon: "alert-triangle",
    badgeClass: "bg-signal text-white font-bold",
  },
  "scn-false": {
    id: "scn-false",
    title: {
      es: "Inyección Adversaria / Falsa Alarma",
      en: "Adversarial Injection / False Alarm",
    },
    subtitle: {
      es: "Reporte malicioso aislado por Host Security Shield",
      en: "Malicious prompt injection neutralized by Host Shield",
    },
    incidentType: {
      es: "Ataque Semántico / Inyección Descartada",
      en: "Prompt Injection / False Report Suppressed",
    },
    severity: "warning",
    severityLabel: {
      es: "Host Shield: Neutralizado",
      en: "Host Shield: Neutralized",
    },
    statusLabel: {
      es: "Descartado por Sensores",
      en: "Contradicted by Physical Sensors",
    },
    icon: "shield-alert",
    badgeClass: "bg-amber-600 text-white font-bold",
  },
  "scn-normal": {
    id: "scn-normal",
    title: {
      es: "Operación Nominal Despejada",
      en: "Nominal Corridor Flow",
    },
    subtitle: {
      es: "Monitoreo preventivo continuo sin congestión",
      en: "Continuous preventive monitoring with normal flow",
    },
    incidentType: {
      es: "Servicio Regular / Flujo Normal",
      en: "Regular Service / Free Flow",
    },
    severity: "nominal",
    severityLabel: {
      es: "Despejado",
      en: "Corridor Clear",
    },
    statusLabel: {
      es: "Corredor Sin Novedades",
      en: "Nominal Dispatch",
    },
    icon: "check-circle",
    badgeClass: "bg-clear text-white font-bold",
  },
  "scn-stopped": {
    id: "scn-stopped",
    title: {
      es: "Bus Varado en Calzada",
      en: "Stalled Vehicle in Transit Lane",
    },
    subtitle: {
      es: "Falla mecánica reportada en Paradero 11",
      en: "Mechanical breakdown at Stop 11",
    },
    incidentType: {
      es: "Vehículo Detenido en Pista Solo Bus",
      en: "Vehicle Stalled in Bus Lane",
    },
    severity: "warning",
    severityLabel: {
      es: "Atención Requerida",
      en: "Attention Required",
    },
    statusLabel: {
      es: "Falla Mecánica Confirmada",
      en: "Mechanical Defect Confirmed",
    },
    icon: "bus",
    badgeClass: "bg-signal/85 text-white font-bold",
  },
  "scn-surge": {
    id: "scn-surge",
    title: {
      es: "Pico Imprevisto de Demanda",
      en: "Passenger Demand Surge",
    },
    subtitle: {
      es: "Sobredemanda en estación de transbordo intermodal",
      en: "Surge at intermodal transfer hub",
    },
    incidentType: {
      es: "Aglomeración en Paraderos 01-04",
      en: "Queue Congestion at Stops 01-04",
    },
    severity: "warning",
    severityLabel: {
      es: "Sobredemanda",
      en: "Demand Surge",
    },
    statusLabel: {
      es: "Capacidad Excedida",
      en: "Throughput Capacity Exceeded",
    },
    icon: "users",
    badgeClass: "bg-amber-600 text-white font-bold",
  },
  "scn-block-approved": {
    id: "scn-block-approved",
    title: {
      es: "Bloqueo Vial — Autorizado",
      en: "Road Blockage — Approved",
    },
    subtitle: {
      es: "Decisión firmada por M. Rojas (Dispatch CCO)",
      en: "Signed & authorized by M. Rojas (Dispatch CCO)",
    },
    incidentType: {
      es: "Mitigación Aprobada por Operador Humano",
      en: "Mitigation Signed Off by Human Dispatcher",
    },
    severity: "info",
    severityLabel: {
      es: "Firmado CCO",
      en: "Signed CCO",
    },
    statusLabel: {
      es: "Despacho Confirmado",
      en: "Dispatch Authorized",
    },
    icon: "user-check",
    badgeClass: "bg-ink text-bone font-bold",
  },
};

export function getScenarioMeta(fileId: string, fallbackId: ScenarioId = "scn-block"): ScenarioMeta {
  return SCENARIO_METADATA[fileId] || SCENARIO_METADATA[fallbackId] || {
    id: fallbackId,
    title: { es: fileId, en: fileId },
    subtitle: { es: "Escenario operativo", en: "Operational scenario" },
    incidentType: { es: fileId, en: fileId },
    severity: "info",
    severityLabel: { es: "Estado", en: "Status" },
    statusLabel: { es: "Registrado", en: "Recorded" },
    icon: "info",
    badgeClass: "bg-ink text-bone",
  };
}
