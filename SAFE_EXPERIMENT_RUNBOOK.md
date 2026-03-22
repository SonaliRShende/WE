# CARE-Net Safe Experiment Runbook

This file gives the shortest practical path to run CARE-Net safely before scaling to the full 2000 seeker / 1000 provider dataset.

## 1. Install dependencies

Run from the project root:

```powershell
pip install -r backend\requirements.txt
```

Verify PyTorch:

```powershell
python -c "import torch; print(torch.__version__)"
```

## 2. Quick safety check

This is the recommended first run.

```powershell
python backend\run_safe_experiment.py --mode quick
```

What it does:

- creates data splits if they do not exist
- trains on a small subset of users if PyTorch is installed
- falls back to prepare-only mode if PyTorch is missing
- runs a small evaluation on a subset of test users
- writes outputs under `backend/models/quick_debug/`

Quick mode defaults:

- train users: 50
- validation users: 15
- test users evaluated: 20
- candidate jobs per user: top 40 + 15 random negatives

## 3. Prepare-only dry run

Use this if you want to verify pseudo-label generation and data flow without training neural models.

```powershell
python backend\run_safe_experiment.py --mode prepare
```

Outputs go under `backend/models/prepare_only/`.

## 4. Full research training

Run this only after the quick mode looks healthy.

```powershell
python backend\run_safe_experiment.py --mode full
```

This trains:

- dynamic weight model
- graph signal model

And then evaluates baseline cosine vs CARE-Net on the test split.

Outputs go under `backend/models/` and `backend/models/evaluation/`.

## 5. Manual gold evaluation

Proxy evaluation is good for development, but final project reporting should include a manual gold set.

Create annotation template:

```powershell
python backend\create_manual_gold_set.py --split test --sample-users 100
```

Fill the generated JSON with:

- `relevance`: 0, 1, or 2
- `constraint_violation`: true or false

Then evaluate using that file:

```powershell
python backend\evaluate_care_net.py --split test --labels-path backend\models\manual_gold_annotation_template.json
```

## 6. Useful direct commands

Create splits:

```powershell
python backend\create_experiment_splits.py
```

Train on a subset manually:

```powershell
python backend\research_pipeline.py --max-train-users 100 --max-validation-users 30 --top-candidates 50 --random-negatives 20
```

Prepare-only subset run:

```powershell
python backend\research_pipeline.py --prepare-only --max-train-users 100 --max-validation-users 30
```

Evaluate a smaller sample:

```powershell
python backend\evaluate_care_net.py --split test --max-users 50 --top-candidates 50 --random-negatives 20
```

## 7. What success looks like

Quick mode success:

- pseudo labels are generated
- evaluation JSON is written
- no import/runtime errors

Full mode success:

- `dynamic_weight_model.pt` exists
- `graph_signal_model.pt` exists
- evaluation report JSON exists
- CARE-Net outperforms cosine on at least one of:
  - `NDCG@5`
  - `MAP@5`
  - lower `violation_rate@5`

## 8. Recommended workflow

1. `quick`
2. inspect output JSON files
3. if healthy, run `full`
4. create manual gold set
5. run final manual-gold evaluation

## 9. Important honesty for your report

If you evaluate with pseudo labels, call it:

- `proxy evaluation`
- `weakly supervised evaluation`

Do not present it as fully human-annotated ground truth.
