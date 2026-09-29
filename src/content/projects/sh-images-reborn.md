---
title: Sh_Images Reborn
summary: A native image viewer for Windows built in Rust on GPUI, where every design decision is measured against render cost rather than assumed.
description: A desktop image viewer written in Rust on GPUI, built around bounded memory and predictable frame cost. Large folders are virtualized, decode budgets are explicit and testable, and the Windows CI gates formatting, Clippy and the full suite.
role: Design and implementation. Architecture, the render and decode paths, the workspace layout, and the test suite.
# Start date, not a release date. Approximate to the day; adjust if you want it exact.
# `order` is the primary sort key, so this only breaks ties.
date: 2026-08-13
status: active
featured: true
order: 10
stack:
  - rust
  - gpui
  - windows
links:
  - label: source
    href: https://github.com/Shoking01/Sh_Images-Reborn
---

## The problem

An image viewer looks like a solved problem until you open a folder with four thousand
images in it. Then it is a rendering budget problem wearing a costume.

`App::render` was building a complete interactive cell tree for every image in the
folder, every frame. `ui/grid.rs` then translated that entire `flex_wrap` tree and
scrolled it manually. For a folder of a few hundred images that is survivable. Past
that, opening the folder and scrolling are two different experiences, and both of them
are bad.

The interesting part is that the folder being large is not the root cause. The root
cause is that the renderer had no idea how much work it was asking for, so nothing
pushed back on it.

## The constraint that decided the shape

GPUI 0.2.2 exposes a virtualized list, and the obvious move is to hand the grid over to
it. That does not work here. The virtualized list callback does not receive the `App`
`Context` that these cells need to build themselves, so adopting it would have meant
reworking the renderer to give up the context it depends on.

There was a real decision underneath that, and it was not "use the built-in thing". A
broad renderer rewrite would have been bigger, would have touched the selection
semantics and geometry that already worked, and would have made the actual performance
problem harder to measure while it was being fixed. Rewriting the thing you are trying
to profile is how you end up with a rewrite and no answer.

So the fix was bounded on purpose: calculate the visible row range directly, build real
interactive cells only for those rows, and stand in cheap fixed-size placeholders
everywhere else. It is less clever than delegating to the framework. It is also
verifiable, and it left the existing geometry and selection behaviour untouched.

## What is actually measured

There was no grid render benchmark to check the work against, which is a gap worth
naming: the performance work initially had nothing to prove it had helped. A decode
benchmark existed in `sh-core`, and the grid work added the missing measurement on its
own side rather than trusting the improvement.

The decode path is held to the same standard. `max_decode_dimension` is wired to a
real setting rather than a placeholder, and a decode cache and a memory limit that
claimed to work without doing so were removed instead of being left in place as
decoration.

The suite is 248 tests in `sh-app`, 175 in `sh-core` and 3 integration tests, developed
strictly RED to GREEN, with a Windows CI workflow running formatting, Clippy with
warnings denied, and the full suite on every merge.

## What I would do differently

The benchmark should have come first. The virtualization is correct, but the ordering
was backwards: I optimized a path I could not yet measure, and only afterwards built
the measurement that would tell me whether the work was worth what it cost. The
technique was the easy part. Knowing whether it mattered was the part I was guessing at.
