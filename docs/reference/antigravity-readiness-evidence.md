# Antigravity readiness: what the transcripts show

`findAntigravityReadyPromptIndex` in `src/main/runtime/terminal-wait-detection.ts` decides whether
an Antigravity pane is ready for a prompt. It has been written five times, each version tuned
against a five-line screen typed from memory into a `.spec.ts` fixture. Three of the first four
were found worse than the bug they replaced, and the fifth was reverted.

Real transcripts now exist. They were recorded from a live `agy` on macOS with
[`agent-pty-transcript-capture.md`](./agent-pty-transcript-capture.md) and are committed under
`src/main/runtime/__fixtures__/`. `src/main/runtime/antigravity-readiness-transcripts.test.ts`
replays them through the runtime.

**Headline: on real output the first five detectors were inverted.** They refused a genuinely ready
screen and accepted a live model picker. All five argued about which extra condition to add; none
had noticed that the condition they all shared — a line beginning with the model name — never
matches a real Antigravity ready screen at all.

Attempt six, described in the last section, reads none of the identity, model or banner text. It
asks only where the caret row sits relative to the composer's rule and to the end of the tail.

## Versions

| Thing                     | Value                         |
| ------------------------- | ----------------------------- |
| `agy --version`           | `1.1.25`                      |
| Banner printed by the TUI | `Antigravity CLI 1.2.0`       |
| Captured                  | 2026-09-10, macOS, 120x40 PTY |

The binary and its own banner disagree. Any rule keyed to a version string must read the banner,
not `--version`, and must tolerate the two disagreeing.

## What the captures are

| Fixture                                      | What it is                                               |
| -------------------------------------------- | -------------------------------------------------------- |
| `antigravity-ready-api-key-gemini-model.txt` | Ready screen, API-key identity, Gemini 3.7 Flash (Low)   |
| `antigravity-ready-account-info-hidden.txt`  | The same ready screen with `AGY_CLI_HIDE_ACCOUNT_INFO=1` |
| `antigravity-dialog-trust-workspace.txt`     | Workspace trust dialog, live and unanswered              |
| `antigravity-dialog-model-picker.txt`        | `/model` picker, live and unanswered                     |
| `antigravity-dialog-command-palette.txt`     | Slash-command palette, live and unanswered               |
| `antigravity-dialog-dismissed.txt`           | `/model` picker dismissed with esc, then settled         |

## What could not be captured, and why

Nothing below was faked. Each is a case the recorder could not reach without changing the
operator's account state or configuration, which is out of bounds.

| Missing                                     | Why                                                                                                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `antigravity-ready-business-non-gemini.txt` | This machine has no OAuth session — the CLI prints _"You are currently not signed in"_ and authenticates from `GEMINI_API_KEY`. Reaching a Business ready screen means signing someone in. |
| A non-Gemini model on any ready screen      | `agy models` offers 11 models, all Gemini, and `settings.json` pins `modelProvider: gemini`. A non-Gemini row is not reachable from this account.                                          |
| `antigravity-dialog-sign-in.txt`            | Unsetting `GEMINI_API_KEY` does not reach the sign-in dialog; the CLI refuses to start because `modelProvider` is pinned. Reaching it means editing the operator's `settings.json`.        |
| `antigravity-dialog-theme-picker.txt`       | There is no `/theme` command in 1.2.0 (`Unknown command: /theme`). The picker appears only in first-run onboarding, which means deleting the operator's config.                            |
| `antigravity-dialog-privacy-notice.txt`     | First-run onboarding, as above.                                                                                                                                                            |
| `antigravity-dialog-update-banner.txt`      | Cannot be forced; no update was pending during the session.                                                                                                                                |

Each remains as a named, skipping case in the suite so it is visible rather than forgotten.

## What the transcripts show

### 1. The ready screen's model row is not at the start of a line

