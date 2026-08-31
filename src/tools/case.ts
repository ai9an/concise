export type CaseMode =
  | 'sentence'
  | 'title'
  | 'upper'
  | 'lower'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant'
  | 'dot'
  | 'path'
  | 'alternating'
  | 'inverse'

const smallTitleWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'via', 'with'])

function words(value: string) {
  return value
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[’']/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function preserveWhitespaceTransform(value: string, transform: (word: string, index: number) => string) {
  let index = 0
  return value.replace(/[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu, (word) => transform(word, index++))
}

function sentenceCase(value: string) {
  const lowered = value.toLocaleLowerCase()
  let capitalizeNext = true
  return lowered.replace(/\p{L}/gu, (letter, offset) => {
    if (capitalizeNext) {
      capitalizeNext = false
      return letter.toLocaleUpperCase()
    }
    const before = lowered.slice(0, offset)
    if (/[.!?][\s"'’”)]*$/.test(before)) {
      return letter.toLocaleUpperCase()
    }
    return letter
  })
}

export function convertCase(value: string, mode: CaseMode) {
  if (!value) return ''
  if (mode === 'upper') return value.toLocaleUpperCase()
  if (mode === 'lower') return value.toLocaleLowerCase()
  if (mode === 'inverse') {
    return value.replace(/\p{L}/gu, (letter) => letter === letter.toLocaleUpperCase() ? letter.toLocaleLowerCase() : letter.toLocaleUpperCase())
  }
  if (mode === 'alternating') {
    let upper = false
    return value.replace(/\p{L}/gu, (letter) => {
      upper = !upper
      return upper ? letter.toLocaleUpperCase() : letter.toLocaleLowerCase()
    })
  }
  if (mode === 'sentence') return sentenceCase(value)
  if (mode === 'title') {
    const total = words(value).length
    return preserveWhitespaceTransform(value.toLocaleLowerCase(), (word, index) => {
      if (index > 0 && index < total - 1 && smallTitleWords.has(word)) return word
      return word.charAt(0).toLocaleUpperCase() + word.slice(1)
    })
  }

  const parts = words(value).map((word) => word.toLocaleLowerCase())
  if (mode === 'camel') return parts.map((word, index) => index ? word.charAt(0).toLocaleUpperCase() + word.slice(1) : word).join('')
  if (mode === 'pascal') return parts.map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1)).join('')
  if (mode === 'snake') return parts.join('_')
  if (mode === 'kebab') return parts.join('-')
  if (mode === 'constant') return parts.join('_').toLocaleUpperCase()
  if (mode === 'dot') return parts.join('.')
  return parts.join('/')
}

export function countText(value: string) {
  const graphemes = typeof Intl.Segmenter === 'function'
    ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)).length
    : Array.from(value).length
  return {
    characters: graphemes,
    words: value.trim() ? value.trim().split(/\s+/).length : 0,
    lines: value ? value.split(/\r?\n/).length : 0,
  }
}
