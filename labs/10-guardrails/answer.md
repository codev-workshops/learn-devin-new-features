## Feature fit

Two Devin features answer the CISO, and they do different jobs:

- **Security Profiles** restrict what a session's machine can *do*: which hosts it reaches (network allowlist, enforced for shell, browser, package installs and scripts), which MCP servers it may use (a separate MCP allowlist), whether the Devin MCP is read-only (no creating sessions, no editing knowledge or playbooks), the git access level (`Read-only` or `Full`) and whether the GitHub CLI token is removed.
- **AI Guardrails** screen what *comes in*: user messages, follow-ups and PR comments, for prompt injection, data exfiltration and policy violations. Each category is set to Off, Log only, Warn user or Block message. Guardrails are an enterprise setting (Manage enterprise settings) and apply to every organization; they are not configured per organization.

"Floor vs default" in one line: a **mandatory** profile is the floor — it intersects with everything below it and opting out has no effect; a **recommended** profile is a default — anything more specific (organization, automation, session) may replace it, including with "no profile".

## The reference matrix

`solution/harbourline-guardrails.json`:

| Profile | Scope | Enforcement | Network | MCP | Devin MCP | Git | GitHub CLI token |
|---|---|---|---|---|---|---|---|
| `harbourline-floor` | enterprise | **mandatory** | `registry.npmjs.org`, `*.sandbox.paygate.example` | none allowed | (unset) | (unset) | removed |
| `harbourline-dev` | org | recommended | same two | (unset) | read/write | Full | (unset) |
| `harbourline-automation` | org | recommended | `registry.npmjs.org` | (unset) | read-only | Read-only | (unset) |

Bindings: enterprise default → `harbourline-floor`; organization default → `harbourline-dev`; automations default → `harbourline-automation`; `webhook-triage` automation → inherit; snapshot builds → inherit.

Why each choice:

- `*.sandbox.paygate.example` has a dot after the star, so `api.sandbox.paygate.example` and `webhooks.sandbox.paygate.example` match, and `evilsandbox.paygate.example` and production `api.paygate.example` do not.
- `api.github.com` is absent because the token is removed. Devin's own connected-repository integration still clones, pushes and opens PRs through the git proxy; only direct `gh`/API calls stop. Keeping the token would require Full git access **and** `api.github.com` in the network list.
- An empty MCP allowlist means no MCP server until the CISO approves one by name. MCP servers do not need to be in the network list; the two lists are independent.
- The floor leaves git and Devin MCP unset so the organization default can give people Full git; the automations default narrows both for robots.

Resolver output (`node labs/10-guardrails/solution/profile-resolve.mjs --world labs/10-guardrails/solution/harbourline-guardrails.json --check registry.npmjs.org,api.sandbox.paygate.example,pypi.org,files.pythonhosted.org --grant cdn.playwright.dev`), summarised:

| Target | Profiles in force | Winning level | Git | Devin MCP RO | Token | registry | PayGate sandbox | pypi | Note |
|---|---|---|---|---|---|---|---|---|---|
| `dev-session` | floor + dev | organization default | full | no | removed | yes | yes | no | — |
| `opt-out-session` | floor | session ("no profile") | full | no | removed | yes | yes | no | opt-out ignored: mandatory floor |
| `webhook-triage-run` | floor + automation | automations default | read-only | yes | removed | yes | **no** | no | — |
| `child-of-dev` | floor + dev | organization default | full | no | removed | yes | yes | no | governed by parent chain |
| `snapshot-build` | floor + dev | organization default | full | no | removed | yes | yes | **no** | — |

`pnpm --filter @harbourline/labs test` runs `solution/profile.test.mjs` (12 cases) over the same table.

## How resolution works

1. Walk the chain broad → specific: enterprise default, organization default, (automations default, the automation), session. Snapshot builds use enterprise default, organization default, then the snapshot-build binding.
2. The most specific level that does not say "inherit" wins. That can be a profile or "no profile".
3. Every **mandatory** profile at or above the winner stays in force. Restrictions intersect: network and MCP allowlists narrow (a host must be in every list), git takes the stricter level, Devin MCP is read-only if any profile says so, the token is removed if any profile removes it.
4. A child session is governed by the same chain as its parent; it does not get a level of its own.
5. A running session keeps what it resolved at its last boot or wake. Edits and new bindings apply to new sessions immediately and to an existing session when it wakes or reboots.

The resolver encodes exactly these five rules. Rule 4's handling of a child that *asks* for "no profile" (ignored) and the snapshot-build chain in rule 1 are this lab's reading of the documentation, which says children follow the parent's chain and that builds can have their own binding or be opted out; check both against the live product before you rely on them in front of an auditor.

## Injector answers

