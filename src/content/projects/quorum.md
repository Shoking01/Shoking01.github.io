---
title: Quorum
summary: A small batch orchestrator that makes a failed data job resumable instead of restartable.
description: Quorum is a Python package and TypeScript CLI that runs scheduled data jobs as a checkpointed DAG, so a failure costs one task rather than the whole pipeline and a backfill is a flag.
role: Wrote the scheduler, the checkpoint store and the CLI, and designed the task contract the transforms are written against.
date: 2024-11-02
status: maintenance
featured: true
order: 20
stack:
  - python
  - typescript
  - postgres
  - docker
links:
  - label: package
    href: https://example.com/quorum
---

## The problem

A batch pipeline that restarts from the beginning when step six of twenty fails is not
slow because of any one step. It is slow because of everything that ran for nothing
first. The usual fixes are worse: make the steps idempotent and hope, or add a manual
list of which steps to skip, which is a config file nobody trusts.

## The model

A Quorum pipeline is a DAG of tasks. Each task declares its dependencies, declares
which tables it reads and writes, and returns a checkpoint. The scheduler persists
checkpoints as it goes, so resuming means asking the store which tasks are already
done rather than reconstructing it.

```python
from quorum import task, pipeline

@task(reads=["raw.events"], writes=["staging.sessions"])
def build_sessions(ctx):
    """Sessions are the unit of work. Everything downstream keys on session_id."""
    return ctx.sql("""
        INSERT INTO staging.sessions (session_id, started_at, ended_at)
        SELECT session_id, min(ts), max(ts) FROM raw.events GROUP BY session_id
    """).rowcount

@pipeline
def nightly(ctx):
    return [build_sessions(ctx)]
```

The task contract is deliberately dull. A task gets a context, runs work, and returns
a number — usually a row count, which doubles as evidence that the task did what it
said. There is no decorator DSL for retries or scheduling, because both of those belong
to the scheduler and not to the business logic.

## Checkpoints, and what they cost

The checkpoint store is a single Postgres table, and the whole resume mechanism is a
transaction: mark the task done and record its output in the same transaction as the
work itself. That is the one rule that matters. If the commit lands, the task is done;
if it does not, the task runs again. There is no third state and no window in which a
task is recorded as done but its output is missing.

The cost is that every task has to be able to commit its own writes, which rules out
work that reaches outside the database — a task that calls a third-party API cannot be
checkpointed atomically with that call. Those tasks are wrapped in a
`@task(external=True)` decorator that admits the weaker guarantee: run at most once
per attempt, and log loudly enough that a human can reconcile a failure.

## What it is good for

Backfills. `quorum run nightly --from 2024-01-01 --to 2024-06-30` walks the same DAG
across a date range, checkpointing per slice, so a backfill that fails on day 90
resumes at day 90. Before Quorum, a backfill of that size was a weekend of babysitting
and a reconciliation query written afterwards.
