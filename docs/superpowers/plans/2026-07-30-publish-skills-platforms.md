# Publish Skills to Major Platforms — Implementation Plan

> **Execution note:** Follow this plan task by task. Verify every external state before updating documentation or reporting a platform as live.

**Goal:** Publish the five Skills in `dengshangli/skills` through generic Agent Skills discovery and the Claude Code, Cursor, and ClawHub marketplaces, with accurate install instructions and platform status.

**Architecture:** Keep each existing Skill directory as the canonical, cross-agent package. Add repository-wide licensing and lightweight platform manifests around the existing `SKILL.md` files; do not restructure or rewrite the workflows. Treat repository preparation, submission, and public searchability as separate states so delayed marketplace review is represented accurately.

**Tooling:** Git/GitHub CLI, Node.js 24 bundled with Codex, `skills` CLI, JSON/YAML validation, Claude Code plugin validator, Cursor marketplace schema, ClawHub CLI.

---

## Task 1: Establish the MIT license across the repository

**Files:**

- Create: `LICENSE`
- Modify: `figma-overlay-check/SKILL.md`
- Modify: `wukong-email-template-generator/SKILL.md`
- Modify: `email-template-compatibility-test/SKILL.md`
- Modify: `jingdouyun-email-template-replacement/SKILL.md`
- Modify: `crm-email-manual-send/SKILL.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: each Skill's `README.md`
- Modify: each Skill's `README.zh-CN.md`

### Step 1: Record the expected pre-change failure

Run:

```bash
test -f LICENSE
for file in */SKILL.md; do
  grep -q '^license: MIT$' "$file" || echo "missing license: $file"
done
```

Expected: root `LICENSE` is missing and all five Skill files are reported as missing the MIT frontmatter field.

### Step 2: Add the root MIT license

Create the standard MIT License text with:

- copyright year: `2026`
- copyright holder: `dengshangli`

Keep `figma-overlay-check/LICENSE` as its existing directory-level MIT copy.

### Step 3: Add `license: MIT` to every Skill

Add the field to the YAML frontmatter of each of the five `SKILL.md` files. Do not modify the execution instructions, scripts, environment requirements, or authorization boundaries.

### Step 4: Correct all bilingual license statements

Update the English and Chinese root READMEs and the ten Skill READMEs so they state that the repository is MIT-licensed and link to the nearest valid license file.

### Step 5: Verify the license change

Run:

```bash
test -f LICENSE
for file in */SKILL.md; do
  grep -q '^license: MIT$' "$file"
done
git diff --check
```

Expected: every command exits successfully.

### Step 6: Commit

```bash
git add LICENSE README.md README.zh-CN.md \
  figma-overlay-check wukong-email-template-generator \
  email-template-compatibility-test \
  jingdouyun-email-template-replacement crm-email-manual-send
