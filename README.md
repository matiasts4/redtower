# RED Control Tower

RED Control Tower recommends the lowest-damage action for one fictional bus corridor. It reads fragmented signals, confirms whether an incident is real, estimates passenger impact, simulates responses, and explains the choice. A person must approve. The program never changes a route.

## Quick path

1. `python -m venv .venv` and install `requirements.txt`.
2. Copy `.env.example` to `.env` and leave `SAMPLE_MODE=true`.
3. `python run.py --input input_examples/scn-block.json`
4. Read `output_examples/scn-block.json`, the Markdown beside it, and the new file in `logs/`.

No API key is required for that run. `model` in the JSON is `fixture`.

## Roles

The host calculates the decision before the language-model roles speak. Those roles cannot change the class, the ranking, or `applied`.

| Role | What it does |
| --- | --- |
| Host | Loads every named query, classifies the incident, measures impact, simulates queues, ranks actions, and stores the Spanish sentence. |
| Planner | Asked which queries to run. The host still runs the full query list. |
| Diagnostician | Names the incident from the host result. It cannot override the class. |
| Scenario | May only propose actions from the host catalog. |
| Judge | Compares host scores. It cannot change the ranking. |
| Reporter | Explains the host sentence in Spanish and must cite an evidence id. A draft that cites none is asked once more. The stored sentence stays the host sentence. |

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
- Classification, the queue simulation, the ranking, and the stored sentence still run. The output is not read from `output_examples/`.

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

`--approve` sets `authorization` to `recorded` and `operator_decision` to `approve`. `applied` stays false.

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

- Sample mode: no external model. The local stand-in is called, and the host keeps its own decision.
- Live mode: NVIDIA Nemotron through Meterless Nightshift. Super plans and reads the case, Ultra judges when configured, Nano writes the explanation when configured.

Sponsor technology:

- Zetaris runs the same named SQL as the sample database when `SAMPLE_MODE=false`. It does not supply a live transit feed.
- Meterless is the model API for the five roles in live mode.
- Cursor is the development environment. Composer assisted the scaffolding, the tests, and this README.
- NVIDIA Nemotron is the model family Nightshift reports in live mode.

Development:

Developed in Cursor. AI-assisted coding was used for scaffolding, tests, and documentation. The classification rules, queue totals, and Spanish sentences are locked by `tests/`. Generated code was checked against those tests.

Sample mode:

`SAMPLE_MODE=true` uses the CSV sample and makes no external call.

There is no embedding model and no fine-tuned model.

## Data

All corridor rows are synthetic and live in `data/sample/`. See `data/README.md`. The public input is a scenario id, for example `{"scenario_id": "scn-block"}`. GPS, reports, demand, cameras, weather, and road events are rows for that id, not a message from an operator. A new scenario needs new rows. It does not need a new code branch.

`output_examples/` and `logs/` are produced by `run.py`. Sample runs record `model` as `fixture`. Live runs record the Nemotron id returned by Nightshift. Logs name the role, the action, a short input, a short output, the model, and any reporter retry. They do not contain API keys.

## Third-party code and licences

| Package | Licence |
| --- | --- |
| python-dotenv | MIT |
| requests | MIT |
| openai | Apache-2.0 |

No other repository is vendored in this project.

## Limitations

- One fictional corridor, four routes, five scenarios.
- No map, no web control room, no demo video, and no slide deck in this repository.
- No autonomous route change. Approval is a record.
- Sample mode does not call Zetaris or Meterless.
- Live Zetaris requires the `REDTOWER` tables to exist already.
- The language-model roles do not choose the winner. The queue simulation does.
- Weather text and report wording do not change the class.

## Verification

```bash
python -m unittest discover -s tests -v
```
