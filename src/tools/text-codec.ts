const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8', { fatal: true })

export type CodecOperation =
  | 'base64-encode'
  | 'base64-decode'
  | 'base64url-encode'
  | 'base64url-decode'
  | 'hex-encode'
  | 'hex-decode'
  | 'url-encode'
  | 'url-decode'
  | 'html-encode'
  | 'html-decode'
  | 'rot13'
  | 'caesar-encode'
  | 'caesar-decode'
  | 'atbash'
  | 'morse-encode'
  | 'morse-decode'
  | 'sha256'
  | 'sha512'
  | 'aes-encrypt'
  | 'aes-decrypt'

export function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

export function base64ToBytes(value: string) {
  const stripped = value.trim().replace(/^data:[^,]*,/, '').replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/')
  const padded = stripped.padEnd(Math.ceil(stripped.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function shiftLetters(value: string, shift: number) {
  const normalized = ((shift % 26) + 26) % 26
  return value.replace(/[a-z]/gi, (letter) => {
    const start = letter <= 'Z' ? 65 : 97
    return String.fromCharCode((letter.charCodeAt(0) - start + normalized) % 26 + start)
  })
}

function atbash(value: string) {
  return value.replace(/[a-z]/gi, (letter) => {
    const start = letter <= 'Z' ? 65 : 97
    return String.fromCharCode(start + 25 - (letter.charCodeAt(0) - start))
  })
}

const morsePairs = [
  ['A', '.-'], ['B', '-...'], ['C', '-.-.'], ['D', '-..'], ['E', '.'], ['F', '..-.'], ['G', '--.'], ['H', '....'], ['I', '..'], ['J', '.---'], ['K', '-.-'], ['L', '.-..'], ['M', '--'], ['N', '-.'], ['O', '---'], ['P', '.--.'], ['Q', '--.-'], ['R', '.-.'], ['S', '...'], ['T', '-'], ['U', '..-'], ['V', '...-'], ['W', '.--'], ['X', '-..-'], ['Y', '-.--'], ['Z', '--..'],
  ['0', '-----'], ['1', '.----'], ['2', '..---'], ['3', '...--'], ['4', '....-'], ['5', '.....'], ['6', '-....'], ['7', '--...'], ['8', '---..'], ['9', '----.'],
  ['.', '.-.-.-'], [',', '--..--'], ['?', '..--..'], ['!', '-.-.--'], ['/', '-..-.'], ['-', '-....-'], ['(', '-.--.'], [')', '-.--.-'], ['@', '.--.-.'],
] as const
const toMorse = new Map<string, string>(morsePairs)
const fromMorse = new Map<string, string>(morsePairs.map(([letter, code]) => [code, letter]))

function morseEncode(value: string) {
  return value.toUpperCase().split(/\s+/).map((word) => [...word].map((letter) => toMorse.get(letter) ?? letter).join(' ')).join(' / ')
}

function morseDecode(value: string) {
  return value.trim().split(/\s*\/\s*/).map((word) => word.trim().split(/\s+/).map((code) => fromMorse.get(code) ?? '�').join('')).join(' ')
}

function htmlEncode(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character)
}

function htmlDecode(value: string) {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value
}

async function deriveAesKey(passphrase: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new Uint8Array(salt).buffer, iterations: 250_000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function aesEncrypt(value: string, passphrase: string) {
  if (!passphrase) throw new Error('Enter a passphrase before encrypting.')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveAesKey(passphrase, salt)
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: new Uint8Array(iv).buffer }, key, encoder.encode(value))
  return `concise:aes256gcm:v1:${bytesToBase64(salt)}:${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(encrypted))}`
}

async function aesDecrypt(value: string, passphrase: string) {
  if (!passphrase) throw new Error('Enter the original passphrase before decrypting.')
  const parts = value.trim().split(':')
  if (parts.length !== 6 || parts.slice(0, 3).join(':') !== 'concise:aes256gcm:v1') throw new Error('This is not a Concise AES-256-GCM payload.')
  const salt = base64ToBytes(parts[3])
  const iv = base64ToBytes(parts[4])
  const encrypted = base64ToBytes(parts[5])
  const key = await deriveAesKey(passphrase, salt)
  try {
    return decoder.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv).buffer }, key, new Uint8Array(encrypted).buffer))
  } catch {
    throw new Error('Decryption failed. Check the payload and passphrase.')
  }
}

async function digest(value: string, algorithm: 'SHA-256' | 'SHA-512') {
  const hash = await crypto.subtle.digest(algorithm, encoder.encode(value))
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function runCodec(operation: CodecOperation, input: string, shift: number, passphrase: string) {
  switch (operation) {
    case 'base64-encode': return bytesToBase64(encoder.encode(input))
    case 'base64-decode': return decoder.decode(base64ToBytes(input))
    case 'base64url-encode': return bytesToBase64(encoder.encode(input)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    case 'base64url-decode': return decoder.decode(base64ToBytes(input))
    case 'hex-encode': return [...encoder.encode(input)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
    case 'hex-decode': {
      const compact = input.replace(/\s/g, '')
      if (!/^[\da-f]*$/i.test(compact) || compact.length % 2 !== 0) throw new Error('Hex input needs complete pairs using 0–9 and A–F.')
      return decoder.decode(Uint8Array.from(compact.match(/.{2}/g) ?? [], (pair) => Number.parseInt(pair, 16)))
    }
    case 'url-encode': return encodeURIComponent(input)
    case 'url-decode': return decodeURIComponent(input.replace(/\+/g, ' '))
    case 'html-encode': return htmlEncode(input)
    case 'html-decode': return htmlDecode(input)
    case 'rot13': return shiftLetters(input, 13)
    case 'caesar-encode': return shiftLetters(input, shift)
    case 'caesar-decode': return shiftLetters(input, -shift)
    case 'atbash': return atbash(input)
    case 'morse-encode': return morseEncode(input)
    case 'morse-decode': return morseDecode(input)
    case 'sha256': return digest(input, 'SHA-256')
    case 'sha512': return digest(input, 'SHA-512')
    case 'aes-encrypt': return aesEncrypt(input, passphrase)
    case 'aes-decrypt': return aesDecrypt(input, passphrase)
  }
}
