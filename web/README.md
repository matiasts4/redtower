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

`/` is the landing. Display type is allowed there. `/system` is the platform: one UI type, rounded controls, and the checked-in scenarios. English is the default chrome. Operator sentences stay in Spanish in both languages.

## What this page is not

Not a map. Not a dispatch desk. Not a passenger app. Sample mode makes no external call. A file may record a live model id; that id is what the file contains.
