# Puppy Image Pipeline (Phase 1 offline)

Offline-first, resumable local pipeline for generating Angel Bulldogs Color Lab visuals from the
existing TypeScript resolver output. Phase 1 intentionally blocks paid API calls by default.

## What this package does in Phase 1

- validates deduplicated `visible_signature` phenotype rows exported from the live resolver
- inventories required approved references (master + anchors + pattern references)
- selects a coverage pilot set (`manifests/pilot.jsonl`)
- queues jobs in local SQLite state (`state/jobs.sqlite`) without paid requests
- records capability and scope audits
- estimates pilot cost locally using model pricing inputs

## Prerequisites

- Python 3.11+
- Node dependencies already installed at repository root

## Setup

```sh
cd /Users/mojsa/Desktop/Puppy\ Website
npm run color-lab:phenotypes
python3 -m venv tools/puppy-image-pipeline/.venv
source tools/puppy-image-pipeline/.venv/bin/activate
python -m pip install -U pip
python -m pip install -e "tools/puppy-image-pipeline[dev]"
```

Copy credentials template (for later paid pilot step only):

```sh
cp tools/puppy-image-pipeline/.env.example tools/puppy-image-pipeline/.env
```

Do not run paid pilot until references are approved and API key is configured.

## CLI entrypoint

From repository root:

```sh
python -m puppy_images --help
```

### Phase 1 command sequence

```sh
python -m puppy_images inventory
python -m puppy_images manifest-validate
python -m puppy_images pilot-select --count 10
python -m puppy_images dry-run --pilot-only --budget-profile phase1
python -m puppy_images capabilities-check
python -m puppy_images cost-estimate --budget-profile pilot
python -m puppy_images review
python -m puppy_images audit
python -m puppy_images status
python -m pytest tools/puppy-image-pipeline/tests
```

### Paid generation guard

`generate` exits unless both are true:

1. `--execute-paid` is set
2. selected budget profile allows paid execution

Example (do **not** run in Phase 1):

```sh
python -m puppy_images generate --execute-paid --budget-profile pilot --pilot-only --limit 10
```

Add `--mock-api` to rehearse queue flow without paid calls.

## Outputs and state

- Manifest export: `tools/puppy-image-pipeline/manifests/phenotypes.jsonl`
- Pilot export: `tools/puppy-image-pipeline/manifests/pilot.jsonl`
- Job ledger: `tools/puppy-image-pipeline/state/jobs.sqlite`
- Reports: `tools/puppy-image-pipeline/docs/*.md`
- Review gallery: `tools/puppy-image-pipeline/outputs/review/gallery.html`

## Notes

- Hidden carriers, sex, dog name, and confirmation status never multiply image rows.
- Safety outcomes remain excluded from ordinary puppy generation:
  - double Merle (`M/M`) routes to warning panel
  - FOXI3 `Dup/Dup` remains nonviable conception only
