import figlet, { type FigletOptions } from 'figlet'
import threeDAscii from 'figlet/fonts/3D-ASCII'
import alligator2 from 'figlet/fonts/Alligator2'
import ansiRegular from 'figlet/fonts/ANSI Regular'
import ansiShadow from 'figlet/fonts/ANSI Shadow'
import alpha from 'figlet/fonts/Alpha'
import banner from 'figlet/fonts/Banner'
import banner3d from 'figlet/fonts/Banner3-D'
import big from 'figlet/fonts/Big'
import bigMoneyNe from 'figlet/fonts/Big Money-ne'
import bigMoneySw from 'figlet/fonts/Big Money-sw'
import block from 'figlet/fonts/Block'
import bloody from 'figlet/fonts/Bloody'
import bulbhead from 'figlet/fonts/Bulbhead'
import calvinS from 'figlet/fonts/Calvin S'
import chunky from 'figlet/fonts/Chunky'
import colossal from 'figlet/fonts/Colossal'
import cosmike from 'figlet/fonts/Cosmike'
import cyberlarge from 'figlet/fonts/Cyberlarge'
import dancingFont from 'figlet/fonts/Dancing Font'
import deltaCorpsPriest from 'figlet/fonts/Delta Corps Priest 1'
import doom from 'figlet/fonts/Doom'
import drPepper from 'figlet/fonts/Dr Pepper'
import eftiWall from 'figlet/fonts/Efti Wall'
import epic from 'figlet/fonts/Epic'
import fireFont from 'figlet/fonts/Fire Font-k'
import fraktur from 'figlet/fonts/Fraktur'
import ghost from 'figlet/fonts/Ghost'
import gothic from 'figlet/fonts/Gothic'
import graffiti from 'figlet/fonts/Graffiti'
import isometric1 from 'figlet/fonts/Isometric1'
import isometric2 from 'figlet/fonts/Isometric2'
import larry3d from 'figlet/fonts/Larry 3D'
import mini from 'figlet/fonts/Mini'
import ogre from 'figlet/fonts/Ogre'
import poison from 'figlet/fonts/Poison'
import roman from 'figlet/fonts/Roman'
import script from 'figlet/fonts/Script'
import shadow from 'figlet/fonts/Shadow'
import slant from 'figlet/fonts/Slant'
import small from 'figlet/fonts/Small'
import smallIsometric1 from 'figlet/fonts/Small Isometric1'
import soft from 'figlet/fonts/Soft'
import standard from 'figlet/fonts/Standard'
import starWars from 'figlet/fonts/Star Wars'
import thin from 'figlet/fonts/Thin'
import train from 'figlet/fonts/Train'
import tubular from 'figlet/fonts/Tubular'
import univers from 'figlet/fonts/Univers'
import varsity from 'figlet/fonts/Varsity'
import whimsy from 'figlet/fonts/Whimsy'

export const asciiFontGroups = [
  { label: 'Featured', fonts: ['Bloody', 'Delta Corps Priest 1', 'ANSI Shadow', 'Doom', 'Slant'] },
  { label: 'Dimensional', fonts: ['3D-ASCII', 'Banner3-D', 'Big Money-ne', 'Big Money-sw', 'Colossal', 'Isometric1', 'Isometric2', 'Larry 3D', 'Poison'] },
  { label: 'Display', fonts: ['ANSI Regular', 'Big', 'Block', 'Epic', 'Ghost', 'Graffiti', 'Roman', 'Star Wars', 'Standard', 'Univers', 'Varsity'] },
  { label: 'Compact', fonts: ['Calvin S', 'Cyberlarge', 'Mini', 'Small', 'Small Isometric1', 'Thin'] },
  { label: 'Character', fonts: ['Alligator2', 'Alpha', 'Banner', 'Bulbhead', 'Chunky', 'Cosmike', 'Dancing Font', 'Dr Pepper', 'Efti Wall', 'Fire Font-k', 'Fraktur', 'Gothic', 'Ogre', 'Script', 'Shadow', 'Soft', 'Train', 'Tubular', 'Whimsy'] },
] as const

