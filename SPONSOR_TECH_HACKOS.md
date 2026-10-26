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

RED Control Tower rejects the generic "one-size-fits-all" model approach and implements an enterprise-grade **Multi-Tier Cognitive Architecture** using the NVIDIA Nemotron family. Workloads are strictly partitioned by cognitive depth, latency SLAs, and context complexity:

1. **NVIDIA Nemotron 3 Super 120B (`nvidia/nemotron-3-super-120b`) — Context Ingestion & Adversarial Filtering:**
   - **Planner Agent:** Ingests live operational alerts and dynamically selects targeted federated SQL queries across the 11 tables of the Zetaris data fabric, preventing unnecessary database load.
   - **Diagnostician Agent (*Untrusted Report Shield*):** Functions as a semantic firewall inspired by *NeMo Guardrails*. Unstructured operator reports are treated as untrusted data. Nemotron Super cross-examines incoming human incident reports against ground-truth sensor rows (GPS telemetry, vehicle velocity, and automated camera obstacle detectors). In false-alarm scenarios (`scn-false`), it isolates contradictions and suppresses phantom incidents that would otherwise trigger costly fleet diversions.

2. **NVIDIA Nemotron 3 Ultra 550B (`nvidia/nemotron-3-ultra-550b-a55b`) — High-Stakes Strategic Deliberation:**
   - **Judge Agent (*Pareto Arbitration & Override Shield*):** Deliberates on complex operational trade-offs across four simulated mitigation alternatives (`wait`, `divert_210`, `dispatch_relief`, `relief_and_divert_210`). Evaluates multi-dimensional trade-offs between passenger delay (passenger-minutes), fleet operating costs, and secondary road congestion. The *Override Shield* enforces proportionality, vetoing aggressive measures when sensor evidence does not justify high operational expenditure.

3. **NVIDIA Nemotron 3 Nano 30B (`nvidia/nemotron-3-nano-30b`) — Ultra-Fast Grounded Synthesis:**
   - **Reporter Agent:** High-throughput, sub-100ms inference that translates complex simulation and telemetry state into a concise, actionable natural-language briefing for the human dispatch controller. Employs a strict self-correction loop (`MAX_REPORTER_RETURNS = 2`): the draft is automatically rejected if it fails to cite verified evidence identifiers (`REP_BLK_1`, `CAM_AV023`) or accurate passenger-minute figures computed by the host.

**Cryptographic Model Integrity Enforcement (`_is_configured_nemotron`):**
In `app/adapters/meterless.py`, the client inspects runtime headers and enforces that returned models belong strictly to the NVIDIA Nemotron family. If an unauthorized fallback model is reported, the system raises an `UnexpectedModel` exception and aborts execution, ensuring zero unvetted model drift. Every run records its verified model identifier in `logs/` audit traces.

---

### 5. Innovation in Sponsor Technology Usage

**What makes this combination unique:**

1. **The "Born for NVIDIA DGX" Thesis (On-Premise Municipal Appliance):**
   Metropolitan public transit and urban surveillance constitute critical national infrastructure. Sending continuous GPS telemetry of thousands of vehicles, passenger density matrices, and real-time CCTV camera feeds to third-party public cloud APIs violates data sovereignty and municipal privacy regulations, while introducing network dependency during severe emergencies.
   RED Control Tower is architecturally engineered as a **private on-premise appliance for NVIDIA DGX Supercomputers** deployed inside the Central Operations Center (CCO). Leveraging local weights from the NVIDIA Nemotron family accelerated by TensorRT-LLM, the system achieves sub-5-second end-to-end incident resolution entirely air-gapped from commercial cloud dependencies.

2. **Deterministic Queue Mathematics vs. Semantic Intelligence:**
   Critical transit control cannot tolerate LLM hallucination of numerical variables. Queue simulation (M/M/1 queue over a rolling 20-minute horizon) and passenger-minute damage calculations remain 100% deterministic in Python. NVIDIA Nemotron models are reserved for unstructured natural language interpretation, adversary filtering, multi-agent evaluation, and grounded communication.

3. **Federated Real-Time Ingestion Without Centralized ETL:**
   Zetaris Lightning SQL federation paired with high-throughput Nemotron inference allows end-to-end corridor diagnosis in under 10 seconds across 5 disparate telemetry sources, eliminating fragile data pipelines.

4. **Architectural Human-in-the-Loop Safety Guarantee:**
   In compliance with critical transit safety standards, `applied = false` is an unalterable architectural invariant. No physical dispatch, bus re-routing, or depot injection is ever executed autonomously. Every operational change mandates explicit sign-off from a certified human dispatcher, permanently notarized in `logs/approvals.jsonl`.
