import type { CSSProperties } from 'react'
import type { ToolGroupId, ToolId } from '../types'

export const toolGroups: Array<{ id: ToolGroupId; label: string; tools: Array<{ id: ToolId; label: string }> }> = [
  {
    id: 'media',
    label: 'media tools',
    tools: [
      { id: 'crop', label: 'crop' },
      { id: 'resize', label: 'resize/compress' },
      { id: 'trim', label: 'trim' },
      { id: 'convert', label: 'convert' },
      { id: 'background', label: 'background' },
      { id: 'metadata', label: 'metadata' },
    ],
  },
  {
    id: 'code',
    label: 'code tools',
    tools: [
      { id: 'qr', label: 'qr code' },
      { id: 'crypto', label: 'code & cipher' },
    ],
  },
  {
    id: 'write',
    label: 'writing tools',
    tools: [
      { id: 'markdown', label: 'markdown' },
      { id: 'case', label: 'case' },
      { id: 'ascii', label: 'ascii' },
    ],
  },
]

export function groupForTool(tool: ToolId) {
  return toolGroups.find((group) => group.tools.some((item) => item.id === tool)) ?? toolGroups[0]
}

type ToolNavigationProps = {
  activeTool: ToolId
  onToolChange: (tool: ToolId) => void
}

export function ToolNavigation({ activeTool, onToolChange }: ToolNavigationProps) {
  const activeGroup = groupForTool(activeTool)

  return (
    <div className="tool-navigation">
      <nav className="group-nav" aria-label="Tool groups">
        {toolGroups.map((group) => (
          <button
            key={group.id}
            type="button"
            className={group.id === activeGroup.id ? 'is-active' : ''}
            onClick={() => onToolChange(group.tools[0].id)}
            aria-pressed={group.id === activeGroup.id}
          >
            {group.label}
          </button>
        ))}
      </nav>
      <nav className="tool-nav" aria-label={`${activeGroup.label} tools`}>
        {activeGroup.tools.map((tool, index) => (
          <button
            key={tool.id}
            type="button"
            className={activeTool === tool.id ? 'is-active' : ''}
            style={{ '--depth': index } as CSSProperties}
            onClick={() => onToolChange(tool.id)}
            aria-current={activeTool === tool.id ? 'page' : undefined}
          >
            {tool.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
