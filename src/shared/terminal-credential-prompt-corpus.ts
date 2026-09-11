// Two-sided corpus for the credential-prompt write guard, shared by the shared-detector
// suite, the main-process wait-vocabulary suite and the renderer paste-lane suite. One corpus
// keeps the three lanes provably in agreement: a screen that blocks a PTY write must block a
// renderer paste, and a legitimate agent screen must block neither.

export type TerminalCredentialPromptCase = readonly [name: string, lines: string[]]

export const LIVE_CREDENTIAL_SURFACES: readonly TerminalCredentialPromptCase[] = [
  [
    'antigravity device-code sign-in drawn over ready chrome (#19749)',
    [
      'Antigravity CLI',
      'gemini 3 pro (high)',
      '~/orca/workspaces/orca/crash-closer',
      '>',
      '',
      '  Sign in to Antigravity',
      '  Open https://antigravity.google/device and enter the code: KXTD-9PQR',
      '  Waiting for authentication…'
    ]
  ],
  [
    'antigravity auth-method menu over ready chrome',
    [
      'Antigravity CLI',
      'gemini 3 pro (high)',
      '>',
      '',
      '? How would you like to authenticate?',
      '❯ Sign in with Google',
      '  Use an API key'
    ]
  ],
  [
    'api-key prompt under a complete Codex ready header',
    [
      'OpenAI Codex',
      'model: gpt-6',
      'directory: ~/repo',
      '',
      '› Ask Codex to do anything',
      '',
      'Enter your API key:'
    ]
  ],
  ['bare api-key ask', ['Enter your API key: ']],
  ['vendor-qualified api-key ask with a caret', ['? Enter your Anthropic API key ›']],
  ['bare password label', ['Password:']],
  ['lowercase password label', ['password: ']],
  ['sudo password', ['[sudo] password for neil:']],
  ['ssh key passphrase', ["Enter passphrase for key '/Users/neil/.ssh/id_ed25519':"]],
  ['git username', ["Username for 'https://github.com': "]],
  ['git password', ["Password for 'https://neil@github.com': "]],
  ['sms verification code', ['Enter the verification code we sent to your phone:']],
  ['one-time code', ['Enter your one-time code:']],
  [
    'two-factor dialog',
    ['Two-factor authentication', 'Enter the 6-digit code from your authenticator app:']
  ],
  ['personal access token paste', ['Paste your personal access token here:']],
  ['sign-in wall', ['Authentication required', 'Sign in with GitHub to continue']],
  [
    'oauth device-code flow',
    [
      'Please open the following url in your browser:',
      '  https://github.com/login/device',
      '',
      'and enter the code: ABCD-1234'
    ]
  ],
  ['client secret', ['Enter client secret:']],
  ['password confirmation', ['Re-enter password:']],
  ['access token ask', ['Provide your access token:']],
  ['otp ask', ['Type your OTP:']],
  ['bare credentials label', ['credentials:']],
  ['device code ask', ['Enter device code:']]
]

