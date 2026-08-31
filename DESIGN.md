---
name: Concise
description: A private local file workspace built as a bright signal queue over an emissive void.
colors:
  void: "#000000"
  plane: "#0b0b0a"
  ash: "#4a4a46"
  dust: "#77756e"
  frost: "#aaa79f"
  ivory: "#e6e2d6"
  signal: "#ffb000"
  danger: "#ff634d"
  selection: "#6f4d00"
  focus: "#ffd166"
  line: "rgba(230, 226, 214, 0.25)"
  light-void: "#f0eee7"
  light-plane: "#e6e3da"
  light-ash: "#9b9991"
  light-dust: "#6c6a63"
  light-frost: "#4f4e49"
  light-ivory: "#1a1a18"
  light-signal: "#b85e00"
  light-danger: "#b1261b"
  light-selection: "#ffd27a"
  light-focus: "#8b4500"
  light-line: "rgba(26, 26, 24, 0.25)"
typography:
  display:
    fontFamily: "VT323, monospace"
    fontSize: "clamp(4rem, 8vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.82
    letterSpacing: "-0.025em"
  command:
    fontFamily: "VT323, monospace"
    fontSize: "clamp(2.5rem, 6vw, 5rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.02em"
  title:
    fontFamily: "VT323, monospace"
    fontSize: "2.1rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.04em"
  body:
    fontFamily: "VT323, monospace"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "normal"
  label:
    fontFamily: "VT323, monospace"
    fontSize: "1.08rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.055em"
rounded:
  square: "0px"
spacing:
  tight: "8px"
  compact: "10px"
  control: "18px"
  panel: "22px"
  section: "30px"
components:
  button-command:
    backgroundColor: "transparent"
    textColor: "{colors.ivory}"
    typography: "{typography.command}"
    rounded: "{rounded.square}"
    padding: "0"
  button-nav:
    backgroundColor: "transparent"
    textColor: "{colors.dust}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    padding: "8px 0"
  button-nav-active:
    backgroundColor: "transparent"
    textColor: "{colors.ivory}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    padding: "8px 0"
  field-underline:
    backgroundColor: "transparent"
    textColor: "{colors.ivory}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    padding: "4px 8px"
    height: "38px"
  settings-popover:
    backgroundColor: "{colors.void}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.square}"
    padding: "22px"
---

# Design System: Concise

## Overview

**Creative North Star: "Signal Queue"**

Concise is a still, bright working plane suspended over an emissive black field. The selected file and operation stay visually fixed while inactive utilities recede through lower luminance, wider spacing, quieter type, and a slow dust field. The result should feel like local digital work with a pulse, not a themed retro interface.

The system refuses the boxed upload-dashboard convention. Structure comes from baselines, type scale, underlines, and depth-ranked content instead of rounded cards or decorative enclosure. Its light theme is the same world in paper-white negative: semantic roles swap values, but the single amber signal, bitmap voice, and hard geometry remain intact.

**Key Characteristics:**

- One front plane is bright and still; subordinate tools step back through ash values and spatial depth.
- The full-resolution hand mark rests against the bottom-right edge as a low-opacity background watermark, behind the moving dust field.
- Copy that crosses the hand mark uses a restrained void-colored halo and translucent working plane so both the words and watermark retain their form.
- Ivory bitmap type carries both identity and utility, with tabular figures for file facts and coordinates.
- Amber is a scarce signal for the current path, local-only proof, crop handles, and completion.
- Controls are exposed in the workspace rather than wrapped in dashboard cards.
- Motion is slow in the atmosphere and quick, short, and directional in interaction states.

## Colors

The palette is an achromatic depth ladder interrupted by one warm amber signal; the light theme remaps the same semantic roles without changing their hierarchy.

### Primary

- **Signal Amber** (`signal` / `light-signal`): Marks the active command prefix, current tool indicator, local-only proof, crop geometry, progress, and successful output. It is a signal, never a fill for large surfaces.

### Neutral

