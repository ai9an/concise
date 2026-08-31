export type Rgb = { r: number; g: number; b: number; transparent?: boolean }

export function edgeSample(image: ImageData): Rgb {
  const { data, width, height } = image
  const inset = Math.max(1, Math.floor(Math.min(width, height) * 0.015))
  const span = Math.max(2, Math.floor(Math.min(width, height) * 0.035))
  const samples: Rgb[] = []
  let transparentSamples = 0
  let totalSamples = 0

  for (const origin of [
    [inset, inset],
    [width - inset - span, inset],
    [inset, height - inset - span],
    [width - inset - span, height - inset - span],
  ]) {
    for (let y = Math.max(0, origin[1]); y < Math.min(height, origin[1] + span); y += 2) {
      for (let x = Math.max(0, origin[0]); x < Math.min(width, origin[0] + span); x += 2) {
        const offset = (y * width + x) * 4
        totalSamples += 1
        if (data[offset + 3] <= 24) transparentSamples += 1
        else samples.push({ r: data[offset], g: data[offset + 1], b: data[offset + 2] })
      }
    }
  }

  if (transparentSamples > totalSamples * 0.55) return { r: 0, g: 0, b: 0, transparent: true }
  if (samples.length === 0) return { r: 255, g: 255, b: 255 }
  samples.sort((a, b) => a.r + a.g + a.b - (b.r + b.g + b.b))
  const middle = samples[Math.floor(samples.length / 2)]
  return middle
}

export function pixelColor(image: ImageData, x: number, y: number): Rgb {
  const safeX = Math.max(0, Math.min(image.width - 1, Math.floor(x)))
  const safeY = Math.max(0, Math.min(image.height - 1, Math.floor(y)))
  const offset = (safeY * image.width + safeX) * 4
  return image.data[offset + 3] <= 24
    ? { r: 0, g: 0, b: 0, transparent: true }
    : { r: image.data[offset], g: image.data[offset + 1], b: image.data[offset + 2] }
}

export function removeConnectedBackground(
  source: ImageData,
  sample: Rgb,
  tolerance: number,
  feather: number,
  greenScreen: boolean,
) {
  const { width, height } = source
  const pixels = width * height
  const output = new ImageData(new Uint8ClampedArray(source.data), width, height)
  const visited = new Uint8Array(pixels)
  const queue = new Int32Array(pixels)
  const outer = Math.max(tolerance, tolerance + feather)
  const outerSquared = outer * outer
  let head = 0
  let tail = 0

  const distanceSquared = (index: number) => {
    const offset = index * 4
    if (sample.transparent) return source.data[offset + 3] <= 24 ? 0 : Number.POSITIVE_INFINITY
    const red = source.data[offset] - sample.r
    const green = source.data[offset + 1] - sample.g
    const blue = source.data[offset + 2] - sample.b
    return red * red + green * green + blue * blue
  }

  const enqueue = (index: number) => {
    if (visited[index]) return
    const offset = index * 4
    if (source.data[offset + 3] > 8 && distanceSquared(index) > outerSquared) return
    visited[index] = 1
    queue[tail++] = index
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x)
    enqueue((height - 1) * width + x)
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width)
    enqueue(y * width + width - 1)
  }

  while (head < tail) {
    const index = queue[head++]
    const x = index % width
    const y = Math.floor(index / width)
    const offset = index * 4
    const distance = Math.sqrt(distanceSquared(index))
    const removal = feather <= 0 || distance <= tolerance
      ? 1
      : Math.max(0, 1 - (distance - tolerance) / feather)
    output.data[offset + 3] = Math.round(source.data[offset + 3] * (1 - removal))

    if (x > 0) enqueue(index - 1)
    if (x + 1 < width) enqueue(index + 1)
    if (y > 0) enqueue(index - width)
    if (y + 1 < height) enqueue(index + width)
  }

  if (greenScreen) {
    for (let index = 0; index < pixels; index += 1) {
      const offset = index * 4
      const alpha = output.data[offset + 3] / 255
      output.data[offset] = Math.round(output.data[offset] * alpha)
      output.data[offset + 1] = Math.round(output.data[offset + 1] * alpha + 255 * (1 - alpha))
      output.data[offset + 2] = Math.round(output.data[offset + 2] * alpha)
      output.data[offset + 3] = 255
    }
  }

  return output
}
