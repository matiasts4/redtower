# RED Control Tower — operator window

This Next.js app reads the checked-in `output_examples` JSON and can launch the agent. The agent remains `python run.py`. The page does not recompute a decision and does not set `applied`.

Sample mode needs no API keys. It runs `python run.py --sample --stream` and writes `logs/web_<scenario>.json`. Live mode is enabled only when `python run.py --check` exits 0. That check means the Zetaris and Nightshift settings are present. Live does not pass `--sample`.

## Run

```bash
cd web
npm install
npm run dev
```

The page listens on port 3010. Port 3000 stays with Zetaris. Open `http://localhost:3010/` and `http://localhost:3010/system`.

The site has two public surfaces:

- `/` one long landing with anchored sections: proof, cases, corridor, method, limits.
- `/system` the operating view. Sample can be run from the page. Approval is a record in `logs/approvals.jsonl` and leaves `applied` false.

`/scenarios`, `/corridor`, `/method`, and `/limits` redirect to their landing anchors.

English is the default chrome. The language choice is stored in the browser. Operator sentences stay in Spanish in both languages. Display type is allowed on the landing only.

## What this page is not

Not a dispatch desk. Not a passenger app. Sample mode makes no external call. A live model id appears only after a live run returns one.
