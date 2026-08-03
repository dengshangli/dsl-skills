# Wukong Email Template Generator Plugin

A skills-only plugin for ChatGPT and Codex that creates complete WuKong-branded HTML emails using the bundled fixed shell and generator.

## Install from GitHub

Add this repository as a plugin marketplace, then install the plugin:

```bash
codex plugin marketplace add dengshangli/dsl-skills --ref master
codex plugin add wukong-email-template-generator@dsl-skills
```

Start a new ChatGPT or Codex conversation after installation so the bundled skill is loaded.

## What the plugin includes

- One focused `wukong-email-template-generator` skill.
- The fixed WuKong HTML shell.
- A deterministic Python generator and contract tests.
- No MCP server, external authentication, analytics, or network calls.

## Example prompts

- "Create a WuKong-branded course reminder email."
- "Generate a WuKong CRM follow-up email from this copy."
- "Build a WuKong newsletter using the standard email shell."

## Distribution

The repository marketplace lets other Codex users install the plugin directly from GitHub. Public discovery in the universal ChatGPT/Codex Plugins Directory requires a separate OpenAI review and publication.

## Policies

- [Privacy](./PRIVACY.md)
- [Terms](./TERMS.md)
- [MIT License](../../LICENSE)