The ready screen prints a block-glyph logo down the left, and the identity, model and path rows are
painted **on the same physical lines as the logo**. What Orca derives is:

```
▀▀▀▀▀▀       Gemini API key
▀▀▀▀▀▀▀▀      Gemini 3.7 Flash (Low)
▄▀▀    ▀▀▄     ~
```

The detector requires `normalized.startsWith('gemini', trimmedStart)` on a trimmed line. The
trimmed line starts with `▀`. It never matches. Measured three ways on the real screen:

| Input                                                  | `isKnownReadyPromptPreview` |
| ------------------------------------------------------ | --------------------------- |
| Real ready screen                                      | `false`                     |
| The same screen with the logo glyphs stripped          | `true`                      |
| Real ready screen followed by the live `/model` picker | `true`                      |

So the logo — decoration, and suppressible with `AGY_CLI_HIDE_LOGO` — is what decides readiness
today, and the live dialog is what supplies the model line the ready screen could not.

### 2. The dialog is what satisfies the model rule

`/model` prints its options one per line:

```
Gemini 3.8 Flash
> Gemini 3.7 Flash (current)
Gemini 3.1 Pro
```

Those lines _do_ begin with `Gemini`, and a bare `>` composer line sits earlier in the same tail
from before the picker opened. Both halves of the rule are satisfied **while a dialog owns the
screen**, and the pane reads ready. This is the false-ready hazard the last three attempts were
each trying to close, reproduced from a real capture.

### 3. `>` is the dialog selection marker, not only the composer caret

Every dialog uses `>` to mark the highlighted row: `> Yes, I trust this folder`,
`> Gemini 3.7 Flash (current)`, `> /add-dir`. The idle composer is a line whose whole trimmed
content is `>`. That distinction is the only thing separating them, which means the relaxation
proposed in PRs #15840 and #15852 — accept any line _beginning_ with `>` — would make the trust
dialog and the model picker read as ready. On 1.2.0 the idle composer is a bare `>`; those PRs'
1.1.17 mode-banner claim could not be reproduced here and may be mode-specific.

**A bare `>` on its own is not sufficient either, and an earlier draft of this document was wrong
to say it was.** `/model` is drawn in place _below_ the composer, so the empty composer's own bare
`>` is still on the screen — and still in the derived tail — while the picker owns it:

```
────────────────────────── (120 cols)
>                            ← the composer, idle and bare, under a live dialog
Switch Model
  Gemini 3.8 Flash
> Gemini 3.7 Flash (current)
```

Presence of a bare `>` anywhere in the tail is therefore satisfied by
`antigravity-dialog-model-picker.txt`. What separates the two is **position**: on a ready screen
nothing follows the caret row, and on every in-place dialog the dialog's rows do.

### 4. There is no email account row, and the row can be switched off entirely

For an API-key user the identity row reads literally `Gemini API key`. There is no `@`, no
domain, nothing an account-row rule can key on. Separately, `AGY_CLI_HIDE_ACCOUNT_INFO=1` — a
supported environment variable in the binary — removes the row from a fully ready screen, which
`antigravity-ready-account-info-hidden.txt` captures.

### 5. Dialogs are drawn two different ways, and the banner is never reprinted

The trust dialog and the sign-in splash take the **alternate screen** (`ESC[?1049h` … `ESC[?1049l`).
The model picker and command palette are drawn **in place on the main screen** with erase-to-EOL.
After dismissal the CLI prints `⎿ Exited /model command` and redraws the composer — it does **not**
reprint the banner. The header stays where it was at startup.

### 6. Rows are positioned with cursor addressing, not newlines

The status row is written with absolute and relative moves (`ESC[13;99H`, `ESC[83X ESC[83C`), so
`? for shortcuts` and `Gemini 3.7 Flash · low` end up on one derived line. Any rule that assumes
one screen row equals one `\n`-delimited line is reading a different document than the user sees.

### 7. The composer is a framed box, and dialogs are drawn under it