git commit -m "License skills under MIT"
```

---

## Task 2: Validate all five packages against the Agent Skills specification

**Files:**

- Create if needed: `scripts/validate-skills.sh`
- Test: all five `SKILL.md` files and their referenced local paths

### Step 1: Try the official validator

Using the bundled Node.js 24 runtime, check whether the current official `skills-ref` validator is available. Run it against all five Skill directories if available.

Do not install into the user's global Node.js environment. Use `npx`, a virtual environment, or another disposable environment.

### Step 2: Add an auditable fallback validator only if required

If the official validator is unavailable or cannot cover repository-wide checks, add `scripts/validate-skills.sh` that fails unless:

- every target directory contains `SKILL.md`;
- `name` exactly matches the directory name;
- `name` contains only lowercase letters, numbers, and single hyphens;
- `name` is at most 64 characters;
- `description` is present and at most 1024 characters;
- `license` is exactly `MIT`;
- YAML frontmatter is parseable;
- referenced repository-local scripts and resource paths exist.

The script must list the five expected Skill directories explicitly so unrelated directories are not treated as packages.

### Step 3: Run validation

Run the official validator and, if created, the repository validator.

Expected: all five Skills pass. Fix only packaging defects; do not change workflow behavior.

### Step 4: Verify clean formatting

Run:

```bash
git diff --check
```

### Step 5: Commit if a repository validator was added

```bash
git add scripts/validate-skills.sh
git commit -m "Add Agent Skills validation"
```

If no file was added, record the validator command and result for the final evidence report without creating an empty commit.

---

## Task 3: Add Claude Code plugin and marketplace manifests

**Files:**

- Create: `.claude-plugin/marketplace.json`
- Create: `figma-overlay-check/.claude-plugin/plugin.json`
- Create: `wukong-email-template-generator/.claude-plugin/plugin.json`
- Create: `email-template-compatibility-test/.claude-plugin/plugin.json`
- Create: `jingdouyun-email-template-replacement/.claude-plugin/plugin.json`
- Create: `crm-email-manual-send/.claude-plugin/plugin.json`

### Step 1: Add one plugin manifest per Skill

Use the Skill directory itself as the plugin root so Claude Code discovers its root `SKILL.md`.

Each `plugin.json` must contain:

- the exact Skill name;
- a concise English description consistent with `SKILL.md`;
- version `1.0.0`;
- author name `dengshangli`;
- repository and Skill-specific homepage URLs;
- `license: MIT`;
- focused discovery keywords;
- a fitting category and tags.

Do not duplicate the Skill body in the manifest and do not add credentials or private endpoints.

### Step 2: Add the repository marketplace manifest

Create `.claude-plugin/marketplace.json` with repository owner metadata and five plugin entries. Each entry must point to its corresponding relative Skill directory and must not point to the deleted `dengshangli/figma-overlay-check` repository.

### Step 3: Perform structural validation

Run:

```bash
jq empty .claude-plugin/marketplace.json
find . -path '*/.claude-plugin/plugin.json' -print0 | xargs -0 -n1 jq empty
```

Also verify:

- five unique plugin names;
- five existing relative source directories;
- each source contains `SKILL.md`;
- every version is `1.0.0`;
- every license is `MIT`.

### Step 4: Run the official Claude validator

If `claude` is absent, install the official Claude Code CLI using the current official installation path in a user-approved location that does not replace system Node.js. Then run:

```bash
claude plugin validate .
```

Run additional per-plugin validation if the CLI requires each plugin root separately.

If installation or validation requires account login, mark validation `blocked` and continue with the independent repository work.

### Step 5: Commit

```bash
git add .claude-plugin */.claude-plugin
git commit -m "Add Claude Code marketplace manifests"
```

---

## Task 4: Add Cursor plugin and marketplace manifests

**Files:**

- Create: `.cursor-plugin/marketplace.json`
- Create: `figma-overlay-check/.cursor-plugin/plugin.json`
- Create: `wukong-email-template-generator/.cursor-plugin/plugin.json`
- Create: `email-template-compatibility-test/.cursor-plugin/plugin.json`
- Create: `jingdouyun-email-template-replacement/.cursor-plugin/plugin.json`
- Create: `crm-email-manual-send/.cursor-plugin/plugin.json`

### Step 1: Add one Cursor plugin manifest per Skill

Use the same identity, version, author, URLs, license, and discovery vocabulary as the Claude manifests where the Cursor schema supports them. Keep the root `SKILL.md` as the single Skill component.

### Step 2: Add the repository marketplace manifest

Create `.cursor-plugin/marketplace.json` with five entries whose relative sources resolve to the existing Skill directories.

### Step 3: Validate against the current Cursor schema

Validate:

- JSON syntax;
- required fields and accepted types;
- unique names;
- valid relative sources;
- discoverable root `SKILL.md`;
- version `1.0.0`;
- MIT licensing.

Use Cursor's official validator if one is exposed by the installed CLI. If the CLI has no validation command, use the published schema plus explicit path and uniqueness checks, and record that limitation.

### Step 4: Commit

```bash
git add .cursor-plugin */.cursor-plugin
git commit -m "Add Cursor marketplace manifests"
```

---

## Task 5: Improve GitHub search metadata

**External state:**

- Repository: `dengshangli/skills`

### Step 1: Verify current repository identity

Run:

```bash
gh repo view dengshangli/skills \
  --json nameWithOwner,isPrivate,defaultBranchRef,description,homepageUrl,repositoryTopics