- **Emissive Void** (`void` / `light-void`): The full-page ground and scrollbar track.
- **Near-Black Plane** (`plane` / `light-plane`): The nearest optional surface step when content needs separation from the ground.
- **Ash Step** (`ash` / `light-ash`): Preview borders, progress tracks, and the deepest readable subordinate layer.
- **Distant Dust** (`dust` / `light-dust`): Inactive navigation, file facts, status copy, and distant queue text.
- **Frosted Ash** (`frost` / `light-frost`): Supporting instructions and field labels that must remain readable without competing with the task.
- **Bitmap Ivory** (`ivory` / `light-ivory`): Primary copy, active tools, filenames, and commands.
- **Hairline** (`line` / `light-line`): Structural dividers at deliberately low contrast.

### Semantic

- **Error Flare** (`danger` / `light-danger`): Error status only.
- **Selection Amber** (`selection` / `light-selection`): Text-selection background.
- **Focus Gold** (`focus` / `light-focus`): The two-pixel keyboard focus outline.

**The One Signal Rule.** Amber identifies action, focus, locality, progress, or success. Do not turn it into ambient decoration or a second background color.

**The Semantic Mirror Rule.** Dark and light modes must preserve role contrast and hierarchy, not merely invert the page.

### Theme atmospheres

The semantic ladder is available in eight atmospheres without changing layout or interaction: dark signal, graphite, dark ember, midnight blue, night forest, deep plum, light signal, and warm paper. Each atmosphere owns one signal hue and remaps every neutral role for readable contrast; themes are environments, not isolated accent swaps.

## Typography

**Display Font:** VT323 (with monospace fallback)  
**Body Font:** VT323 (with monospace fallback)  
**Label/Mono Font:** VT323 (with monospace fallback)

**Character:** One square-pixel face makes the product read as a coherent instrument rather than a collection of widgets. Scale, luminance, spacing, and line height create hierarchy; additional font families do not.

### Hierarchy

- **Display** (400, responsive 4–6rem, 0.82 line-height): Landing thesis and active tool names. Its compact line box produces the intentionally dense two-line silhouette.
- **Command** (400, responsive 2.5–5rem, 1 line-height): Open and primary export actions, always paired with an amber command prefix.
- **Title** (400, 2.1rem, 1 line-height): Wordmark and compact identity moments.
- **Body** (400, 1.25rem, 1.35 line-height): Control explanations and queued-tool details, usually held near 40 characters.
- **Label** (400, about 1.08rem, 0.055em tracking): File facts, privacy proof, field names, status, and coordinate readouts. Numeric data uses tabular figures.

**The One Face Rule.** Keep VT323 across every role. Create hierarchy by size, brightness, measure, and tracking rather than introducing a conventional sans-serif companion.

**The Brightness Is Weight Rule.** The implementation has one font weight. Active hierarchy comes from ivory against ash, not synthetic bold.

## Layout

The shell fills the viewport with a thin perimeter inset: 34px horizontally on wide screens, 20px below 900px, and 14px below 560px. Brand, centered tool queue, and settings share the first desktop baseline. The landing view vertically centers the thesis and open command while keeping privacy proof and the bottom status line visible in the first viewport.

The editor uses an asymmetric two-column grid: a broad preview plane (1.8fr) and a narrower control rail (0.7fr, minimum 300px), separated by a fluid 30–80px gap. The active media is the dominant plane; controls align as an exposed vertical sequence rather than a panel. File facts run on a single low-contrast line above both.

At 900px, the top tool queue moves to a second horizontal row and the editor becomes one column. At 560px, dense fields resolve to two columns, file facts wrap into an explicit two-row grid, status stacks, and a second export command appears directly beneath the preview so completion stays visible before the long control rail.

**The Front Plane Rule.** The file, its consequences, and the next completing action occupy the brightest and most stable region; everything else may move or recede around them.

**The Short Path Rule.** Responsive rearrangement may wrap metadata or controls, but it must not push the primary export action behind the full mobile control sequence.

## Elevation & Depth

Depth is primarily tonal and spatial, not card-based. The landing queue recedes with lower opacity, increasing horizontal offsets, wider tracking, a shallow perspective rotation, and a slowly drifting masked dust field. Most controls remain shadowless. Shadows are reserved for the two elements that physically sit above another working surface: the settings popover and the crop preview.

### Shadow Vocabulary

- **Popover Lift** (`10px 14px 34px rgba(0, 0, 0, 0.34)`): Structural elevation for the settings menu over the workspace.
- **Media Lift** (`0 18px 48px rgba(0, 0, 0, 0.3)`): A low ambient shadow beneath the crop canvas in dark mode.

