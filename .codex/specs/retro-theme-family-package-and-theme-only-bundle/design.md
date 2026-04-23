# Design Document

## Overview

`axolync-theme-retro-mode` should be a dedicated art/package repo, not a second browser repo. It should own:

- four retro theme package definitions
- four generated font families
- theme CSS/assets
- editable/generated source artifacts
- the inputs that later build one theme-only retro bundle

The repo should not try to own browser runtime logic or builder publication logic directly.

## Resolved Decisions

- Publish one bundle containing the four retro themes together.
- Keep the same logical bundle valid for both preinstalled and later zip-install flows.
- Use four distinct generated font families, one per theme.
- Retain editable/generated source artifacts in-repo alongside shipped assets.
- Support Latin + Hebrew minimum coverage, with hybrid Hebrew treatment when readability requires it.

## Repo Structure

Recommended structure:

- `themes/red-led/`
- `themes/cyan-vfd/`
- `themes/arcade-crt/`
- `themes/cockpit-hud/`
- `fonts/red-led/`
- `fonts/cyan-vfd/`
- `fonts/arcade-crt/`
- `fonts/cockpit-hud/`
- `fonts-sources/` or `font-src/`
- `references/` for visual proof references
- `artifacts/output/` for generated bundle outputs

The exact folder names can shift, but the separation should remain:

- shipped runtime assets
- editable/generated font source artifacts

## Theme Model

Each theme should define:

- theme id
- display name
- family membership (`retro-mode`)
- CSS/style assets
- font-family references
- fallback behavior notes where needed

The four themes should look meaningfully different, not just recolored:

- red LED: dashboard/seven-segment energy
- cyan VFD: vacuum-fluorescent brightness and thin segmentation
- arcade CRT: pixel matrix, CRT scanline flavor
- cockpit hybrid: instrument-panel/HUD mixed styling

## Font Strategy

The first implementation should generate four separate families.

Each family should include:

- Latin glyphs
- Hebrew glyphs
- punctuation/digits needed for karaoke shell text

Hebrew should not be forced into unreadable strict segment logic. Where needed, the design should use a hybrid form that still feels theme-consistent.

Because user choice matters here, the repo should preserve editable/generated source artifacts so later iterations can merge or refine families without having to recreate them from scratch.

## Bundle Strategy

This repo should prepare one logical bundle containing all four themes.

That means:

- one bundle metadata truth
- four theme members inside it
- no adapters
- no addon runtime behavior

The bundle is later consumed by builder/publication paths, but this repo should already model the family as one coherent multi-theme payload rather than four unrelated one-offs.

## Proof Strategy

The repo should support later automated proof by keeping:

- stable theme ids
- stable asset/font naming
- stable screenshot/reference targets

It does not have to own Playwright itself, but it should make browser-side screenshot proof practical and repeatable.

## Self-Review Notes

- The design deliberately avoids overfitting to any one commercial font reference.
- It keeps the repo useful both for shipping and for iteration, which matches the approved `3-B` decision.