```

Expected: repository is public and the default branch is `master`.

### Step 2: Set description and topics

Set the description to:

```text
Cross-agent skills for visual QA and email automation workflows
```

Set these topics:

```text
agent-skills ai-agents skills claude-code cursor codex opencode openclaw figma email-automation
```

Do not set the skills.sh homepage until the new monorepo page is confirmed live.

### Step 3: Read back and verify

Repeat the `gh repo view` command and compare the exact description, visibility, default branch, and topic set.

Record GitHub as `live` only after the public repository page returns successfully.

---

## Task 6: Push the prepared package state to `master`

### Step 1: Run the full pre-push verification

Run:

```bash
git status --short
git diff --check master...HEAD
```

Then run:

- all Agent Skills validators;
- all Claude manifest checks;
- all Cursor manifest checks;
- a secret scan over committed diffs for tokens, cookies, device codes, and local credential material.

### Step 2: Review commits

Run:

```bash
git log --oneline master..HEAD
```

Confirm the branch contains only the approved publishing design and implementation.

### Step 3: Push directly to `master`

Because the user explicitly requested direct integration into `master`, push the verified branch tip:

```bash
git push origin HEAD:master
```

### Step 4: Verify the remote commit

Run:

```bash
git ls-remote origin refs/heads/master
git rev-parse HEAD
```

Expected: both hashes match.

---

## Task 7: Trigger and verify skills.sh indexing

**Runtime:**

- Node.js: `/Users/dengshangli/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`
- Package: current `skills` CLI

### Step 1: Create an isolated installation test

Create a system temporary directory with `mktemp -d`. Prepend the bundled Node.js directory to `PATH` only for this command.

From the temporary project, install all five Skills from the public GitHub repository into the isolated `universal` agent target using the current non-interactive `skills` CLI. Keep normal CLI telemetry enabled because these are genuine installs.

Do not use or modify:

- `~/.agents/skills`;
- `~/.codex/skills`;
- any existing Claude, Cursor, Codex, OpenCode, or OpenClaw Skill directory.

### Step 2: Verify the isolated install

Confirm that the temporary target contains exactly the five requested Skill directories and that each contains the expected `SKILL.md`.

Run a smoke validation against the installed copies.

### Step 3: Remove only the exact temporary directory

Resolve and print the temporary directory path, verify it is under the system temporary root, then delete that exact directory.

### Step 4: Poll skills.sh discovery

For each Skill, query the public skills.sh search API by owner `dengshangli` and a specific keyword until:

- `source` equals `dengshangli/skills`;
- `skillId` equals the Skill directory name;
- its public detail URL responds.

Use bounded retries and record timestamps. If indexing is still delayed, mark each item `pending_review`; do not fabricate additional telemetry.

### Step 5: Handle the stale Figma entry

If `dengshangli/figma-overlay-check` remains searchable after the new monorepo entry appears, collect:

- the stale search result;
- evidence that the old repository no longer exists;
- the new canonical source and URL.

Search existing issues in `vercel-labs/skills`. If no matching issue exists, open one requesting stale-source removal. Record the issue URL.

### Step 6: Set the GitHub homepage only after verification

Once `https://skills.sh/dengshangli/skills` is confirmed live, set it as the GitHub repository homepage and read it back with `gh repo view`.

---

## Task 8: Submit the five plugins to Claude Code Community Marketplace

**External workflow:**

- Submission page: `https://platform.claude.com/plugins/submit`

### Step 1: Re-run validation against the pushed commit

Clone or fetch the public `master` state into a temporary directory and run `claude plugin validate` against the marketplace and all five plugin roots.

This verifies that submission uses public files, not unpushed local state.

### Step 2: Test the self-hosted marketplace path

Using an isolated Claude configuration if supported, add `dengshangli/skills` as a marketplace and verify that the five plugin names are discoverable and individually installable.

Do not alter the user's normal Claude plugin configuration without explicit approval.

### Step 3: Submit each plugin

Submit all five public plugin definitions to the Community Marketplace. Reuse the repository metadata and exact version `1.0.0`.

If the page requires login, organization selection, acceptance of terms, CAPTCHA, or a final human confirmation:

- leave the browser at that step;
- tell the user exactly what action is required;
- resume after confirmation.

### Step 4: Record status

For each plugin:

- `submitted` after the form is accepted;
- `pending_review` while absent from the public catalog;
- `live` only after a public Marketplace search and detail page verify it.

Capture only public submission IDs or URLs. Never store session cookies or tokens.

---

## Task 9: Submit the five plugins to Cursor Marketplace

**External workflow:**

- Submission page: `https://cursor.com/marketplace/publish`

### Step 1: Re-run validation against public `master`