Replaying each transcript through the main-process headless emulator at the grid it was recorded
on (120x40, from the `.meta.json`) gives the screen the operator saw. Every main-screen capture
has the same bottom structure:

| Fixture               | rule                 | caret row | rule | what follows                       |
| --------------------- | -------------------- | --------- | ---- | ---------------------------------- |
| ready, API key        | `─`x120              | `>`       | ✓    | status row only                    |
| ready, account hidden | `─`x120              | `>`       | ✓    | status row only                    |
| dismissed `/model`    | `─`x120              | `>`       | ✓    | status row only                    |
| `/model` picker       | `─`x120              | `>`       | ✓    | 9 dialog rows, then the status row |
| command palette       | `─`x120              | `> /`     | ✓    | 7 dialog rows, then the status row |
| trust dialog          | — (alternate screen) | —         | —    | —                                  |

So on the screen the discriminator is "the composer box is the bottom structure", and on the
derived tail — which keeps the opening rule and the caret row but loses the closing rule and the
cursor-addressed status row — the same fact reads as **"the last line with content is a bare `>`,
and the line above it is the composer's rule."** That is the rule attempt six ships.

### 8. Every committed transcript ends with the CLI tearing itself down

The recorder had to stop `agy` to end each capture, and `agy` restores the terminal on the way
out. Every fixture ends with `ESC[>4m ESC[=0;1u` (keyboard-mode restore) followed by cursor moves
and `ESC[J`, or `ESC[?1049l`, and `antigravity-dialog-dismissed.txt` also prints a
`Resume with -c (or command below):` footer.

Those bytes are not a screen Orca's detector ever sees on a pane it is waiting on, and they erase
rows the screen is being judged on — the ready fixture's own status row does not survive them.
`antigravity-readiness-transcripts.test.ts` therefore replays each transcript up to that marker
and asserts the marker is present, so the cut can never silently become a no-op. The full bytes
are replayed in one extra case, which pins that a pane whose `agy` has already exited is refused.

## Confirmed / refuted, by attempt

Evidence column names the fixture; all quoted text is from the committed transcripts.

### Attempt 1 — the rule at HEAD

| #    | Claim                                                    | Verdict                     | Evidence                                                                                                                                                 |
| ---- | -------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1  | A ready screen prints the banner `Antigravity CLI`       | **Confirmed**               | `Antigravity CLI 1.2.0` in both ready fixtures                                                                                                           |
| 1.1b | …and its last occurrence in the tail is the live one     | **Refuted**                 | The trust dialog's own body says _"Antigravity CLI requires permission to read, edit, and execute files here"_, so `lastIndexOf` lands inside the dialog |
| 1.2  | The model row begins with the vendor word `Gemini`       | **Refuted**                 | `▀▀▀▀▀▀▀▀      Gemini 3.7 Flash (Low)` — the logo precedes it; never at line start                                                                       |
| 1.3  | The caret line's whole trimmed content is `>`            | **Confirmed** on 1.2.0 idle | bare `>` in both ready fixtures                                                                                                                          |
| 1.3b | …and only the composer prints `>`                        | **Refuted**                 | `> Yes, I trust this folder`, `> Gemini 3.7 Flash (current)`, `> /add-dir`                                                                               |
| 1.4  | A ready screen prints the workspace path on its own line | **Refuted**                 | the path shares its line with logo glyphs (`▄▀▀    ▀▀▄     ~`)                                                                                           |

### Attempt 2 (loop 1) — blacklist the model line

| #   | Claim                                      | Verdict     | Evidence                                                                                                         |
| --- | ------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| 2.1 | Dialog model-row wording is enumerable     | **Refuted** | the palette lists 50+ commands with free-form descriptions; the picker prints whatever models the account offers |
| 2.2 | A dialog never reproduces a real model row | **Refuted** | the `/model` picker prints four real model rows, one per line, at line start                                     |