- **recommended-floor** — with `harbourline-floor` recommended, `opt-out-session` resolves to no profiles at all: every host reachable, token kept. `child-of-dev` drops to `harbourline-dev` only, which happens to match the CISO's list today but is one org-admin edit away from not doing so. One sentence: *recommended is a suggestion any lower level can replace; mandatory is the floor.*
- **mid-session-request** — approving the request adds `cdn.playwright.dev` to that session only. Under a mandatory floor that does not list the host, the grant is clamped: the session still cannot reach it. Fix at source instead: set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`, or ask the CISO to add the host to the floor.
- **floor-tightened** — the running session keeps `*.sandbox.paygate.example` (so `webhooks.sandbox.paygate.example` still works) until its next wake; after waking, and for every new session, only `api.sandbox.paygate.example` is in the floor. If the change is urgent, ask owners to put running sessions to sleep (or end them) so they re-resolve.
- **snapshot-build-python** — the build reaches the package registry (every one of the 1,163 remote packages in `pnpm-lock.yaml` resolves to `registry.npmjs.org`, and the two install scripts — `esbuild`, `msw` — fetch nothing else) but the blueprint's `pip install -e "services/fulfilment-worker[dev]"` needs `pypi.org` and `files.pythonhosted.org`. A snapshot-build binding cannot loosen a mandatory floor, so either the CISO adds those two hosts to the floor, or the build stops installing Python packages. That is the CISO's call; the change request names the two hosts and the one blueprint line.
- **gh-token-keep** — `harbourline-gh` keeps the token but its network list has no `api.github.com`; `harbourline-gh-readonly` keeps the token with Read-only git. The documentation makes both conditions a requirement for keeping the token, so expect neither to save. `--validate` exits 1 with one problem each.
- **broad-wildcard** — `registry.npmjs.org*` also matches `registry.npmjs.org.evil.example`; `*paygate.example` also matches `evil-paygate.example` and `evilpaygate.example`; `https://registry.npmjs.org/` is a URL, not a hostname (no scheme, port or path).
- **guardrail-messages** — message 1 is data exfiltration, message 2 (PR comment) is prompt injection, message 3 is ordinary work.

| Action | What the sender sees | Does Devin act on it | Where the security team sees it |
|---|---|---|---|
| Off | nothing | yes | nowhere |
| Log only | nothing | yes | violations list, audit log `ai_guardrail_violation`, guardrail violations API |
| Warn user | a warning | yes, after the warning | same as Log only |
| Block message | the message is blocked | no | same as Log only |

A sensible start: Log only for a week to see the volume, then Block message for exfiltration and prompt injection, Warn user for policy violations. Message 3 should not trigger anything; if it does at the chosen level, you have learned the cost of that level.

## Observer path (no admin)

You cannot edit profiles or guardrails, but you can still prove what governs you:

1. Run `labs/10-guardrails/solution/probe.sh` in a Devin session. Reference output from the session that built this lab (22 Oct 2026):
   `reachable registry.npmjs.org`, `blocked api.sandbox.paygate.example` (the fixture host does not exist, so this is DNS, not policy), `reachable pypi.org`, `reachable files.pythonhosted.org`, `reachable api.github.com`, `reachable example.com`. Reading: `example.com` is reachable, so no restrictive network profile governs that session yet.
2. Build your matrix offline and resolve it.
3. Hand the admin a change request: profiles to create (table above), bindings, the two Python hosts decision, the guardrail levels, and the timing note (running sessions keep the old profile until they wake).
4. After the admin applies it, start a **new** session and run the probe again: `example.com` should now be blocked.

## Worked prompts

Prompts belong here and only here. A session can help you write and check the matrix; it cannot change settings you lack rights to.

```prompt
In labs/10-guardrails, copy solution/harbourline-guardrails.json to ~/lab10/matrix.json. Add a target for an
automation called "refund-audit" that inherits the automations default, then run profile-resolve.mjs with
--validate and --check registry.npmjs.org,api.sandbox.paygate.example,example.com for every target.
Give me a table: target, profiles in force, winning level, git, Devin MCP read-only, token, and which
hosts are allowed. Do not edit anything under labs/ itself.
```

```prompt
Run labs/10-guardrails/solution/probe.sh in this session and tell me, in two sentences, what it says about
the security profile governing this session. Do not try to reach any other host.
```

```prompt
Write a one-page change request for our enterprise admin from ~/lab10/matrix.json: profiles to create with
every field, bindings per level, which ones are mandatory and why, the two hosts the Python install needs,
and when each change takes effect for running sessions, new sessions and snapshot builds.
```

## Pitfalls

- Putting MCP server hostnames into the network list "to be safe" — MCP access is its own allowlist.
- Leaving the floor recommended because it "works" today: it works only until someone below you opts out.
- Assuming a saved change protects a session that is already running.
- Granting a mid-session request and believing it widened a mandatory floor.
- Writing hosts with schemes, paths or dotless wildcards.
- Treating AI Guardrails as a network control: it screens messages, it does not stop a command reaching a host.

## Model answers to the objections

1. *"A profile is config — what stops a developer turning it off?"* — "You're right that it's a setting. The enterprise profile is **mandatory**, and only enterprise admins can edit or unbind it. Below that, organization admins, automations and sessions can only add restrictions: a session that picks 'no profile' still resolves to the floor, helper sessions follow the parent's chain, and a mid-session approval for a new host is clamped. Our resolver shows the opt-out session with exactly the floor's two hosts. I'll re-run it and send you the output after every profile change."
2. *"This will block legitimate pnpm installs."* — "It would if pnpm reached more than one place. All 1,163 remote packages in our lockfile resolve to `registry.npmjs.org`, and the two packages with install scripts fetch nothing else, so pnpm installs pass. The real break is two hosts for the Python worker in snapshot builds — `pypi.org` and `files.pythonhosted.org` — and I'd like your decision on those two. Anything else shows up as a blocked request we can review rather than a silent hole."

## Debrief

- Could you say "floor vs default" without the words mandatory or recommended?
- Which of your three timing answers surprised you most, and how would you tell a running team?
- What would you need from the live product to remove the two caveats in "How resolution works"?
- Which guardrail level would you pick on day one, and what evidence would make you change it?
