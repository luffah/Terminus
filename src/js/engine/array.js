
function inc (h, k) {
  if (h[k]) { h[k]++ } else { h[k] = 1 }
}
function hdef (h, k, v) {
  if (!def(h[k])) {
    h[k] = []
  }
  h[k].push(v)
}
function rmIdxOf (l, str) {
  index = l.indexOf(str)
  return ((index === -1) ? null : l.splice(index, 1))
}
