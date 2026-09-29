---
title: Sh_Nexus
summary: A native desktop chat client and server in Rust, with the wire protocol split into its own crate and its own domain model behind it.
description: Sh_Nexus pairs a GPUI desktop client with an Axum server in one workspace. Sends reconcile optimistically by client id, unread counts are derived from counted identities instead of a counter, and one written design decision was later found to rest on a false premise.
role: Architecture and implementation. The feasibility spike, the workspace and crate layout, the protocol boundary, the state layer, and the test and coverage strategy.
# Start date, not a release date. "Started the week before 2026-09-28", so pinned to
# that week's Monday. Adjust to the exact day if you have it.
# `order` is the primary sort key, so this only breaks ties.
date: 2026-09-21
status: active
featured: true
order: 20
stack:
  - rust
  - gpui
  - axum
  - proptest
# TODO(you): add the repository URL. Left empty rather than guessed, because an empty
# links array is skipped and a wrong URL is rendered.
links: []
---

## The project

A desktop chat client and its server, in one Rust workspace. The client is GPUI, the
server is Axum, and the interesting part is the seam between them: the wire protocol
lives in its own crate with its own DTOs, and the domain model sits behind a `TryFrom`
boundary rather than sharing types with the transport.

## Proving the premise before building on it

The plan assumed GPUI worked on Windows. It did not, as written, and the first audit
found three concrete reasons: the HLSL compile step is gated behind
`not(debug_assertions)` and panics when `fxc.exe` is missing, the headless renderer
returns `Ok(None)` on Windows by explicit `cfg`, not by accident, and a debug selector
that looks like it is being tested is structurally a void because only the paint path
under `test-support` ever touches it.

Rather than assume the workarounds, I ran a Phase 0 spike that compiled and ran GPUI
from a pinned git revision on the real machine, and wrote down what it cost. The
release binary came out at 9.92 MB. That number is in the architecture record because
it was the thing the spike existed to measure.

Every one of those three claims was checked against the pinned checkout at the exact
line, not believed.

## A design decision that turned out to rest on a false pillar

The cache work took a no-lock approach and wrote down why: `gpui::Global` requires
`Send + Sync`, so an `Rc` could not be stored globally. That was wrong. Upstream,
`Global` is an intentionally empty marker trait with no `Send` or `Sync` bound at all,
and an `Rc` would have stored fine. `Send + Sync` was our choice, not a platform
requirement.

The pillar that survived turned out to be stronger than the one that fell. A worker
thread cannot call `cx.update_global` because `App` holds `Rc`s, so `Context` is not
`Send` and the crossing does not compile. The constraint is enforced by the compiler,
not by a convention nobody would remember.

The honest version of what is left is narrower and worth more: the compiler stops you
moving the *context*, not the *value*. `AppState` is still `Send + Sync` as a matter of
fact, and a test that moved it to another OS thread, mutated it without a lock and
read it back would compile. So single-thread confinement is now an invariant written
into the module and held by three tests, one of which asserts that the type is `Send`
and that this is a hazard rather than a guarantee. If the invariant ever became a real
type-level guarantee, that test would stop compiling, which is the point.

## Deriving the unread count instead of decrementing it

A message increments a channel's unread count only if it is new, its channel is not
the selected one at the moment it is applied, and its author is not this session. The
count is derived from a set of counted identities rather than stored as a `u32` per
channel, because "decrement the old channel" is not well defined. Property tests found
that during the first draft, and finding it is the reason the representation changed
rather than the counter being patched.

Window focus is deliberately absent, and deliberately not decided in silence. It is a
real product fork, the two model products disagree about it, and the value lives in
GPUI, which this layer is not allowed to import. So it is reported, not chosen.

## What the coverage numbers actually mean

Around 96% region coverage across the workspace, measured rather than copied. The more
useful finding is where coverage is systematically worst: 86 of the 1119 uncovered
regions in the state layer were the arms of a single `Display` implementation. The
generalisation is that `Display` and `Error` surfaces are the worst covered and the most
visible when they are wrong, and they are consistently written last and skipped first,
because a `match` arm is type-checked and a type-checked arm feels tested.

Coverage is also checked against mutation testing. Twelve mutants, all caught. One of
the three in a single test is not a fine-grained miss: the defect is that the limit is
not enforced at all, and the only test that can catch it has to exceed the limit.

## Where it stands

Phase 1 of 2, with the state layer merged, 909 tests passing, and the GPUI and
filesystem glue plus the dependency record still to come. It is in progress, and this
page says so.
