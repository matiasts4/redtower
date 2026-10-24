# RED Control Tower

RED Control Tower recommends the lowest-damage action for one fictional bus corridor. It reads fragmented signals, confirms whether an incident is real, estimates passenger impact, simulates responses, and explains the choice. A person must approve. The program never changes a route.

## Quick path

1. `python -m venv .venv` and install `requirements.txt`.
2. Copy `.env.example` to `.env` and leave `SAMPLE_MODE=true`.
3. `python run.py --input input_examples/scn-block.json`
4. Read `output_examples/scn-block.json`, the Markdown beside it, and the new file in `logs/`.

No API key is required for that run. `model` in the JSON is `fixture`.

## Roles

The planner proposes which named queries to load; the host accepts only catalog names that include the core sensor set. The diagnostician reads those rows (not a finished class) and proposes status and incident type; the host checks that proposal against deterministic sensor rules in `classify()`. The host then measures impact, simulates queues, and ranks actions by passenger-minutes. The scenario role may only name catalog actions; it does not change the ranking. The judge compares the four scores and may name a different winner; the simulation ranking stays authoritative. The reporter writes Spanish text that is stored when it cites a host evidence id and the passenger-minute figures from the simulation; otherwise the template sentence from `recommendation_text()` is stored.

| Role | What it does |
| --- | --- |
| Host | Validates query lists, loads data, checks classification, measures impact, simulates queues, ranks actions, and validates the reporter draft. |
| Planner | Selects named queries from the catalog for the scenario. |
| Diagnostician | Proposes status and incident type from row summaries. |
| Scenario | Proposes actions from the host catalog only. |
| Judge | Names the lowest passenger-minutes action from host scores. |
| Reporter | Explains the recommendation in Spanish with evidence and figures when accepted. |

When the model does not agree with `classify()`, the stored class still comes from the sensor rules. Passenger-minutes still come from the queue simulation. `applied` stays false.

Passenger report text is untrusted. It appears only under `Untrusted report data:` in user messages.

## Install

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Docker, still in sample mode, without a key file:

```bash
docker build -t redtower .
docker run --rm redtower
```

The image runs `scn-block` and exits. Another scenario:

```bash
docker run --rm redtower python run.py --input input_examples/scn-false.json
```

## Sample mode

`SAMPLE_MODE=true` is the default. It is the path for a reviewer who has no keys.

- SQL runs on the CSV files in `data/sample/` through `sql/queries.sql`.
- The model is the local stand-in. Meterless and Zetaris are not called.
- Classification rules, the queue simulation, the ranking, and the locked diagnosis sentences still run. Output JSON is written fresh by `run.py` on each run without reading cached outputs.

```bash
python run.py --input input_examples/scn-normal.json
python run.py --input input_examples/scn-false.json
python run.py --input input_examples/scn-block.json
python run.py --input input_examples/scn-stopped.json
python run.py --input input_examples/scn-surge.json
```

Record approval without applying a change:

```bash
python run.py --input input_examples/scn-block.json --approve
```

`--approve` writes `output_examples/scn-block-approved.json` (and Markdown). It sets `authorization` to `recorded` and `operator_decision` to `approve`. `applied` stays false.

`--fixture` forces the same local stand-in even if `SAMPLE_MODE=false`.

## Live mode

Set `SAMPLE_MODE=false` and fill `.env`. Missing Meterless settings exit 2 and write no output.

| Variable | Role |
| --- | --- |
| `METERLESS_BASE_URL`, `METERLESS_API_KEY` | OpenAI-compatible Nightshift API |
| `NEMOTRON_SUPER` | Planner, diagnostician, scenario |
| `NEMOTRON_ULTRA` | Judge. Falls back to Super when empty |
| `NEMOTRON_NANO` | Reporter. Falls back to Super when empty |
| `ZETARIS_API_URL`, `ZETARIS_USER`, `ZETARIS_PASSWORD` | Same SQL, sent to Zetaris |

Zetaris must already expose a Lightning database named `REDTOWER` whose tables match the CSV names in `data/sample/`. This repository does not contain the Zetaris platform and does not install it. An alias such as `meterless/auto` may come back as an underlying Nemotron id. That id is stored. A reported model that is not Nemotron, and not the configured id, is refused.

