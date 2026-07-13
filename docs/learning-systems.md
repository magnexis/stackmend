# STACKMEND Learning Systems

## Purpose

This document defines how learning-based techniques fit into STACKMEND without turning the platform into an opaque autonomous system.

The role of learning in STACKMEND is to improve:

- prioritization
- adaptation
- ranking
- optimization

The role of learning is not to replace evidence, policy, or explicit repair review.

## 1. Reinforcement Learning with Q-Learning

Q-learning is a practical first learning method for STACKMEND because it works well in constrained decision spaces with measurable outcomes.

Example STACKMEND uses:

- select the next analyzer in continuous repair mode
- rank repair strategies for a recurring fracture
- choose between fast scan and deep scan paths
- learn when to escalate to manual review

Possible state features:

- fracture type
- repository language mix
- branch type
- prior fix acceptance rate
- test results
- policy severity

Possible actions:

- run route analyzer
- run env analyzer
- propose repair pack
- defer and gather more evidence
- escalate for review

Reward examples:

- accepted repair with passing tests
- reduced recurrence of a fracture
- lower scan time with unchanged accuracy

Penalty examples:

- rejected suggestion
- repair plan causing test regressions
- noisy or redundant recommendations

## 2. Genetic and Evolutionary Algorithms

Evolutionary algorithms are useful when STACKMEND needs to explore strategy combinations rather than optimize a single direct decision.

Example STACKMEND uses:

- evolve analyzer scheduling profiles for different repository shapes
- optimize ranking weights for semantic search relevance
- search repair-plan sequences for large multi-system failures
- benchmark alternative policy thresholds

These should be trained and validated in offline simulation environments using fixture repositories and benchmark suites.

## 3. Finite State Machines with Dynamic Weights

FSMs with dynamic weights are well suited for interactive and adaptive product behavior.

Example STACKMEND uses:

- transition from observe to propose when a fracture repeats
- change explanation depth based on user interaction patterns
- suppress repeated low-value warnings
- escalate stricter guidance on release branches

Suggested states:

- observe
- verify
- recommend
- preview-repair
- apply-approved-repair
- blocked
- escalate

Suggested signals:

- quick-fix acceptance
- command repetition
- recurring fracture count
- CI failures
- policy severity

## Safety requirements

- Every recommendation must remain evidence-backed.
- Learning outputs may rank or prioritize options, not invent unsupported fractures.
- Automated edits must stay reviewable and reversible.
- Telemetry-driven adaptation must be configurable.
- Offline benchmark baselines must exist for any promoted learned policy.
