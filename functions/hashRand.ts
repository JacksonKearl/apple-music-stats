export const cyrb128Base = (str: string) => {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i)
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067)
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213)
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179)
  return [
    (h1 ^ h2 ^ h3 ^ h4) >>> 0,
    (h2 ^ h1) >>> 0,
    (h3 ^ h1) >>> 0,
    (h4 ^ h1) >>> 0,
  ]
}

export const hash = (str: string) => {
  const arr = cyrb128Base(str)
  return (
    ("00000000" + (arr[0] >>> 0).toString(36)).slice(-6) + // technically this drops a bit, but 2**124 is plenty.
    ("00000000" + (arr[1] >>> 0).toString(36)).slice(-6) + // log2(36)*6 = 31
    ("00000000" + (arr[2] >>> 0).toString(36)).slice(-6) +
    ("00000000" + (arr[3] >>> 0).toString(36)).slice(-6)
  )
}

export const rand = (seed: string) => {
  let [a, b, c, d] = cyrb128Base(seed)

  a >>>= 0
  b >>>= 0
  c >>>= 0
  d >>>= 0
  var t = (a + b) | 0
  a = b ^ (b >>> 9)
  b = (c + (c << 3)) | 0
  c = (c << 21) | (c >>> 11)
  d = (d + 1) | 0
  t = (t + d) | 0
  c = (c + t) | 0
  return (t >>> 0) / 4294967296
}
