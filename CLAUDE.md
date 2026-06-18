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


## Export
- Ask questions only if a blocker exists.
- Otherwise make reasonable assumptions and mark them.
