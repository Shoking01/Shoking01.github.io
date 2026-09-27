---
title: Driftwatch
summary: A change-data-capture pipeline that keeps a columnar warehouse within seconds of production Postgres.
description: Driftwatch tails Postgres logical replication and applies row changes to a columnar store, with idempotent upserts, replayable offsets and lag metrics that page someone before the data goes stale.
role: Designed and built the ingestion service, the replication protocol handling and the operational tooling.
date: 2025-04-18
status: active
featured: true
order: 10
stack:
  - go
  - postgres
  - kafka
  - prometheus
  - terraform
links:
  - label: architecture notes
    href: https://example.com/driftwatch/architecture
---

## The problem

The reporting stack read from a replica that was already fifteen minutes behind by
the time anyone noticed. Nobody had broken anything; the pipeline simply had no way to
say how far behind it was. The fix was not a faster copy. It was making lag a
first-class, observable number and then holding the pipeline to a budget.

## How it works

Driftwatch opens a logical replication slot per database and consumes the change
stream as batches. Each batch is keyed by the Postgres LSN it starts at, written to
Kafka, and applied downstream as an upsert keyed on `(table, primary key, lsn)`.

The `(table, primary key, lsn)` key is the whole design. Because every write carries
the LSN it came from, applying the same batch twice is a no-op rather than a
duplicate, and applying batches out of order converges on the same state. That is what
makes replay safe, and replay is what makes the operational story bearable: when a
downstream consumer falls six hours behind, nobody has to reason about how much data
was lost, because the answer is "start from the last committed offset".

```go
// The upsert that makes replay safe. Highest LSN wins, so order does not matter.
const stmt = `
INSERT INTO rows (table_name, row_key, lsn, payload)
VALUES ($1, $2, $3, $4)
ON CONFLICT (table_name, row_key) DO UPDATE
SET lsn = EXCLUDED.lsn, payload = EXCLUDED.payload
WHERE EXCLUDED.lsn > rows.lsn`
```

## What made it hard

**Slot retention.** A replication slot holds WAL until every consumer has confirmed
it. A consumer that dies without releasing its slot will eventually fill the disk on
the primary, and the failure mode is a database that cannot be written to. Slots are
leased, heartbeated, and forcibly released after a timeout.

**Schema changes.** Adding a column is trivial. Renaming one is not, because the
change stream carries the old name. A small mapping table translates stream column
names to warehouse column names, and unknown columns are dropped with a metric rather
than an error, so a downstream deploy cannot take ingestion down.

**Backpressure.** If the warehouse cannot keep up, the correct behaviour is to fall
behind visibly, not to buffer without bound. Lag is exposed as a gauge against a
budget, and exceeding the budget pages.

## Where it landed

Ingestion sits at roughly two seconds from commit to queryable, against a fifteen
minute baseline. The number that mattered was not the latency — it was that lag is now
a number on a dashboard with an alert on it, so a bad day is a page rather than a
quarter-end discovery.