```bash
python run.py --check
```

`--check` prints whether live settings exist. It does not print secret values. It exits 2 when one is missing. A sample-mode run does not need this check.

## Decision metric

Actions are ranked by passenger-minutes over 20 minutes. Each minute adds the people waiting, boards up to the boarding rate, then adds arrivals. For `scn-block` the rates produce:

| Action | Passenger-minutes |
| --- | ---: |
| Wait | 2400 |
| Divert route 210 | 1560 |
| Dispatch a relief bus | 1716 |
| Relief and divert 210 | 1488 |

The 38% figure is `912 / 2400` from that simulation. It is not a stored label.

## AI and Model Usage

Models:

- Sample mode: no external model. The local stand-in drives role prompts; the host keeps classification and ranking when proposals disagree.
- Live mode: NVIDIA Nemotron through Meterless Nightshift. Super plans and reads the case, Ultra judges when configured, Nano writes the explanation when configured.

Sponsor technology:

- **Zetaris:** Data Fabric that federates and executes the 11 named SQL queries across the corridor tables in `REDTOWER` when `SAMPLE_MODE=false`.
- **Meterless (Build Engine & Power Runtime):**
  - *Build Engine (World Model & Markovian State Pattern):* The host maintains deterministic corridor state while specialist roles propose queries, classification, and wording within bounded checks.
  - *Power Runtime (Nightshift):* OpenAI-compatible inference runtime for NVIDIA Nemotron models.
- **Cursor:** The development environment. Composer and Grok assisted the scaffolding, the tests, and this README.
- **NVIDIA Nemotron:** Model family powering live inference through Meterless Nightshift (Super 120B for planning/diagnosis, Ultra 550B for judging, Nano 30B for reporting).

Development:

Developed in Cursor. AI-assisted coding was used for scaffolding, tests, and documentation. The classification rules, queue totals, and Spanish sentences are locked by `tests/`. Generated code was checked against those tests.

Sample mode:

`SAMPLE_MODE=true` uses the CSV sample and makes no external call.

There is no embedding model and no fine-tuned model.

## Data

All corridor rows are synthetic and live in `data/sample/`. See `data/README.md`. The public input is a scenario id, for example `{"scenario_id": "scn-block"}`. GPS, reports, demand, cameras, weather, and road events are rows for that id, not a message from an operator. A new scenario needs new rows. It does not need a new code branch.

`output_examples/` and `logs/` are produced by `run.py`. Sample runs record `model` as `fixture`. Live runs record the Nemotron id returned by Nightshift. Logs name the role, the action, a short input, a short output, the model, and any reporter retry. They do not contain API keys.

Result JSON includes `query_source`, `classification_source`, `explanation_source`, and `judge_agreed` to show how host checks and model proposals aligned.

## Third-party code and licences

| Package | Licence |
| --- | --- |
| python-dotenv | MIT |
| requests | MIT |
| openai | Apache-2.0 |

No other repository is vendored in this project.

## Web Control Room

A Next.js app under `web/` reads the JSON files in `output_examples/` and can launch `python run.py`. It does not recompute a decision and it does not set `applied`. Sample mode needs no API keys. Live mode runs only when `python run.py --check` exits 0, which means Zetaris and Nightshift settings are present. See `web/README.md`.

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3010/` for the landing page and `http://localhost:3010/system` for the operating view. Port 3000 stays with Zetaris. From `/system`, Sample runs `run.py --sample --stream` and writes `logs/web_<scenario>.json`. Live stays disabled until `run.py --check` exits 0.

## Limitations

- One fictional corridor, four routes, five scenarios.
- No automatic route changes without operator confirmation. Operator approval is an auditable record (`applied` stays false).
- Sample mode does not call Zetaris or Meterless.
- Live Zetaris requires the `REDTOWER` tables to exist already.
- The queue simulation chooses the winning action; the judge may disagree without changing it.
- Weather text and report wording do not change the class.

## Verification

```bash
python -m unittest discover -s tests -v
```