export const asciiFonts = asciiFontGroups.flatMap((group) => group.fonts)
export type AsciiFont = typeof asciiFonts[number]
export type AsciiAnimation = 'none' | 'type-on' | 'wipe' | 'shine' | 'pulse'
export type GradientMode = 'solid' | 'horizontal' | 'vertical' | 'diagonal'

const fontData: Record<AsciiFont, string> = {
  '3D-ASCII': threeDAscii,
  Alligator2: alligator2,
  'ANSI Regular': ansiRegular,
  Standard: standard,
  'ANSI Shadow': ansiShadow,
  Alpha: alpha,
  Big: big,
  'Big Money-ne': bigMoneyNe,
  'Big Money-sw': bigMoneySw,
  Block: block,
  Bloody: bloody,
  Bulbhead: bulbhead,
  'Calvin S': calvinS,
  Chunky: chunky,
  Colossal: colossal,
  Cosmike: cosmike,
  Cyberlarge: cyberlarge,
  'Dancing Font': dancingFont,
  'Delta Corps Priest 1': deltaCorpsPriest,
  Doom: doom,
  'Dr Pepper': drPepper,
  'Efti Wall': eftiWall,
  Epic: epic,
  'Fire Font-k': fireFont,
  Fraktur: fraktur,
  Ghost: ghost,
  Gothic: gothic,
  Graffiti: graffiti,
  Isometric1: isometric1,
  Isometric2: isometric2,
  'Larry 3D': larry3d,
  Ogre: ogre,
  Poison: poison,
  Roman: roman,
  Slant: slant,
  Small: small,
  'Small Isometric1': smallIsometric1,
  Mini: mini,
  Script: script,
  Shadow: shadow,
  Banner: banner,
  'Banner3-D': banner3d,
  Soft: soft,
  'Star Wars': starWars,
  Thin: thin,
  Train: train,
  Tubular: tubular,
  Univers: univers,
  Varsity: varsity,
  Whimsy: whimsy,
}

for (const [name, data] of Object.entries(fontData)) figlet.parseFont(name, data)
figlet.defaults({ fetchFontIfMissing: false })

export type AsciiSettings = {
  font: AsciiFont
  columns: number
  horizontalLayout: NonNullable<FigletOptions['horizontalLayout']>
  verticalLayout: NonNullable<FigletOptions['verticalLayout']>
  direction: 0 | 1
  whitespaceBreak: boolean
  fontSize: number
  lineHeight: number
  padding: number
  transparent: boolean
  background: string
  primary: string
  secondary: string
  gradient: GradientMode
  animation: AsciiAnimation
  duration: number
  fps: number
}

export function makeAscii(text: string, settings: AsciiSettings) {
  return figlet.textSync(text || ' ', {
    font: settings.font,
    width: settings.columns,
    horizontalLayout: settings.horizontalLayout,
    verticalLayout: settings.verticalLayout,
    whitespaceBreak: settings.whitespaceBreak,
    printDirection: settings.direction,
  }).replace(/[ \t]+$/gm, '')
}

