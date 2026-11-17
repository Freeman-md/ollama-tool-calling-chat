# Project working agreements

## Safety and collaboration

- Never inspect secret files such as `.env`, `.env.local`, or files containing credentials. Non-secret example files are permitted. Never print or commit secrets.
- Check the working tree before changes. Another agent may be working in this same checkout; preserve its changes, avoid overlapping edits, and do not stage or commit its work.
- After each completed task, commit only that task's intended changes and report the commit hash. Use Conventional Commit messages such as `feat: add tool` or `fix: validate arguments`, with a concise imperative subject. If acceptance criteria are unmet, report the blocker and do not commit unfinished work.
- Do not push, merge, rebase, reset, or clean unless the user explicitly requests it.

## Implementation

- Inspect the relevant code, tests, and existing patterns before changing anything. Make the smallest coherent change and avoid speculative abstractions, dependencies, and unrelated cleanup.
- This is a Next.js App Router chat backed by local Ollama. Keep model behavior general: let the model decide when an available tool helps, rather than hardcoding keyword or tool-specific routing.
- Preserve existing request and response contracts, errors, and tool behavior unless the task explicitly changes them. Use the shared Zod schemas for validation and tool parameter definitions; validate a batch of tool calls before executing any of them.
- Use `@/` for cross-folder imports and `./` for sibling imports, following the existing project pattern.

## Completion and verification

- Add or update focused tests for changed behavior and important failure cases. Preserve existing regression tests.
- For code changes, run relevant tests and `npm run build`; the full test command is `npm test`. When a task changes user-visible chat or tool behavior, exercise the relevant flow in the browser against local Ollama when available. Report anything that could not be verified.
- Review the diff for correctness, unintended changes, secrets, and generated artifacts. Stop any local server started for verification when finished.
- Report what changed, verification results, and any remaining limitations. Do not claim a task is complete if its requested acceptance criteria have not been met.
