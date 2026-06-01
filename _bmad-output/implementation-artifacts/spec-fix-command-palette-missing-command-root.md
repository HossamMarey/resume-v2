---
title: 'Fix command palette crash — missing cmdk <Command> root'
type: 'bugfix'
created: '2026-06-01'
status: 'done'
route: 'one-shot'
---

# Fix command palette crash — missing cmdk <Command> root

## Intent

**Problem:** Opening the ⌘K / Ctrl+K command palette (or clicking "Inspect me") threw `TypeError: Cannot read properties of undefined (reading 'subscribe')` at `components/ui/command.tsx:72` (`CommandPrimitive.Input`). The vendored `CommandDialog` rendered the cmdk children (`CommandInput`/`CommandList`/`CommandItem`/…) directly inside `DialogContent` **without** the `<Command>` root that provides cmdk's context store — so every `CommandPrimitive.*` descendant tried to subscribe to an `undefined` store. The crash never surfaced in tests because the component suite mocks `@/components/ui/command`.

**Approach:** Wrap `{children}` in the already-defined-but-unused `<Command>` component inside `DialogContent`, restoring the canonical shadcn `CommandDialog` composition so the cmdk store is present for all descendants.

## Suggested Review Order

1. [`components/ui/command.tsx`](../../components/ui/command.tsx) — `CommandDialog` now wraps `{children}` in `<Command>` (the cmdk root). This is the whole fix — confirm the store provider wraps every `CommandPrimitive.*` consumer.
2. [`components/command-palette.tsx`](../../components/command-palette.tsx) — sole runtime consumer; no change, but verify its `CommandInput`/`CommandList`/`CommandGroup`/`CommandItem` and footer now resolve against the restored context.
