# Project working agreements

## Safety and collaboration

- Never inspect secret files such as `.env`, `.env.local`, or files containing credentials. Non-secret example files are permitted. Never print or commit secrets.
- Check the working tree before changes. Another agent may be working in this same checkout; preserve its changes, avoid overlapping edits, and do not stage or commit its work.
- After each completed task, commit only that task's intended changes and report the commit hash. Use Conventional Commit messages such as `feat: add tool` or `fix: validate arguments`, with a concise imperative subject. If acceptance criteria are unmet, report the blocker and do not commit unfinished work.
- Do not push, merge, rebase, reset, or clean unless the user explicitly requests it.

## Implementation

- Inspect the relevant code, tests, and existing patterns before changing anything. Make the smallest coherent change and avoid speculative abstractions, dependencies, and unrelated cleanup.
- Give business conditions meaningful names and use straightforward control flow. For example, `searchProducts` names its conditions `matchesScent` and `matchesPrice`.
- Use braces for multi-line guards, keep orchestration in execution order, and extract coherent responsibilities. Judge readability by how easily someone can follow the flow, not by line count.
- Prepare display values and define named event handlers before JSX. Collection mapping and simple conditional rendering may remain in JSX.
- Reuse existing code where it fits instead of introducing parallel implementations.
- This is a Next.js App Router chat backed by local Ollama. Keep model behavior general: let the model decide when an available tool helps, rather than hardcoding keyword or tool-specific routing.
- Preserve existing request and response contracts, errors, and tool behavior unless the task explicitly changes them. Use the shared Zod schemas for validation and tool parameter definitions; validate a batch of tool calls before executing any of them.
- Use `@/` for cross-folder imports and `./` for sibling imports, following the existing project pattern.

## Completion and verification

- Add or update focused tests for changed behavior and important failure cases. Preserve existing regression tests.
- For code changes, run relevant tests and `npm run build`; the full test command is `npm test`. When a task changes user-visible chat or tool behavior, exercise the relevant flow in the browser against local Ollama when available. Report anything that could not be verified.
- Before each task-scoped commit, run `npm run check` and review the diff for correctness, unintended changes, secrets, and generated artifacts. Stop any local server started for verification when finished.
- Report what changed, verification results, and any remaining limitations. Do not claim a task is complete if its requested acceptance criteria have not been met.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