function hexRgb(value: string) {
  const hex = value.replace('#', '')
  const normalized = hex.length === 3 ? hex.split('').map((part) => part + part).join('') : hex.padEnd(6, '0').slice(0, 6)
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

type Rgb = ReturnType<typeof hexRgb>

const terminalFont = '"DejaVu Sans Mono", "Cascadia Mono", "Liberation Mono", monospace'

function gradientAmount(mode: GradientMode, row: number, column: number, width: number, height: number) {
  if (mode === 'solid') return 0
  if (mode === 'horizontal') return Math.trunc(column * 100 / Math.max(1, width - 1))
  if (mode === 'vertical') return Math.trunc(row * 100 / Math.max(1, height - 1))
  return Math.trunc((column + row) * 100 / Math.max(1, width + height - 2))
}

function mixRgb(primary: Rgb, secondary: Rgb, amount: number): Rgb {
  return {
    r: primary.r + Math.trunc((secondary.r - primary.r) * amount / 100),
    g: primary.g + Math.trunc((secondary.g - primary.g) * amount / 100),
    b: primary.b + Math.trunc((secondary.b - primary.b) * amount / 100),
  }
}

function brightenRgb(base: Rgb, amount: number): Rgb {
  return {
    r: base.r + Math.trunc((255 - base.r) * amount / 100),
    g: base.g + Math.trunc((255 - base.g) * amount / 100),
    b: base.b + Math.trunc((255 - base.b) * amount / 100),
  }
}

function scaleRgb(base: Rgb, amount: number): Rgb {
  return {
    r: Math.trunc(base.r * amount / 100),
    g: Math.trunc(base.g * amount / 100),
    b: Math.trunc(base.b * amount / 100),
  }
}

function rgbStyle(colour: Rgb) {
  return `rgb(${colour.r} ${colour.g} ${colour.b})`
}

export function sizeAsciiCanvas(ascii: string, settings: AsciiSettings) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas rendering is unavailable in this browser.')
  context.font = `${settings.fontSize}px ${terminalFont}`
  const lines = ascii.split('\n')
  const characterWidth = context.measureText('M').width
  const width = Math.max(1, ...lines.map((line) => Array.from(line).length)) * characterWidth
  canvas.width = Math.max(1, Math.ceil(width + settings.padding * 2))
  canvas.height = Math.max(1, Math.ceil(lines.length * settings.fontSize * settings.lineHeight + settings.padding * 2))
  return canvas
}

export function drawAsciiFrame(canvas: HTMLCanvasElement, ascii: string, settings: AsciiSettings, progress = 1) {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas rendering is unavailable in this browser.')
  const lines = ascii.split('\n')
  const lineStep = settings.fontSize * settings.lineHeight
  const characterWidth = (() => {
    context.font = `${settings.fontSize}px ${terminalFont}`
    return context.measureText('M').width
  })()
  const width = Math.max(1, ...lines.map((line) => Array.from(line).length))
  const height = Math.max(1, lines.length)
  const primary = hexRgb(settings.primary)
  const secondary = hexRgb(settings.secondary)
  context.clearRect(0, 0, canvas.width, canvas.height)
  if (!settings.transparent) {
    context.fillStyle = settings.background
    context.fillRect(0, 0, canvas.width, canvas.height)
  }
  context.font = `${settings.fontSize}px ${terminalFont}`
  context.textBaseline = 'top'

  const cycle = Math.max(0, Math.min(1, progress))
  const characterCount = lines.reduce((total, line) => total + Array.from(line).length + 1, 0)
  const typeLimit = Math.ceil(characterCount * cycle)
  const wipeLimit = Math.ceil(width * cycle)
  const frameIndex = Math.floor(cycle * settings.duration * settings.fps)
  const pulsePhase = frameIndex % 20 > 10 ? 20 - frameIndex % 20 : frameIndex % 20
  const pulsePercent = 48 + pulsePhase * 5
  const shineColumn = -12 + Math.trunc((width + 32) * cycle)
  let visited = 0

  lines.forEach((line, lineIndex) => {
    const y = settings.padding + lineIndex * lineStep
    Array.from(line).forEach((character, column) => {
      const characterIndex = visited++
      if (settings.animation === 'type-on' && characterIndex >= typeLimit) return
      if (settings.animation === 'wipe' && column >= wipeLimit) return
      const amount = gradientAmount(settings.gradient, lineIndex, column, width, height)
      let colour = mixRgb(primary, secondary, amount)
      if (settings.animation === 'pulse') colour = scaleRgb(colour, pulsePercent)
      if (settings.animation === 'shine') {
        const distance = Math.abs(column - (shineColumn - lineIndex * 2))
        const shineAmount = distance <= 1 ? 100 : distance <= 3 ? 70 : distance <= 6 ? 35 : 0
        colour = brightenRgb(colour, shineAmount)
      }
      context.fillStyle = rgbStyle(colour)
      context.fillText(character, settings.padding + column * characterWidth, y)
    })
    visited += 1
  })
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png') {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('This browser could not encode the export.')), type))
}