### Attempt 3 (loop 2) — structural ordering on `headerIndex`

| #   | Claim                                              | Verdict                            | Evidence                                                                                             |
| --- | -------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 3.1 | A live dialog is printed below the ready chrome    | **Confirmed** for in-place dialogs | picker and palette append below the composer                                                         |
| 3.2 | The banner is reprinted when a dialog is dismissed | **Refuted**                        | `antigravity-dialog-dismissed.txt` shows `⎿ Exited /model command` and a redrawn composer, no banner |
| 3.3 | Antigravity does not use the alternate screen      | **Refuted**                        | `ESC[?1049h` opens the trust dialog and the sign-in splash                                           |
| 3.4 | No full repaint per keystroke                      | **Partly refuted**                 | typing `/mod` repaints the palette region on each keystroke with `ESC[K`                             |

Because of 3.2, `headerIndex` cannot be the anchor: it never advances. Ordering can only be
expressed against the model/caret positions, which is what 1.2 and 1.3b just invalidated.

### Attempt 4 (loop 3) — require a positive account row

| #   | Claim                                                | Verdict                | Evidence                                                                                                                    |
| --- | ---------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | Every ready screen prints an account row             | **Refuted, twice**     | API-key identity prints `Gemini API key` (no `@`); `AGY_CLI_HIDE_ACCOUNT_INFO=1` removes the row entirely                   |
| 4.2 | A startup dialog never contains an `@`-and-`.` token | **Not reachable here** | none of the captured dialogs contains one, but the palette shows free-form skill descriptions, which are user-authored text |
| 4.3 | The account row is distinguishable from prose        | **Refuted**            | the row is not a distinct line; it shares one with the logo                                                                 |

### Attempt 5 (PR #19749, reverted) — ordering + account row

| #   | Claim                                                    | Verdict     | Evidence                                                                                                                                                                                           |
| --- | -------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | Ordering plus an account row separates ready from dialog | **Refuted** | the account row is optional (4.1) and the ordering anchor never moves (3.2)                                                                                                                        |
| 5.2 | Executing both builds was sufficient verification        | **Refuted** | the executed input was the hand-written fixture, so the check reproduced the fixture's assumptions. The real screen disagrees with that fixture on the model row, the path row and the account row |
| 5.3 | The wedge is a model-name problem                        | **Refuted** | it is a line-start problem. Even `Gemini 3.7 Flash (Low)` — a Gemini model — fails, because a logo glyph precedes it                                                                               |

### Cross-cutting

| #   | Question                                                   | Answer                                                                                                                          |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| X1  | Does `agy` set an OSC title distinguishing busy from idle? | **No.** Not one OSC title sequence appears in any capture. Title-based readiness is unavailable for this agent                  |
| X2  | Does it repaint with bare `\r`?                            | **Yes**, constantly, plus `ESC[K` and absolute cursor moves                                                                     |
| X3  | Does the caret survive in the tail?                        | **Yes** — a bare `>` line is present in every ready capture, and in the `/model` picker's too (§3)                              |
| X4  | Banner-to-caret distance                                   | ~8 derived lines on a 120x40 PTY; the banner falls outside the 6-line preview window, so only the full retained tail can see it |
| X5  | Pane title on the trust screen versus ready                | Identical: none                                                                                                                 |

## Attempt six, and what each of its rules is standing on

`findAntigravityReadyPromptIndex` now has three clauses and nothing else. Each one names the
transcript that forces it.

| Clause                                          | Why                                                                                    | Fixture                                                                                 |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| the tail contains `antigravity cli` _anywhere_  | only a gate, so the rule cannot fire on Codex/Cursor panes                             | both ready fixtures; `lastIndexOf` refuted by the trust dialog's own body text (§1.1b)  |
| the last line with content trims to exactly `>` | dialogs paint their rows under the composer, so the caret stops ending the tail        | ready fixtures end on `>`; picker ends `G`, palette ends `> /`, trust ends its nav hint |
| the line above it is a run of ≥8 `─`            | `>` alone also marks a dialog's selected row, and can end a model's own prose mid-turn | the composer rule is directly above the caret in all three ready-shaped captures        |

