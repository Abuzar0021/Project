# Architecture

This document explains how Margin checks writing. The diagram, performance
numbers, and deploy notes are filled in during Phase 8; this version covers the
checking pipeline and the three problems that make it hard.

## The pipeline

```
editor edits
  -> extract (doc -> per-block text + posMap)
  -> hash each block (cyrb53)
  -> cache lookup (skip unchanged blocks)
  -> scheduler (debounce, concurrency, abort, backoff, viewport-first)
  -> /api/check route -> LanguageTool
  -> staleness guard (drop results whose block moved on)
  -> build suggestions (map offsets to doc positions)
  -> suggestions store -> marks / rail / minimap / score
```

Local rules (tone, clarity, style) run in the browser with no network and are
merged with LanguageTool results per block, so tone and clarity feedback is
instant while correctness and style repetition come from LanguageTool.

## The three hard problems

### 1. Offsets versus positions

LanguageTool works on plain text and returns character offsets, but the editor
needs ProseMirror document positions to place a mark. `extract.ts` walks the
document and, for each textblock, builds `text` plus `posMap`, where `posMap[i]`
is the document position of character `i`. A hard break reads as `\n` and takes
one position; other inline nodes contribute no text and are skipped. Offsets are
UTF-16 code units in both Java (LanguageTool) and JavaScript, so accents and
emoji map correctly. `build-suggestions.ts` uses `posMap` to turn each
offset/length into a `from`/`to` range.

### 2. Rechecking cost

Rechecking the whole document on every keystroke is slow and wasteful. Two
mechanisms prevent it:

- Each block's text is hashed (`block-hash.ts`, cyrb53). The scheduler only
  sends blocks whose hash is not already in the cache, so editing one paragraph
  in a long document sends one request. Identical paragraphs anywhere reuse the
  same cached result.
- `cache.ts` is an LRU capped at 2,000 entries, so a very long document cannot
  grow it without bound.

The scheduler also debounces 400ms after the last edit, limits concurrency to
four in-flight requests, and checks blocks in the viewport first.

### 3. Race conditions

A response can arrive after the user has already changed the text, which would
pin a suggestion to the wrong words. Two defenses:

- The scheduler holds one `AbortController` per block and aborts a block's
  in-flight request when that block changes again, so superseded work is
  cancelled rather than raced.
- The staleness guard compares the hash a request was made with against the
  block's current hash when the response arrives. If they differ, the result is
  discarded and the block will be rechecked. Only fresh results become
  suggestions.

When the checker is unreachable the scheduler backs off (10s, 20s, 40s, cap
60s) and surfaces an "unreachable" status, retrying automatically.
