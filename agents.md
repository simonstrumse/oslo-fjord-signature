# Agent Guidelines

## Purpose
This document captures working agreements for any coding agent collaborating on the Oslo Fjord Signature project.

## Rules
1. Protect existing user assets (copy, media, layout inspiration) and confirm before removing or overwriting them.
2. When pulling inspirational text or media from partner sites, cite the source in comments or commit messages if reused verbatim.
3. Validate visual changes in a browser or emulator when feasible, noting any untested areas in the final report.
4. After making changes, format and lint any touched files if tooling is available.
5. **At the end of each change session, commit and push the updates to the GitHub repository so the latest work is always available.**

## Workflow Notes
- Default branch: `main`.
- Deployment target: Vercel (static export, build command `none`, output directory `.`).
- Primary entry point: `index.html`; global styles in `styles.css`.

