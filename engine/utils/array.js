
function inc (h, k) {
  if (h[k]) { h[k]++ } else { h[k] = 1 }
  return h[k]
}
// function add (h, k, v) {
//   if (!def(h[k])) {
//     h[k] = []
//   }
//   h[k].push(v)
// }

function pop (l, idx) {
  return (idx === -1) ? null : l.splice(idx, 1)[0]
}

function pick (l, str, attr) {
  return pop(l, l.findIndex(
    attr ? i => i[attr] === str : i => i === str
  ))
}

function addUniq (a, v) {
  if (a.indexOf(v) === -1) a.push(v)
}
// // use with filter
// function uniq (v, idx, l) {
//   return l.indexOf(value) === idx
// }
function commonprefix (arr) {
  // inspired from https://stackoverflow.com/questions/1916218/find-the-longest-common-starting-substring-in-a-set-of-strings/1917041#1917041
  let A = arr.concat().sort()
  let a1 = A[0]
  let a2 = A[A.length - 1]
  let i = 0
  while (a1.length > i && a1[i] === a2[i]) i++
  return a1.substring(0, i)
}
