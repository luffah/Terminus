
function inc (h, k) {
  if (h[k]) { h[k]++ } else { h[k] = 1 }
  return h[k]
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

function commonprefix (arr) {
  // https://stackoverflow.com/questions/1916218/find-the-longest-common-starting-substring-in-a-set-of-strings/1917041#1917041
  var A = arr.concat().sort()

  var a1 = A[0]; var a2 = A[A.length - 1]; var L = a1.length; var i = 0
  while (i < L && a1.charAt(i) === a2.charAt(i)) i++
  return a1.substring(0, i)
}
