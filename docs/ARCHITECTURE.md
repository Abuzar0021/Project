# Architecture

How Margin turns a draft into margin notes.

## The pipeline

```
editor edit
  -> extract     each paragraph's text plus a position map
  -> hash        cyrb53 per paragraph
  -> local rules spelling list, wordy and plainer phrases, hedges, passive voice,
                 long sentences, voice habits (instant, in the browser)
  -> scheduler   debounce 600ms, skip cached paragraphs, four at a time,
                 abort superseded requests, back off when unreachable
  -> /api/check  -> LanguageTool
  -> merge       server and local issues, one note per stretch of text
  -> filter      the plan's categories, then kept (stetted) suggestions
  -> notes store -> underlines, margin notes, note count
```

Every note falls in one of three categories, each with its own underline so
the categories work without color: spelling and grammar (solid), clarity
(dotted) and voice (wavy). `lib/categories.ts` maps LanguageTool's rule
categories onto them.

## Anchoring notes to text

LanguageTool returns character offsets into plain text; the editor places marks
at ProseMirror document positions. `extract.ts` builds, for each paragraph,
`posMap[i]`, the document position of character `i`. Both sides count UTF-16
code units, so accents and emoji map exactly. Every paragraph carries a stable
`data-block-id` (`block-id.ts`) so results are grouped and cached by paragraph.

`suggestions-plugin.ts` draws the underlines as ProseMirror decorations and maps
them through every edit. Typing inside an underline removes it at once; that
paragraph is checked again. A result that arrives after its paragraph changed
is dropped by the staleness check, so a note is never pinned to the wrong words.

## Margin notes

`lib/notes-layout.ts` places each note level with its underline, eight pixels
above the line, and pushes it down just enough to clear the note above.
Accepting a note strikes the text, replaces it after 280ms and highlights the
new words; notes can also rewrite a wider range than they underline, such as
turning "The pricing was decided by the team" into "The team decided the
pricing". Stet removes the note and stores a rule (rule id plus the matched
text) so the same suggestion is filtered out later, in this draft on the Free
plan or in every draft on paid plans.

## Voice profile

`lib/voice/features.ts` measures habits, not content: contractions against
their long forms, sentence length, formal words and exclamation marks. A
profile combines the measurements from uploaded writing and from the writer's
other drafts over 150 words. The meter compares the open draft with the profile,
weighting each habit by how much evidence the draft has; voice notes flag a long
form only when the writer uses the short form at least 90% of the time across
three or more uses. Uploaded files are read in the browser and only their
measurements are kept.

## Preview data

Accounts, drafts, kept suggestions, voice measurements and preferences live in
the browser's local storage, keyed by account. A `margin_session` cookie lets
the middleware protect `/app` and `/welcome`, and a `margin_theme` cookie lets
the server render the app in the right theme on the first paint. Replacing
`lib/account.ts`, `lib/drafts.ts`, `lib/stet.ts` and `lib/voice/profile.ts` with
database calls is the path to real accounts; the components only use those
modules' functions.
