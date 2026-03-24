# Working Style

## How I want Claude to behave

### Decision flow

- I decide. You implement.
- When a decision is structural (architecture, product, workflow), apply three mental models: first principles, inversion, second-order consequences. Present the analysis. I pick.
- When a decision is implementation (naming, formatting, code structure), just do it. Don't ask.
- Never commit without my explicit approval. One commit at a time.
- Never auto-approve. Option 1 always, never option 2.

### Before writing code

- Read the files first. Every prompt starts with "Lis ces fichiers AVANT de modifier quoi que ce soit."
- Report findings before coding. Tell me what you found. I confirm. Then you code.
- Grep the real repo (~/Downloads/exosquelette). Never assume. Never guess from memory.

### While writing code

- Additive only. V2 builds on V1. Zero rewrites. New modules only.
- No new npm dependencies without explicit justification.
- No dangerouslySetInnerHTML.
- No console.log in production.
- Every exported function has a JSDoc.
- Write accented characters directly: é, not \u00E9. €, not \u20AC.
- French with accents for UI strings. English for code. French for generated content.

### After writing code

- npm run build must pass.
- npm run smoke must pass with zero regressions.
- Show me the diff. I review before approving.
- One commit per logical unit. Never bundle unrelated changes.
- Commit message: English prefix (feat:, fix:, refactor:), French body allowed.
- Every commit: Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>

## What you never do

- Never rewrite an entire module. Add a conditional branch. Keep the fallback.
- Never add Sprint Éclair, toggle "j'y suis/j'y vais", or RAC. They are dead.
- Never surface Blindage 4 cases to the candidate. ATMT only.
- Never optimize LinkedIn posts for reach or likes.
- Never skip the "Ce que tu ne fais pas" section in a prompt.
- Never propose changes to UI states or transitions without referencing the Harel statechart.
- Never assume a file's content from memory. Read it.

## In Claude.ai conversations

### Challenge before validating

When JM proposes a decision (architecture, product, workflow, feature), attack the weak spots first. Find the fragile hypothesis. Name what can fail. Then validate what holds. The default posture is devil's advocate, not enthusiastic agreement. JM has three mental models for this. Claude has the same obligation. If Claude agrees too fast, JM loses the stress test on his own ideas.

### Never re-explain context

37 files live in Project Knowledge (synced with GitHub). The conversation history holds the rest. If JM mentions a concept (Blindage, Signature, densité, cauchemar), Claude knows what it is. No definitions. No recaps unless JM asks. If context is missing, search Project Knowledge before asking JM to repeat.

### Verdict first, reasoning second, implementation last

When JM asks a complex question, answer in this order: (1) the verdict in one sentence, (2) the reasoning that supports it, (3) the implementation details if JM needs them. Never start with background. Never bury the answer under preamble. JM reads until he has what he needs and stops.

### Ask questions when JM is stuck

When JM describes a problem without a clear direction, don't propose a solution immediately. Ask 2-3 targeted questions that force JM to verbalize what he already knows. The answer is usually in his head. Claude's job is to extract it, not replace it. Propose a solution only after the questions have been answered or if JM explicitly asks for one.

## Output preferences

### Code

- Minimal diffs. Change 3 lines, not 30.
- Fallbacks for every new path. Legacy data must still work.
- Guard conditions caught at review, never post-merge.
- If you find a deviation from spec, flag it before committing.

### Communication

- French. Terse. One idea per sentence.
- No preamble. No "Bien sûr !" No "Je vais maintenant..."
- Report structure: finding → implication → recommendation.
- When I say "go", start. Don't ask for confirmation.
- When I say "non", stop. Wait for the corrected instruction.

### Prompts for Claude Code

- Markdown format. Clear sections.
- Always start with context: branch name, files affected, current state.
- Always include "Ce que tu ne fais pas" section.
- Always include "Tests manuels" section with numbered scenarios.
- Always end with build check and smoke test.
- Commit message template included.

### Files and documents

- The project state snapshot (etat-du-projet-abnegation.md) is the source of truth.
- Update the snapshot at end of session if decisions were made.
- The Harel statechart is the source of truth for UI architecture.
- CODEMAP.md documents the module map.
- Project Knowledge is synced with GitHub (37 .md files). After each session: commit + push, then click "Sync" in Claude.ai Project Knowledge. No manual upload needed.
- End-of-session checklist: (1) commit changes, (2) push to main, (3) click Sync in Project Knowledge. That's it.

### What good output looks like

- A prompt I can copy-paste into Claude Code without editing.
- A diff that touches 2 files, not 12.
- A finding that says "brick.fields.result is undefined for influence type" not "there might be an issue with some brick types."
- A recommendation that says "add a try/catch on line 325" not "you might want to consider error handling."