**The Depth Before Boxes Rule.** First separate hierarchy with luminance, measure, spacing, and receding position. Add an enclosure only when an element truly overlays or bounds interactive media.

**The Still Foreground Rule.** Atmospheric motion belongs behind the task. The active file and controls do not drift.

## Shapes

The form language is square and cut directly into the working plane. Buttons are transparent text commands, fields are single-underlined, dividers are hairlines, the preview is a hard rectangular aperture, and status marks are small square amber pixels. The system has no rounded corners.

Crop geometry is the one drawn overlay: a two-pixel amber rectangle, one-pixel ivory rule-of-thirds guides, and four 10px square handles. This geometry communicates manipulation, not decoration.

**The No Decorative Enclosure Rule.** Do not add dashed upload borders, rounded cards, pills, capsules, or soft containers around actions that can live directly on the plane.

## Components

### Command Buttons

- **Shape:** Unboxed and square, with zero radius and no fill.
- **Primary:** Large ivory bitmap text, zero outer padding, and an amber `>` prefix. Open commands include a blinking amber block cursor.
- **Hover / Focus:** Dragging increases brightness and shifts the open plane 14px to the right over 220ms; keyboard focus uses the global two-pixel gold outline with a 4px offset.
- **Export:** Desktop export sits in the control rail; the mobile duplicate sits directly below the preview and right-aligns the same command grammar.

### Tool Navigation

- **Style:** A two-level signal queue. The upper row selects a tool group using restrained amber brackets; the lower row contains that group's transparent tool labels. Inactive items use distant dust; the active tool moves to ivory and gains an amber `>` prefix.
- **State:** Hover and active states increase tracking over 180ms. On narrow screens each row scrolls horizontally rather than wrapping into buttons or a menu.

### Option Lines

- **Style:** Aspect and resize modes are small text actions with no container. Each uses a transparent one-pixel bottom border to prevent layout shift.
- **State:** Hover and active states switch text to ivory and the underline to amber.

### Inputs / Fields

- **Style:** Transparent fill, no side or top border, one-pixel dust underline, square corners, 38px minimum height, and tabular numeric figures.
- **Focus:** The underline changes to amber while the shared keyboard outline remains visible.
- **Disabled:** Opacity falls to 0.55 and the cursor indicates waiting; contextually unavailable quality controls recede to 0.42 opacity.

### Settings Popover

- **Shape:** A square 320px overlay with a one-pixel dust border and 22px internal padding.
- **Background:** Uses the current void, keeping the popover inside the same world rather than creating a card theme.
- **Depth:** The structural popover shadow is the only strong elevated-container shadow.

### Preview Plane

- **Shape:** A hard rectangular canvas with a one-pixel ash border and no radius.
- **Behavior:** The media remains centered within a black aperture. An amber crop rectangle, ivory thirds, and square handles expose consequences directly on the file.
- **Readout:** Coordinates sit below the preview, right-aligned on desktop and evenly distributed on mobile.

### File and Status Lines

- **Style:** File metadata, privacy proof, and system state use low-contrast, tracked, tabular labels divided only by hairlines.
- **Local proof:** A 7px amber square precedes “local only” or “local processing.” Errors alone switch to the danger color.

## Do's and Don'ts

### Do:

- **Do** preserve one unmistakably bright working plane and push subordinate tools back through the ash ladder.
- **Do** use amber sparingly for the active path, local-processing proof, manipulation handles, progress, and successful completion.
- **Do** keep actions as direct text commands with visible keyboard focus and unambiguous active states.
- **Do** keep export adjacent to the preview on small screens and in the control rail on wider screens.
- **Do** preserve theme parity, tabular figures, reduced-motion handling, and the horizontal mobile tool queue.

### Don't:

- **Don't** introduce rounded cards, pills, gradients, glass effects, or a dashed upload box.
- **Don't** use shadows to manufacture hierarchy that brightness, spacing, and depth ranking already express.
- **Don't** add a second accent or spread amber across decorative surfaces.
- **Don't** replace the bitmap face with a generic product sans-serif or simulate hierarchy with multiple weights.
- **Don't** animate the active file plane; atmosphere can drift, but work stays still.
