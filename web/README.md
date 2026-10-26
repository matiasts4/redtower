# RED Control Tower — Operator Window & Visual System

This Next.js app renders the operator window for RED Control Tower, reading the checked-in `output_examples/` and providing full interactive controls to stream or replay runs via `python run.py`. The agent logic remains in `python run.py`. The page does not recompute a decision on the client and never sets `applied: true`.

Sample mode requires zero API keys. It runs `python run.py --sample --stream` and streams Server-Sent Events (SSE) while writing `logs/web_<scenario>.json`. Live mode is enabled when `python run.py --check` exits 0 (confirming Zetaris and Meterless Nightshift credentials).

---

## 1. Getting Started

```bash
cd web
npm install
npm run dev
```

The application listens on port **3010** by default (leaving port 3000 free for Zetaris).
Open `http://localhost:3010/` for the landing overview and `http://localhost:3010/system` for the operational console.

### Testing & Build

```bash
# Run unit and contract tests (18 tests: scenarios, replay, signals, DAG builder, copy parity)
npm test

# Run Next.js production build (verifies all static and dynamic routes compile cleanly)
npm run build
```

---

## 2. Interactive Surfaces

* **`/` (Landing Page):** Long-form documentation with anchored sections (`#proof`, `#cases`, `#corridor`, `#method`, `#limits`).
* **`/system` (Operational Control Room):**
  - **Multi-Agent Execution Flow (`ExecutionFlow`):** Switch between **Graph View (DAG)** and **Hierarchical Tree View**.
    - *Graph View:* Interactive SVG DAG displaying stages (Planner, Data Fabric, Diagnostician, Simulator, Scenario, Judge, Reporter, Approval Gate) with animated edges and Host Critic retry loops (`reject_queries`, `reject_classification`, `reject_judge_action`, `request_evidence_citation`).
    - *Tree View:* Hierarchical supervisor-worker delegation tree with nested retries.
    - *Node Inspector:* Telemetry drawer revealing role, model, execution time, formatted JSON input/output, and cited evidence chips.
    - *Replay & Live Streaming:* Step-by-step slider replay of recorded scenarios and real-time SSE animation during Sample and Live runs.
  - **Corridor Spatial Map:** 18 stops with dynamic vehicle markers, active slow/stopped bus tags (`BUS_210_04`), and clickable stop inspector.
  - **Queue Simulation Chart:** 20-minute passenger depletion curve comparing evaluated actions against baseline.
  - **Operator Recommendation & Approval Gate:** Dual display of the verbatim Host Template Sentence (`host_text`) and the Reporter's evidence-cited explanation (`text`). The approval dialog logs decisions to `logs/approvals.jsonl` while maintaining `applied = false`.
* **`/components` (Component Lab):** Live specimens of all UI building blocks, including `ExecutionFlow` in working, retry, and done states.
* **Redirects:** `/scenarios`, `/corridor`, `/method`, and `/limits` smoothly anchor to `/`.

---

## 3. Bilingual & Compliance Standards

* **Default Chrome:** English (`en`) by default with an instant toggle to Spanish (`es`).
* **Locked Operator Sentences:** Spanish operator sentences (`S7`) remain verbatim in both English and Spanish modes.
* **Compliance:** Zero prohibited claims (`autonomous`, `auto-dispatch`). The system is an operational decision support tool where route dispatch authority rests solely with the human operator.
