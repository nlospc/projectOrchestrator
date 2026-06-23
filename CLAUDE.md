# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

Use ECC-style workflow. Do not write code yet.

We are starting a new project from design phase.


## Architecture
The repo gonna develop a PMO Orchestrator platform for internal server deployment.

Goal:
- Data sources: Excel upload
- Project progress: project-level milestone timeline, planned vs actual dates, red/yellow/green status per milestone segment
- Resource view: people-to-project allocation board and table. function reference:@./R2-Workforce-Dashboard-offline-V14 which you could overview the from @./R2-Workforce-Dashboard-offline-V14/overview.md rather than read all code. keep this prototype code only if it is valid to reuse.
- Manual override: users can mark project health status
- Deployment: internal network server
- Priority: design first, implementation later

## Data structure
when you need to design data structure, you could find it from @./docs/data-sequences.md


## Implementation Workflow

Default execution model for all feature work in this repo:

### Roles
- **Claude (Orchestrator + Auditor):** owns spec writing, task decomposition, design (via Claude Design MCP), code review, metric verification, and gated commits. Claude hands Codex one scoped slice at a time.
- **Codex (Executor):** implements code changes via `/codex:rescue`. Receives a self-contained spec per slice — file paths, function signatures, formulas, and the visual contract. Does not make architectural decisions.

### Flow
1. **Spec & Design** — Claude writes metric/feature spec, generates hi-fi mock via Claude Design MCP, iterates until locked.
2. **Decompose** — Claude breaks the spec into Codex-sized slices (one file or concern per slice).
3. **Execute** — Claude delegates each slice to Codex via `/codex:rescue` with explicit instructions.
4. **Audit** — Claude reviews every Codex deliverable: `code-reviewer` agent, formula verification against `docs/data-sequences.md`, run app + screenshot via chrome-devtools, regression check.
5. **Gate** — Conventional commit only after audit passes. No batch commits.

### Rules
- Codex never touches more than one concern per slice.
- Claude never skips the audit step.
- If Codex output fails audit, Claude writes a fix spec and re-delegates (not manual edit).
- Design artifacts (Claude Design mock) are locked before any code slice begins.

## Export
- Ask questions only if a blocker exists.
- Otherwise make reasonable assumptions and mark them.
