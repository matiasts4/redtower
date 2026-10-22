export const forbiddenPublicPhrases = [
  "autonomous",
  "odd/tasks",
  "estrategia",
  "based on",
  "copied from",
  "we copied",
] as const;

const shared = {
  corridor: "Corredor Poniente",
  stops: ["STOP_01", "STOP_02", "STOP_03", "STOP_04", "STOP_05", "STOP_06", "STOP_07", "STOP_08", "STOP_09", "STOP_10", "STOP_11", "STOP_12", "STOP_13", "STOP_14", "STOP_15", "STOP_16", "STOP_17", "STOP_18"],
} as const;

export const chromeCopy = {
  en: {
    language: { default: "en" as const, en: "English", es: "Español" },
    masthead: {
      signal: "RED",
      product: "Control Tower",
      reading: "Reading surface",
      notDesk: "Not a dispatch desk",
    },
    home: {
      kicker: "One fictional corridor",
      title: "The lowest-damage recommendation, with the sentence a person can defend.",
      body: "RED Control Tower reads fragmented synthetic signals, confirms whether an incident is real, estimates passenger impact, and ranks a small catalog of responses. A person must approve. The program never changes a route.",
      gallery: "Open the component gallery",
      cli: "The agent is still python run.py. This page does not replace it.",
    },
    gallery: {
      kicker: "Component gallery",
      title: "Tune the case file before any public page is treated as final.",
      case: "Composed case",
      specimens: "Specimens",
      scenario: "Scenario",
      approvalVariant: "Same block, with a recorded approval. Not a sixth operational case.",
    },
    status: {
      real: "real",
      insufficient: "insufficient",
      clear: "clear",
      label: "Incident status",
    },
    sentence: {
      label: "Operator sentence",
      note: "Quoted verbatim. Not translated.",
    },
    recommendation: {
      label: "Recommendation",
      versus: "versus wait, horizon 20",
      saved: "passenger-minutes saved",
    },
    metric: {
      passengers: "Passengers / 20 min",
      stops: "Stops in the impact",
      routes: "Routes",
      minutes: "Passenger-minutes",
    },
    actions: {
      label: "Ranked alternatives",
      note: "Sorted by passenger-minutes. Cost and risk are labels. They do not change the order.",
      winner: "Lowest damage",
    },
    evidence: { label: "Evidence" },
    approval: {
      label: "Approval gate",
      pending: "Waiting for a person. Applied remains false.",
      recorded: "Recorded. Applied remains false. Nothing was dispatched.",
      applied: "Applied",
      decision: "Operator decision",
      none: "none",
      control: "This page cannot approve or apply a response.",
    },
    trace: {
      label: "Method",
      summary: "How the decision is owned",
      body: "The host classifies, measures, ranks, and stores the Spanish sentence before any language-model role speaks. Those roles cannot change the class, the ranking, or applied. This file does not include role transcripts.",
    },
    spine: {
      label: "Corridor spine",
      note: "Eighteen stops, in corridor order. This file does not list which stops sit inside the impact, so none are marked.",
    },
    limits: {
      label: "Limits",
      synthetic: "Synthetic data. One corridor, four routes, eighteen stops.",
    },
    sponsor: {
      label: "Model id recorded in this file",
      body: "Sample mode makes no external call and records fixture. A live run can send the same named queries to Zetaris and ask Meterless Nightshift for the language-model roles. The id below is what this file recorded.",
    },
    palette: {
      label: "Palette",
      paper: "Paper",
      ink: "Ink",
      field: "Field",
      rule: "Rule",
      signal: "Signal",
      clear: "Clear",
      hold: "Hold",
      graphite: "Graphite",
    },
    type: {
      label: "Type",
      display: "Newsreader — the sentence",
      ui: "Public Sans — the interface",
      mono: "IBM Plex Mono — evidence and counts",
    },
  },
  es: {
    language: { default: "en" as const, en: "English", es: "Español" },
    masthead: {
      signal: "RED",
      product: "Control Tower",
      reading: "Superficie de lectura",
      notDesk: "No es un puesto de despacho",
    },
    home: {
      kicker: "Un corredor ficticio",
      title: "La recomendación de menor daño, con la frase que una persona puede defender.",
      body: "RED Control Tower lee señales sintéticas fragmentadas, confirma si un incidente es real, estima el impacto en pasajeros y ordena un catálogo pequeño de respuestas. Una persona debe aprobar. El programa nunca cambia un recorrido.",
      gallery: "Abrir la galería de componentes",
      cli: "El agente sigue siendo python run.py. Esta página no lo reemplaza.",
    },
    gallery: {
      kicker: "Galería de componentes",
      title: "Ajustar el expediente antes de dar por cerrada cualquier página pública.",
      case: "Expediente compuesto",
      specimens: "Especímenes",
      scenario: "Escenario",
      approvalVariant: "El mismo bloque, con una aprobación registrada. No es un sexto caso operativo.",
    },
    status: {
      real: "real",
      insufficient: "insufficient",
      clear: "clear",
      label: "Estado del incidente",
    },
    sentence: {
      label: "Frase del operador",
      note: "Citada textual. No se traduce.",
    },
    recommendation: {
      label: "Recomendación",
      versus: "frente a esperar, horizonte 20",
      saved: "minutos-pasajero ahorrados",
    },
    metric: {
      passengers: "Pasajeros / 20 min",
      stops: "Paraderos en el impacto",
      routes: "Recorridos",
      minutes: "Minutos-pasajero",
    },
    actions: {
      label: "Alternativas ordenadas",
      note: "Ordenadas por minutos-pasajero. Costo y riesgo son etiquetas. No cambian el orden.",
      winner: "Menor daño",
    },
    evidence: { label: "Evidencia" },
    approval: {
      label: "Compuerta de aprobación",
      pending: "Espera a una persona. Applied sigue en false.",
      recorded: "Registrada. Applied sigue en false. No se despachó nada.",
      applied: "Applied",
      decision: "Decisión del operador",
      none: "ninguna",
      control: "Esta página no puede aprobar ni aplicar una respuesta.",
    },
    trace: {
      label: "Método",
      summary: "Quién es dueño de la decisión",
      body: "El host clasifica, mide, ordena y guarda la frase en español antes de que hable cualquier rol de modelo. Esos roles no pueden cambiar la clase, el orden ni applied. Este archivo no incluye transcripciones de roles.",
    },
    spine: {
      label: "Espina del corredor",
      note: "Dieciocho paraderos, en orden de corredor. Este archivo no lista cuáles están dentro del impacto, así que ninguno se marca.",
    },
    limits: {
      label: "Límites",
      synthetic: "Datos sintéticos. Un corredor, cuatro recorridos, dieciocho paraderos.",
    },
    sponsor: {
      label: "Id de modelo registrado en este archivo",
      body: "El modo sample no hace llamadas externas y registra fixture. Una corrida en vivo puede enviar las mismas consultas con nombre a Zetaris y pedir a Meterless Nightshift los roles de modelo. El id de abajo es el que registró este archivo.",
    },
    palette: {
      label: "Paleta",
      paper: "Papel",
      ink: "Tinta",
      field: "Campo",
      rule: "Filete",
      signal: "Señal",
      clear: "Despejado",
      hold: "Espera",
      graphite: "Grafito",
    },
    type: {
      label: "Tipografía",
      display: "Newsreader — la frase",
      ui: "Public Sans — la interfaz",
      mono: "IBM Plex Mono — evidencia y conteos",
    },
  },
} as const;

export type ChromeLang = keyof typeof chromeCopy;
export const corridorStops = shared.stops;
export const corridorName = shared.corridor;