export const LEGITIMATE_AGENT_SCREENS: readonly TerminalCredentialPromptCase[] = [
  // An agent narrating credential work and returning to its composer.
  [
    'codex narrating password hashing',
    [
      '• I added bcrypt password hashing to src/auth/user.ts.',
      '',
      '› Ask Codex to do anything',
      '',
      '  gpt-6 medium · ~/repo'
    ]
  ],
  [
    'codex narrating api-key wiring',
    ['• Wired the API key into .env.example and documented it.', '', '› Ask Codex to do anything']
  ],
  [
    'claude narrating login work',
    ['· Updated the login form to use the new session cookie.', '', '✳ Claude Code', '', '> ']
  ],
  [
    'codex narrating an oauth refresh',
    [
      '• Done. The OAuth device-code flow now refreshes the access token.',
      '',
      '› Ask Codex to do anything'
    ]
  ],
  [
    'claude narrating a secret rotation',
    ['· I rotated the client secret and pushed the change.', '', '> ']
  ],
  // An agent legitimately ASKING the user something credential-adjacent.
  [
    'agent asks where to store a password',
    [
      '· Should I store the password in the .env file or in the keychain?',
      '',
      '✳ Claude Code',
      '',
      '> '
    ]
  ],
  [
    'agent asks about reading an api key',
    ['· Do you want me to read your api key from process.env.OPENAI_API_KEY?', '', '> ']
  ],
  [
    'agent asks which auth provider',
    ['· Which auth provider should the sign in page use?', '', '> ']
  ],
  [
    'agent asks about a token in CI',
    ['· I need to know: does your CI already have a personal access token?', '', '> ']
  ],
  [
    'agent asks where a template goes',
    ['· Where should I put the verification code template?', '', '> ']
  ],
  ['agent asks about OTP expiry', ['· Should the OTP expire after 5 minutes or 10?', '', '> ']],
  [
    'agent asks about 2FA delivery',
    ['· Do you want 2FA codes emailed or via authenticator app?', '', '> ']
  ],
  [
    'agent narrates an upcoming passphrase edit',
    ['· Ready. Next I will enter the passphrase handling into the key loader.', '', '> ']
  ],
  [
    'agent narrates an api-key edit mid-sentence',
    ['· I will enter the API key into the vault once you confirm the vault name', '', '> ']
  ],
  [
    'agent asks which secret key to rotate',
    ['· Please tell me which secret key you want rotated first', '', '> ']
  ],
  // The user's own task prompt echoed above the composer.
  ['echoed login task prompt', ['> Implement the login form', '', '· Working…']],
  [
    'echoed password-reset task prompt',
    ['> add password reset via one-time code', '', '· Working…']
  ],
  [
    'echoed credentials task prompt',
    ['> Refactor the credentials module', '', '✳ Claude Code', '', '> ']
  ],
  // Search output quoting credential-shaped source, the shape that broke earlier detectors.
  [
    'rg hit on a password call',
    [
      '  └ src/auth.ts:42:  const password = await promptPassword()',
      '',
      '› Ask Codex to do anything'
    ]
  ],
  [
    'rg hit on an api-key label literal',
    ["  └ 118:    label: 'Enter your API key'", '', '› Ask Codex to do anything']
  ],
  [
    'rg hit on a password test name',
    ["  └ tests/auth.test.ts:9:  it('prompts for password', () => {", '', '> ']
  ],
  [
    'search narration quoting a prompt',
    ['  └ Search "enter your password" in src/', '', '› Ask Codex to do anything']
  ],
  // A diff that ADDS a credential prompt string.
  [
    'diff adding an api-key log',
    ['+  console.log("Enter your API key:")', '', '› Ask Codex to do anything']
  ],
  ['diff adding a password prompt field', ['+    prompt: "Password:"', '', '> ']],
  // Other terminal traffic.
  [
    'cursor approval menu',
    [
      'Run this command?',
      '  cat ~/.ssh/id_rsa',
      '  Run (once) (enter)',
      '  Skip & tell the agent (esc)'
    ]
  ],
  [
    'vitest auth suite output',
    [
      '  ✓ auth > rejects an expired access token (4 ms)',
      '  ✓ auth > hashes the password with argon2 (9 ms)',
      '',
      'Test Files  1 passed'
    ]
  ],
  [
    'jest login suite output',
    ['PASS src/login.test.ts', '', '  ● login form › submits credentials', '', '> ']
  ],
  [
    'git push rejection',
    [
      'remote: Support for password authentication was removed.',
      'fatal: Authentication failed',
      '$ '
    ]
  ],
  ['clean git push', ['Everything up-to-date', '$ ']],
  [
    'rendered readme auth section',
    ['## Authentication', '', 'Set `ORCA_API_KEY` in your environment before running.', '', '$ ']
  ],
  [
    'agent narrating a failed gh auth',
    [
      '• The gh CLI says authentication failed; I skipped the PR step.',
      '',
      '› Ask Codex to do anything'
    ]
  ]
]