Dropped, each because a transcript refuted it: the **model row** (§1 — the logo shares that line,
so it never starts one, and the `/model` picker supplies the rows the ready screen could not), the
**account row** (§4 — `Gemini API key` has no `@`, and `AGY_CLI_HIDE_ACCOUNT_INFO=1` deletes the
row), and the **`headerIndex` anchor** (§5 — the banner is printed once and never reprinted).

The blocked-signal path is left alone: it already refuses `antigravity-dialog-trust-workspace.txt`
on wording, and it is the only thing that names a reason for the refusal.

### What it fails safe on, and how

Four screens could not be captured, plus two composer modes. In every one of them the rule
reports **not ready**, which stalls a `tui-idle` wait rather than typing into a live dialog:

| Unknown                               | Behaviour                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Business/OAuth ready screen           | Ready, and correctly so — the rule reads no identity at all, so the account type cannot change the verdict                |
| Non-Gemini model row                  | Ready, same reason: no model text is read                                                                                 |
| Sign-in dialog                        | Not ready, _unless_ it happens to end on a rule + bare `>`. Drawn on the alternate screen (§5), which has no composer     |
| Theme / privacy / update banner       | Not ready: a banner owning the screen puts rows under the composer                                                        |
| Accept-edits and plan mode            | Not ready: PRs #15840/#15852 describe a mode banner on the composer row, which is not a bare `>`. A wedge, not a mis-send |
| A busy agent whose output ends on `>` | Not ready: prose would have to end with a lone `>` directly under a ≥8-glyph `─` rule                                     |

The two that cost a wedge — the mode banners, and any 1.1.x that does not draw the composer box —
are the price of the asymmetry: a false negative stalls one wait, a false positive types a user's
prompt into a live dialog.

### Why this is still not the emulator, and what it would take

The durable fix is to ask an emulator what the bottom of the screen is. That was evaluated first
and is not reachable from the readiness path as it stands:

- `isKnownReadyPromptPreview` is a pure string predicate called from six sites
  (`runtime-terminal-wait`, `runtime-terminal-idle-polls`, `runtime-terminal-agent-presence`,
  `orca-runtime-stop-structured-session-process`, and the visible-read probe), all on the derived
  tail, and most of them synchronously.
- The main process _does_ keep a live per-PTY emulator (`headlessTerminals`, fed by
  `trackHeadlessTerminalData` on every chunk), and `readHeadlessVisibleTerminalState` projects it
  through `projectTerminalVisibleLines`. But the one readiness call site wired to it,
  `startTuiIdleVisibleReadProbe`, only runs when the tail is **empty** — never for an Antigravity
  pane that has printed a banner.
- For PTYs in `providerSnapshotPreferredPtys` (restored panes, and remote sessions where main holds
  only a suffix) the authoritative screen needs a provider RPC, so the emulator is not uniformly
  available and a per-poll screen read is not free.

Moving readiness onto the screen therefore means threading a `ptyId`-or-projection through those
six call sites, giving the idle poll an async hop, and deciding the provider-snapshot lane's
budget — a change to every agent's readiness, not just Antigravity's. Worth doing; too wide to
ride along with a detector fix that has already been wrong five times.

It is worth noting what it would buy, because it is narrower than it sounds: the emulator supplies
a **clean, correctly-ordered screen**, but not a verdict. The predicate above still has to be
written, and against these same six fixtures the screen version ("the composer box is the bottom
structure") and the tail version ("the caret row ends the tail, under its rule") agree on all six.
The one thing only the emulator can add is knowing a pane is on the **alternate screen**, which is
where the trust and sign-in dialogs live — the single unknown this rule cannot reason about.
