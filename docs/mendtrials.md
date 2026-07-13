# MendTrials

## Purpose

`MendTrials` is the benchmark tournament system that compares candidate variants against the Stable Core.

## Trial classes

- detection trials
- repair trials
- generalization trials
- performance trials
- adversarial trials
- version trials
- long-horizon trials

## Promotion principle

Candidates are judged by multi-objective fitness, not by improving a single metric.

Example factors:

- correctness
- repair success
- generalization
- confidence calibration
- source verification quality
- false-positive change
- regression risk
- resource cost
- instability

## Anti-overfitting requirements

- hidden benchmark sets
- rotating evaluation repositories
- procedurally generated defects
- transfer tests
- contamination tracking
- holdout repositories
