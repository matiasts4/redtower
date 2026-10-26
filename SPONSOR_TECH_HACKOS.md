# Sponsor Technologies & Architecture Narrative (HackOS Entregable 4)

Official answers structured for the HackOS submission form for **RED Control Tower**.

---

### 1. Zetaris (Data Fabric & Unified Data Layer)

**How it is integrated and what sources it unifies:**

Zetaris serves as the unified **Data Fabric** layer of RED Control Tower, overcoming data fragmentation in metropolitan public transit without costly ETL delays:
- **Unified Tables across the Western Corridor (11 federated tables):**
  1. `gps_feed` / `buses`: Real-time GPS coordinates, vehicle velocities, directions, and stop sequence on route 210.
  2. `frequencies` / `stops`: GTFS scheduled service frequencies, headways, and topological order across 18 stops.
  3. `stop_demand` / `pax_counts`: Live passenger queue counts and boarding throughput rates per stop per minute.
  4. `camera_events` / `corridor_hazards`: Visual confirmation of roadblocks, stopped vehicles, and corridor bottlenecks.
  5. `operator_reports`: Incoming driver and inspector field dispatches treated as unverified inputs.
- **Resilient Fallback:** When `SAMPLE_MODE=true` or running offline, the data layer transparently falls back to local SQLite + canonical CSV replicas in `redtower/data/`, maintaining identical schema and query semantics.

---

### 2. Meterless (Inference & Model Runtime)

**How it was configured and endpoints used:**

Meterless Nightshift powers the inference runtime for the multi-agent orchestration via standard OpenAI-compatible endpoints:
- **Client Configuration:** Standard OpenAI SDK integration in `app/client.py` (`openai.OpenAI(base_url=METERLESS_BASE_URL, api_key=METERLESS_API_KEY)`).
- **Service Endpoint:** `https://api.meterless.ai/v1` (configurable via `METERLESS_BASE_URL`).
- **Low-Latency Agent Loops:** Fast inference allows sub-second synchronous validation rounds between Planner, Diagnostician, Scenario, Judge, and Reporter agents, including format correction and retry loops before returning to the Host.
- **Deterministic Fixture Fallback:** When offline or running without keys, the runtime falls back seamlessly to deterministic fixtures in `app/fixtures.py`.

---

### 3. Cursor (AI-First Development Environment)

**How Cursor facilitated development with Grok and Composer:**

Cursor served as the primary development environment throughout the hackathon:
- **Multi-Agent DAG Scaffolding:** Enabled rapid design and implementation of the 9-stage Markovian DAG, defining strict Pydantic and dataclass contracts between agents.
- **Comprehensive Test Suite Generation:** Facilitated writing and maintaining 55 Python tests and 18 TypeScript tests, guaranteeing robustness across adversarial edge cases.
- **Web Console & Execution Flow UI:** Accelerated Next.js/React component construction (`ExecutionFlow` DAG, SVG animated paths, hierarchical tree, and SSE streaming integration).

---

### 4. NVIDIA (Nemotron Super 120B, Ultra 550B & Nano 30B)

**Where and how NVIDIA Nemotron models contribute:**

RED Control Tower employs model specialization based on cognitive workload:
1. **NVIDIA Nemotron 3 Super 120B (`nvidia/nemotron-3-super-120b`):**
   - **Planner Agent:** Formulates context-aware queries against the Zetaris data fabric.
   - **Diagnostician Agent:** Powers the *Untrusted Report Shield*, cross-referencing subjective operator reports with sensor rows (GPS + cameras) to filter false alarms.
2. **NVIDIA Nemotron 3 Ultra 550B (`nvidia/nemotron-3-ultra-550b-a55b`):**
   - **Judge Agent:** Strategic comparative evaluation across simulated intervention actions, validating trade-offs and enforcing the *Override Shield*.
3. **NVIDIA Nemotron 3 Nano 30B (`nvidia/nemotron-3-nano-30b`):**
   - **Reporter Agent:** High-speed synthesis producing the operator-facing explanation with verified evidence citations.

---

### 5. Innovation in Sponsor Technology Usage

**What makes this combination unique:**

1. **Deterministic Mathematics vs. Semantic Intelligence:**
   Queue simulation (M/M/1 queue over a 20-minute horizon) and passenger-minute damage calculations remain 100% deterministic in Python. Nemotron models are reserved for unstructured interpretation, adversary filtering, multi-agent evaluation, and grounded communication.
2. **Federated Real-Time Ingestion:**
   Zetaris Lightning SQL federation paired with Meterless Nightshift allows end-to-end incident analysis in under 10 seconds without centralized ETL pipelines.
3. **Architectural Human-in-the-Loop Safety:**
   In compliance with critical transit operations, `applied = false` is an architectural guarantee. Every dispatch action requires explicit human operator sign-off, recorded immutably in `logs/approvals.jsonl`.
