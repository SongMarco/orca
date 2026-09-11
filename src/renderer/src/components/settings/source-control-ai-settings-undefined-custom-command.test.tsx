// @vitest-environment happy-dom

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { getDefaultSettings } from '../../../../shared/constants'
import type { CommitMessageAiSettings } from '../../../../shared/commit-message-ai-types'
import { mergeLegacyCommitMessageAiIntoSourceControlAi } from '../../../../shared/source-control-ai'
import { CommitMessageAiPane } from './CommitMessageAiPane'

// Crash report 21699b66 (v1.4.199, boundary page.settings): a settings.json whose legacy
// `commitMessageAi` block has no `customAgentCommand` key — the shape JSON.stringify leaves
// behind once the field has been undefined once.
const legacyWithoutCustomAgentCommand = {
  enabled: true,
  agentId: null,
  selectedModelByAgent: {},
  selectedThinkingByModel: {},
  customPrompt: ''
} as unknown as CommitMessageAiSettings

describe('Source Control AI pane with no persisted customAgentCommand', () => {
  it('keeps customAgentCommand a string when the legacy block omits it', () => {
    const persistedSourceControlAi = JSON.parse(
      JSON.stringify(
        mergeLegacyCommitMessageAiIntoSourceControlAi(undefined, legacyWithoutCustomAgentCommand)
      )
    )
    const loaded = mergeLegacyCommitMessageAiIntoSourceControlAi(
      persistedSourceControlAi,
      legacyWithoutCustomAgentCommand
    )
    expect(Object.hasOwn(loaded, 'customAgentCommand')).toBe(true)
    expect(typeof loaded.customAgentCommand).toBe('string')
  })

  it('renders the pane instead of throwing the page.settings boundary TypeError', () => {
    const base = getDefaultSettings('/tmp')
    const settings = {
      ...base,
      commitMessageAi: legacyWithoutCustomAgentCommand,
      sourceControlAi: mergeLegacyCommitMessageAiIntoSourceControlAi(
        JSON.parse(
          JSON.stringify(
            mergeLegacyCommitMessageAiIntoSourceControlAi(
              undefined,
              legacyWithoutCustomAgentCommand
            )
          )
        ),
        legacyWithoutCustomAgentCommand
      )
    }
    expect(() =>
      renderToStaticMarkup(
        <CommitMessageAiPane settings={settings} updateSettings={() => {}} settingsSearchQuery="" />
      )
    ).not.toThrow()
  })
})
