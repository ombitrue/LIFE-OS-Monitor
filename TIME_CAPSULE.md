# TIME_CAPSULE.md

This artifact preserves strategic intent across future iterations. It is a sealed snapshot, prediction surface, and drift-detection mechanism. It is not a TODO list, roadmap, or changelog.

## Current state

```yaml
timestamp: 2026-06-19T13:40:00Z
identity: LIFE.OS Monitor, a browser-only personal command deck for local quest, habit, Pomodoro, XP, notes, and lightweight environment tracking.
current_release: local standalone React bundle on branch work, commit 2856c5a
current_focus: keep the app simple to install, launch, inspect, and preserve without Vite-specific scaffolding or a backend.
confidence: medium
```

## Future expectations

```yaml
expected_by: 2027-01-01
predictions:
  - The project will remain most valuable as a local-first personal operating dashboard rather than a networked multi-user service.
  - The next useful improvements will come from clarity, reproducibility, and documentation before additional feature complexity.
  - User trust will depend on preserving local data ownership and making browser storage behavior explicit.
```

## Outcomes

```yaml
outcomes: []
prediction_accuracy: not_yet_measured
strategic_drift: Low Drift - this is the first capsule snapshot, so there is no prior expectation to compare against.
```

## Risks

```yaml
risks:
  - The app may drift toward unnecessary infrastructure, dependency churn, or hosted-service assumptions that conflict with local-first use.
  - Single-file dashboard logic may become difficult to maintain if new capabilities are added without extracting stable boundaries.
  - Browser-only persistence can be misunderstood as durable backup unless export/import or backup guidance is added later.
```

## Preservation layer

The project should remain understandable to a user who downloads the repository and runs it locally.

The app should not require a backend, hosted account, or remote database for its core workflow.

Local-first behavior is a product constraint, not a temporary implementation detail.

Documentation must stay truthful about what is automatic, what is local, and what the user must do manually.

Capability claims should follow working evidence, not precede it.

## Opening condition

```yaml
open_when:
  release: v1.0.0
  or_date: 2027-01-01
  or_pilot_count: 3
```

## Drift detection protocol

When this capsule is opened, compare expected versus actual outcomes.

```text
Expected: the predictions listed above.
Actual: the observed project state at opening time.
Drift: Low Drift, Medium Drift, or High Drift with explanation.
```

Do not rewrite the snapshot above. Add outcomes and drift notes below it.

## Maintenance note — 2026-06-19 data portability clarity

```yaml
actual_change: Added in-app DATA VAULT behavior for exporting, importing, and resetting localStorage-backed LIFE.OS data.
expected_vs_actual: The original expectation favored clarity and reproducibility before additional feature complexity; this change aligns with that expectation.
prediction_accuracy: too_early_to_score
strategic_drift: Low Drift - the work strengthens local-first preservation rather than moving the project toward hosted infrastructure.
```

This note does not replace the original snapshot. It records observed movement against the capsule's preservation layer.