function shellCode(ascii: string, settings: AsciiSettings, runnable: boolean) {
  const { r, g, b } = hexRgb(settings.primary)
  const { r: secondaryR, g: secondaryG, b: secondaryB } = hexRgb(settings.secondary)
  const frameCount = Math.max(2, Math.round(settings.duration * settings.fps))
  const delay = Math.max(0.016, settings.duration / frameCount).toFixed(3)
  const gradientCalculation = settings.gradient === 'horizontal'
    ? ['    conciseAmount=$((conciseColumn * 100 / (conciseLogoWidth > 1 ? conciseLogoWidth - 1 : 1)))']
    : settings.gradient === 'vertical'
      ? ['    conciseAmount=$((conciseRow * 100 / (conciseLogoHeight > 1 ? conciseLogoHeight - 1 : 1)))']
      : settings.gradient === 'diagonal'
        ? ['    conciseDenominator=$((conciseLogoWidth + conciseLogoHeight - 2))', '    ((conciseDenominator < 1)) && conciseDenominator=1', '    conciseAmount=$(((conciseColumn + conciseRow) * 100 / conciseDenominator))']
        : ['    conciseAmount=0']
  const body = [
    '#!/usr/bin/env bash',
    '',
    'conciseCursorHidden=false',
    "conciseFramePrefix=''",
    '',
    'concise_cleanup_terminal() {',
    '    if [[ "$conciseCursorHidden" == true ]]; then',
    "        printf '\\033[0m\\033[?25h'",
    '        conciseCursorHidden=false',
    '    fi',
    '}',
    '',
    'trap concise_cleanup_terminal EXIT',
    '',
    "mapfile -t conciseLogoLines <<'CONCISE_ASCII_ART'",
    ascii,
    'CONCISE_ASCII_ART',
    '',
    'concise_print_plain() {',
    "    printf '%s\\n' \"${conciseLogoLines[@]}\"",
    '}',
    '',
    'concise_terminal_ready() {',
    '    local conciseLine conciseTerminalWidth',
    '    [[ -t 1 && ${TERM:-dumb} != dumb && -z ${NO_COLOR:-} ]] || return 1',
    '    conciseLogoWidth=0',
    '    conciseCharacterCount=0',
    '    conciseLogoHeight=${#conciseLogoLines[@]}',
    '    for conciseLine in "${conciseLogoLines[@]}"; do',
    '        ((${#conciseLine} > conciseLogoWidth)) && conciseLogoWidth=${#conciseLine}',
    '        conciseCharacterCount=$((conciseCharacterCount + ${#conciseLine} + 1))',
    '    done',
    "    conciseTerminalWidth=$(tput cols 2>/dev/null || printf '0')",
    '    ((conciseTerminalWidth > 0 && conciseTerminalWidth < conciseLogoWidth)) && return 1',
    '    return 0',
    '}',
    '',
    'concise_begin_animation() {',
    '    conciseCursorHidden=true',
    "    conciseFramePrefix='\\033[H'",
    "    printf '\\033[2J\\033[H\\033[?25l'",
    '}',
    '',
    'concise_end_animation() {',
    "    printf '\\033[0m\\033[?25h\\n'",
    '    conciseCursorHidden=false',
    "    conciseFramePrefix=''",
    '}',
    '',
    'concise_set_base_colour() {',
    '    local conciseRow=$1 conciseColumn=$2 conciseAmount conciseDenominator',
    ...gradientCalculation,
    `    conciseBaseRed=$(( ${r} + (${secondaryR} - ${r}) * conciseAmount / 100 ))`,
    `    conciseBaseGreen=$(( ${g} + (${secondaryG} - ${g}) * conciseAmount / 100 ))`,
    `    conciseBaseBlue=$(( ${b} + (${secondaryB} - ${b}) * conciseAmount / 100 ))`,
    '}',
    '',
    'concise_render_frame() {',
    '    local conciseMode=$1 conciseValue=${2:-0}',
    "    local conciseFrame='' conciseCurrent='' conciseTone conciseChar",
    '    local conciseRow conciseLine conciseColumn conciseIndex=0 conciseDistance conciseMix',
    '    local conciseBaseRed conciseBaseGreen conciseBaseBlue conciseToneRed conciseToneGreen conciseToneBlue',
    '    for conciseRow in "${!conciseLogoLines[@]}"; do',
    '        conciseLine=${conciseLogoLines[$conciseRow]}',
    "        conciseCurrent=''",
    '        for ((conciseColumn = 0; conciseColumn < ${#conciseLine}; conciseColumn++)); do',
    '            conciseChar=${conciseLine:conciseColumn:1}',
    '            if [[ "$conciseMode" == type && $conciseIndex -ge $conciseValue ]]; then',
    '                conciseIndex=$((conciseIndex + 1))',
    '                continue',
    '            fi',
    '            if [[ "$conciseMode" == wipe && $conciseColumn -ge $conciseValue ]]; then',
    '                conciseIndex=$((conciseIndex + 1))',
    '                continue',
    '            fi',
    '            concise_set_base_colour "$conciseRow" "$conciseColumn"',
    '            conciseToneRed=$conciseBaseRed',
    '            conciseToneGreen=$conciseBaseGreen',
    '            conciseToneBlue=$conciseBaseBlue',
    '            if [[ "$conciseMode" == pulse ]]; then',
    '                conciseToneRed=$((conciseToneRed * conciseValue / 100))',
    '                conciseToneGreen=$((conciseToneGreen * conciseValue / 100))',
    '                conciseToneBlue=$((conciseToneBlue * conciseValue / 100))',
    '            elif [[ "$conciseMode" == shine ]]; then',
    '                conciseDistance=$((conciseColumn - (conciseValue - conciseRow * 2)))',
    '                ((conciseDistance < 0)) && conciseDistance=$((-conciseDistance))',
    '                if ((conciseDistance <= 1)); then conciseMix=100',
    '                elif ((conciseDistance <= 3)); then conciseMix=70',
    '                elif ((conciseDistance <= 6)); then conciseMix=35',
    '                else conciseMix=0; fi',
    '                conciseToneRed=$((conciseToneRed + (255 - conciseToneRed) * conciseMix / 100))',
    '                conciseToneGreen=$((conciseToneGreen + (255 - conciseToneGreen) * conciseMix / 100))',
    '                conciseToneBlue=$((conciseToneBlue + (255 - conciseToneBlue) * conciseMix / 100))',
    '            fi',
    '            conciseTone="${conciseToneRed};${conciseToneGreen};${conciseToneBlue}"',
    '            if [[ "$conciseTone" != "$conciseCurrent" ]]; then',
    '                conciseFrame+="\\033[38;2;${conciseTone}m"',
    '                conciseCurrent=$conciseTone',
    '            fi',
    '            conciseFrame+=$conciseChar',
    '            conciseIndex=$((conciseIndex + 1))',
    '        done',
    "        conciseFrame+=$'\\033[0m\\n'",
    '        conciseIndex=$((conciseIndex + 1))',
    '    done',
    "    printf '%b%b' \"$conciseFramePrefix\" \"$conciseFrame\"",
    '}',
    '',
  ]

  body.push('concise_ascii() {', '    local conciseFrame conciseVisible conciseText concisePhase concisePercent conciseRed conciseGreen conciseBlue conciseLine')
  if (settings.animation === 'none') {
    body.push(
      '    if ! concise_terminal_ready; then concise_print_plain; return; fi',
      '    concise_render_frame base 0',
    )
  } else {
    body.push('    if ! concise_terminal_ready; then concise_print_plain; return; fi', '    concise_begin_animation')
    if (settings.animation === 'type-on') {
      body.push(
        `    for ((conciseFrame = 0; conciseFrame <= ${frameCount}; conciseFrame++)); do`,
        `        conciseVisible=$(( conciseCharacterCount * conciseFrame / ${frameCount} ))`,
        '        concise_render_frame type "$conciseVisible"',
        `        sleep ${delay}`,
        '    done',
      )
    } else if (settings.animation === 'wipe') {
      body.push(
        `    for ((conciseFrame = 0; conciseFrame <= ${frameCount}; conciseFrame++)); do`,
        `        conciseVisible=$(( conciseLogoWidth * conciseFrame / ${frameCount} ))`,
        '        concise_render_frame wipe "$conciseVisible"',
        `        sleep ${delay}`,
        '    done',
      )
    } else if (settings.animation === 'pulse') {
      body.push(
        `    for ((conciseFrame = 0; conciseFrame <= ${frameCount}; conciseFrame++)); do`,
        '        concisePhase=$((conciseFrame % 20))',
        '        ((concisePhase > 10)) && concisePhase=$((20 - concisePhase))',
        '        concisePercent=$((48 + concisePhase * 5))',
        '        concise_render_frame pulse "$concisePercent"',
        `        sleep ${delay}`,
        '    done',
      )
    } else {
      body.push(
        `    for ((conciseFrame = 0; conciseFrame <= ${frameCount}; conciseFrame++)); do`,
        `        conciseVisible=$(( -12 + (conciseLogoWidth + 32) * conciseFrame / ${frameCount} ))`,
        '        concise_render_frame shine "$conciseVisible"',
        `        sleep ${delay}`,
        '    done',
        '    concise_render_frame base 0',
      )
    }
    if (settings.animation === 'pulse') body.push('    concise_render_frame base 0')
    body.push('    concise_end_animation')
  }
  body.push('}')
  if (runnable) body.push('', 'concise_ascii')
  return body.join('\n')
}

