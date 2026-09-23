# Architecture

This document explains how Margin checks writing: the pipeline, the three
problems that make it hard, the measured performance, and how it deploys.

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

## Performance

Measured in Chromium on a ~5,000 word document (LanguageTool mocked so the
numbers reflect the pipeline, not the engine):

| Metric                               | Result          |
| ------------------------------------ | --------------- |
| Time to first suggestions            | about 1.6s      |
| Recheck requests after a single edit | 1               |
| Typing latency                       | about 49ms/char |

The single-request-per-edit result is the payoff of the block hashing and
cache: only the edited block is re-sent. Typing latency includes rerunning the
local rules on the edited block and one batched rail relayout.

The margin rail was profiled separately by pasting the sample document 30 times
(240 notes): scrolling held about 16.7ms per frame (roughly 60fps) with no
visible jank, because every rail recalculation is batched into a single
requestAnimationFrame.

## Deployment

Production builds use Next.js standalone output. `docker/Dockerfile` is a
multi-stage build that runs as a non-root user. `docker/docker-compose.yml`
brings up two services, `web` and `languagetool`, on an internal network;
LanguageTool has no published ports, so it is reachable only by `web` and never
from the internet. `docker/Caddyfile.example` terminates HTTPS for a subdomain
and reverse-proxies to `web`. See the README for the commands.