Validate all Cursor manifests from a fresh copy of the pushed commit.

### Step 2: Submit each plugin

Publish the five independent plugins using their exact manifest metadata and version `1.0.0`.

If login, terms, CAPTCHA, account choice, or final confirmation is required, pause at that boundary and request the user's interaction.

### Step 3: Record status

For each plugin:

- `submitted` when Cursor accepts the submission;
- `pending_review` during manual review;
- `live` only when a public Marketplace search and detail page succeed.

Do not publish the repository bundle as a sixth plugin.

---

## Task 10: Publish all five Skills to ClawHub

### Step 1: Run the official CLI without a global install where possible

Use the bundled Node.js 24 runtime and a pinned or current official `clawhub` CLI through `npx`/`npm exec`. Verify the CLI package and version before authentication.

### Step 2: Authenticate and verify the publisher

Run the official login flow, then `whoami` or its equivalent. The user must complete browser authentication or device confirmation.

Record the returned public publisher handle. Do not assume it is `dengshangli`.

### Step 3: Validate all packages

For each Skill directory, run the CLI's dry-run, validation, or package inspection command. Confirm:

- slug equals the Skill directory name;
- version is `1.0.0`;
- display name is human-readable;
- MIT license is included;
- packaged paths contain no credentials or unrelated repository files.

### Step 4: Publish each Skill

Publish all five with changelog:

```text
Initial release from dengshangli/skills
```

Do not auto-increment or republish if a slug already exists. Inspect ownership and version state first.

### Step 5: Verify security and search status

For each Skill:

- `submitted` after the registry accepts the upload;
- `pending_review` while security review is incomplete;
- `live` only when the public detail page and registry search both succeed;
- `blocked` with the exact public reason if account-age, ownership, moderation, or authentication prevents publishing.

---

## Task 11: Add verified platform links and status to documentation

**Files:**

- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: each Skill's `README.md`
- Modify: each Skill's `README.zh-CN.md`

### Step 1: Build the verified link table

Create an in-memory status table for every Skill across:

- GitHub / direct `skills` CLI install;
- skills.sh;
- Claude Code Community Marketplace;
- Cursor Marketplace;
- ClawHub.

Only include URLs that have been opened and verified. Represent non-live platforms as plain status text such as `Pending review`; do not invent predictable URLs.

### Step 2: Update the root bilingual READMEs

Keep the root README concise:

- one-line purpose per Skill;
- repository-wide install commands;
- a compact platform availability table;
- links to the per-Skill READMEs;
- MIT license statement.

Document both whole-repository and single-Skill installation with commands that were actually tested.

### Step 3: Update each Skill's bilingual READMEs

Put detailed purpose, prerequisites, usage, permissions, and verified platform-specific installation links in the Skill directory.

Keep English in `README.md` and Chinese in `README.zh-CN.md`.

### Step 4: Validate documentation

Run:

```bash
git diff --check
```

Check that:

- all relative links resolve;
- all public URLs return successfully;
- all commands use `dengshangli/skills`;
- no README references the deleted standalone Figma repository as the canonical source;
- English and Chinese status tables agree.

### Step 5: Commit and push documentation

```bash
git add README.md README.zh-CN.md \
  */README.md */README.zh-CN.md
git commit -m "Document Skill marketplace availability"
git push origin HEAD:master
```

Verify the remote `master` hash again.

---

## Task 12: Final end-to-end verification and handoff

### Step 1: Verify the repository

Confirm:

- public visibility;
- default branch `master`;
- root MIT license;
- five valid Skills;
- twelve bilingual README files;
- Claude and Cursor manifests;
- expected GitHub description, homepage, and topics;
- no unpushed publishing changes.

### Step 2: Re-test generic installation

In a new temporary directory, run:

- whole-repository install;
- one selected single-Skill install;
- `skills find` or the public search API for all five names.

Clean up only the verified temporary directory.

### Step 3: Produce the final status matrix

Report each Skill and platform using only:

- `not_started`;
- `prepared`;
- `submitted`;
- `pending_review`;
- `live`;
- `blocked`.

For every non-live entry, include the exact next event needed. For every live entry, include the public URL and the validation method.

### Step 4: Report sensitive-data checks

State that committed files and publishing artifacts were checked for tokens, cookies, device codes, and local credential material. Do not echo any secret values found during authentication.