function pythonCode(ascii: string, settings: AsciiSettings, runnable: boolean) {
  const { r, g, b } = hexRgb(settings.primary)
  const { r: secondaryR, g: secondaryG, b: secondaryB } = hexRgb(settings.secondary)
  const frameCount = Math.max(2, Math.round(settings.duration * settings.fps))
  const delay = Math.max(0.016, settings.duration / frameCount).toFixed(3)
  const lines = JSON.stringify(ascii.split('\n'), null, 4)
  const body = [
    'import atexit',
    'import os',
    'import shutil',
    'import sys',
    'import time',
    '',
    `LOGO_LINES = ${lines}`,
    `PRIMARY = (${r}, ${g}, ${b})`,
    `SECONDARY = (${secondaryR}, ${secondaryG}, ${secondaryB})`,
    `GRADIENT = "${settings.gradient}"`,
    'cursor_hidden = False',
    '',
    'def cleanup_terminal():',
    '    global cursor_hidden',
    '    if cursor_hidden:',
    '        sys.stdout.write("\\x1b[0m\\x1b[?25h")',
    '        sys.stdout.flush()',
    '        cursor_hidden = False',
    '',
    'atexit.register(cleanup_terminal)',
    '',
    'def print_plain():',
    '    print("\\n".join(LOGO_LINES))',
    '',
    'def terminal_ready():',
    '    if not sys.stdout.isatty() or os.environ.get("TERM", "dumb") == "dumb" or os.environ.get("NO_COLOR"):',
    '        return False',
    '    width = max((len(line) for line in LOGO_LINES), default=0)',
    '    columns = shutil.get_terminal_size((0, 0)).columns',
    '    return not columns or columns >= width',
    '',
    'def begin_animation():',
    '    global cursor_hidden',
    '    cursor_hidden = True',
    '    sys.stdout.write("\\x1b[2J\\x1b[H\\x1b[?25l")',
    '    sys.stdout.flush()',
    '',
    'def end_animation():',
    '    global cursor_hidden',
    '    sys.stdout.write("\\x1b[0m\\x1b[?25h\\n")',
    '    sys.stdout.flush()',
    '    cursor_hidden = False',
    '',
    'def base_colour(row, column, width, height):',
    '    if GRADIENT == "horizontal":',
    '        amount = column * 100 // max(1, width - 1)',
    '    elif GRADIENT == "vertical":',
    '        amount = row * 100 // max(1, height - 1)',
    '    elif GRADIENT == "diagonal":',
    '        amount = (column + row) * 100 // max(1, width + height - 2)',
    '    else:',
    '        amount = 0',
    '    return tuple(first + int((second - first) * amount / 100) for first, second in zip(PRIMARY, SECONDARY))',
    '',
    'def render_frame(mode="base", value=0, home=True):',
    '    width = max((len(line) for line in LOGO_LINES), default=0)',
    '    height = len(LOGO_LINES)',
    '    output = ["\\x1b[H" if home else ""]',
    '    index = 0',
    '    for row, line in enumerate(LOGO_LINES):',
    '        current = None',
    '        for column, char in enumerate(line):',
    '            if mode == "type" and index >= value:',
    '                index += 1',
    '                continue',
    '            if mode == "wipe" and column >= value:',
    '                index += 1',
    '                continue',
    '            tone = base_colour(row, column, width, height)',
    '            if mode == "pulse":',
    '                tone = tuple(channel * value // 100 for channel in tone)',
    '            elif mode == "shine":',
    '                distance = abs(column - (value - row * 2))',
    '                mix = 100 if distance <= 1 else 70 if distance <= 3 else 35 if distance <= 6 else 0',
    '                tone = tuple(channel + (255 - channel) * mix // 100 for channel in tone)',
    '            if tone != current:',
    '                output.append(f"\\x1b[38;2;{tone[0]};{tone[1]};{tone[2]}m")',
    '                current = tone',
    '            output.append(char)',
    '            index += 1',
    '        output.append("\\x1b[0m\\n")',
    '        index += 1',
    '    sys.stdout.write("".join(output))',
    '    sys.stdout.flush()',
    '',
  ]
  body.push('def concise_ascii():', '    if not terminal_ready():', '        print_plain()', '        return')
  if (settings.animation === 'none') {
    body.push('    render_frame(home=False)')
  } else {
    body.push('    begin_animation()', '    try:')
    if (settings.animation === 'type-on') {
      body.push(
        '        length = sum(len(line) + 1 for line in LOGO_LINES)',
        `        for frame in range(${frameCount + 1}):`,
        `            visible = length * frame // ${frameCount}`,
        '            render_frame("type", visible)',
        `            time.sleep(${delay})`,
      )
    } else if (settings.animation === 'wipe') {
      body.push(
        '        width = max((len(line) for line in LOGO_LINES), default=0)',
        `        for frame in range(${frameCount + 1}):`,
        `            visible = width * frame // ${frameCount}`,
        '            render_frame("wipe", visible)',
        `            time.sleep(${delay})`,
      )
    } else if (settings.animation === 'pulse') {
      body.push(
        `        for frame in range(${frameCount + 1}):`,
        '            phase = frame % 20',
        '            phase = 20 - phase if phase > 10 else phase',
        '            percent = 48 + phase * 5',
        '            render_frame("pulse", percent)',
        `            time.sleep(${delay})`,
      )
    } else {
      body.push(
        '        width = max((len(line) for line in LOGO_LINES), default=0)',
        `        for frame in range(${frameCount + 1}):`,
        `            shine_column = -12 + (width + 32) * frame // ${frameCount}`,
        '            render_frame("shine", shine_column)',
        `            time.sleep(${delay})`,
        '        render_frame()',
      )
    }
    if (settings.animation === 'pulse') body.push('        render_frame()')
    body.push('    finally:', '        end_animation()')
  }
  if (runnable) body.push('', 'if __name__ == "__main__":', '    concise_ascii()')
  return body.join('\n')
}

export function terminalCode(ascii: string, settings: AsciiSettings, language: 'sh' | 'python', runnable: boolean) {
  return language === 'python' ? pythonCode(ascii, settings, runnable) : shellCode(ascii, settings, runnable)
}
