import type { ImageMime, Settings, Theme } from '../types'

type SettingsPanelProps = {
  settings: Settings
  onChange: (settings: Settings) => void
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const update = <Key extends keyof Settings>(key: Key, value: Settings[Key]) => onChange({ ...settings, [key]: value })

  return (
    <details className="settings-panel">
      <summary>settings</summary>
      <div className="settings-content">
        <label>
          <span>theme</span>
          <select value={settings.theme} onChange={(event) => update('theme', event.target.value as Theme)}>
            <option value="dark">dark signal</option>
            <option value="light">light signal</option>
          </select>
        </label>
        <label>
          <span>default format</span>
          <select value={settings.defaultFormat} onChange={(event) => update('defaultFormat', event.target.value as ImageMime)}>
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
          </select>
        </label>
        <label>
          <span>default quality · {Math.round(settings.quality * 100)}%</span>
          <input type="range" min="0.2" max="1" step="0.01" value={settings.quality} onChange={(event) => update('quality', Number(event.target.value))} />
        </label>
        <label className="check-line">
          <input type="checkbox" checked={settings.rememberTool} onChange={(event) => update('rememberTool', event.target.checked)} />
          <span>remember the last tool</span>
        </label>
      </div>
    </details>
  )
}
