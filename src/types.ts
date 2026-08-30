export type CropRect = {
  x: number
  y: number
  width: number
  height: number
}

export type ImageAsset = {
  file: File
  bitmap: ImageBitmap
  objectUrl: string
  width: number
  height: number
}

export type ToolId = 'crop' | 'resize' | 'trim' | 'convert'

export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp'

export type Theme = 'dark' | 'light'

export type Settings = {
  version: 1
  theme: Theme
  defaultFormat: ImageMime
  quality: number
  rememberTool: boolean
  lastTool: ToolId
}
