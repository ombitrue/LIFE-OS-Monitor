# SKILL_ROADMAP.md

This artifact tracks capability development rather than feature development. It is a capability graph, skill progression model, and evidence-backed roadmap. It is not a task tracker or sprint board.

## Skill levels

```text
0 = Aware
1 = Understand
2 = Practice
3 = Repeatable
4 = Mentor
5 = Authority
```

## Skill graph

```text
Local Product Delivery
 ├─ Local-first architecture
 ├─ Static build packaging
 ├─ Browser persistence clarity
 └─ Launch documentation

Code Stewardship
 ├─ Dependency reduction
 ├─ TypeScript correctness
 ├─ Repository hygiene
 └─ Maintainable boundaries

Evidence
 ├─ Build verification
 ├─ Type verification
 ├─ Local server verification
 └─ Downloadable artifact packaging

Positioning
 ├─ Product narrative
 ├─ Usage documentation
 ├─ File-purpose labeling
 └─ Conservative capability claims
```

## Current capabilities

```yaml
- skill: Local-first architecture
  level: 2
  confidence: medium
  evidence:
    - merged PR evidence: converted the app away from Vite-specific runtime assumptions into a local static React bundle served by a Node script.
    - repository evidence: README documents no backend, no database, and localStorage behavior.
  next_step: Add explicit export/import guidance or implementation before claiming durable local data portability.

- skill: Static build packaging
  level: 2
  confidence: medium
  evidence:
    - merged PR evidence: added scripts/build.mjs for static dist generation.
    - validation evidence: npm run build completed successfully in the working environment.
  next_step: Keep build output reproducible and document exactly which files are generated versus source-controlled.

- skill: Browser persistence clarity
  level: 2
  confidence: medium
  evidence:
    - repository evidence: README states that data is stored in localStorage under l2_* keys.
    - code evidence: app contains defensive localStorage loading helpers.
    - implementation evidence: DATA VAULT can export, import, and reset LIFE.OS backup v1 JSON data.
    - validation evidence: npm run typecheck completed after the data portability implementation.
  next_step: Validate recovery with an external user or reviewer before increasing this skill level again.

- skill: Launch documentation
  level: 2
  confidence: medium
  evidence:
    - repository evidence: README includes install, npm start, build, and typecheck instructions.
    - validation evidence: local server was started and root/main bundle endpoints responded.
  next_step: Add troubleshooting notes for Node/npm versions and blocked browser permissions.

- skill: Dependency reduction
  level: 2
  confidence: medium
  evidence:
    - merged PR evidence: removed Vite, Vite plugin, Oxlint config, and unused starter assets.
  next_step: Avoid adding dependencies unless they remove meaningful maintenance burden or enable validated user value.

- skill: TypeScript correctness
  level: 2
  confidence: medium
  evidence:
    - validation evidence: npm run typecheck completed successfully.
    - repository evidence: tsconfig.json enables strict checks and unused symbol checks.
  next_step: Extract stable typed modules only when the app shell becomes too large to reason about safely.

- skill: Repository hygiene
  level: 2
  confidence: medium
  evidence:
    - merged PR evidence: removed unused template files and simplified project configuration.
    - repository evidence: README file map labels the remaining files.
  next_step: Keep generated dist files out of source control unless a release process requires them.

- skill: Downloadable artifact packaging
  level: 1
  confidence: low
  evidence:
    - working-session evidence: ZIP archives were generated for source and static dist outside the repository.
  next_step: Add an explicit release packaging script if downloadable archives become a recurring workflow.

- skill: Product narrative
  level: 1
  confidence: medium
  evidence:
    - repository evidence: README describes LIFE.OS Monitor as a browser-only personal command deck.
  next_step: Validate the narrative with a real user or reviewer before treating it as stable positioning.
```

## Capability signals

```yaml
current_capabilities:
  - The app can be installed, type-checked, built, and launched locally without Vite.
  - The repository is small enough for manual inspection.
  - Core data behavior is documented as browser-local storage.
missing_skills:
  - external validation of data recovery
  - release packaging repeatability
  - external user validation
  - maintainable module boundaries beyond the current single app shell
next_recommended_skill: release packaging repeatability
```

## Next best development step

The next best step is reproducibility: add a release packaging script or checklist that consistently produces the source ZIP and static dist ZIP, then validate it with one reviewer or pilot user.

This follows the priority order:

```text
clarity
→ reproducibility
→ external conversation
→ pilot signal
```

## Update rules for future merged PRs

1. Identify affected skills.
2. Update evidence chain.
3. Update confidence only when evidence justifies it.
4. Update capability signals.
5. Update the next recommended skill.
6. Do not inflate progress from intention or speculation.
7. Keep language conservative.

## Core principle

Capabilities produce execution.

Execution produces evidence.

Evidence justifies progress.

Progress does not come from claims.
