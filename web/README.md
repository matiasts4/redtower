# RED Control Tower — reading surface

This Next.js app reads the checked-in `output_examples` JSON next to this folder. It does not run the agent, does not recompute a decision, and does not set `applied`.

The agent remains:

```bash
python run.py --input input_examples/scn-block.json
```

## Run

```bash
cd web
npm install
npm run dev
```

The site has two public surfaces:

- `/` one long landing with anchored sections: proof, cases, corridor, method, limits.
- `/system` the operating view over the checked-in files.

`/scenarios`, `/corridor`, `/method`, and `/limits` redirect to their landing anchors.

English is the default chrome. The language choice is stored in the browser. Operator sentences stay in Spanish in both languages. Display type is allowed on the landing only.

## What this page is not

Not a map. Not a dispatch desk. Not a passenger app. Sample mode makes no external call. A file may record a live model id; that id is what the file contains.
