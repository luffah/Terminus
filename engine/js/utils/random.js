function randomSort () {
  return 0.5 - Math.random()
}
function shuffleStr (src, complexity) {
  const chars = ' #$)~._-(\\/^&abcdefghijklmnopqrstuvwxyz -0123456789'
  const randsArr = chars.repeat(src.length).split('').sort(randomSort)
  let ret = ''
  for (let i = 0; i < src.length; i++) {
    ret += (Math.random() > complexity ? src[i] : randsArr.shift())
  }
  return ret
}
function randomStr (length) {
  var randsArr = (' #$)~._-(\\/^&abcdefghijklmnopqrstuvwxyz -0123456789').repeat(length).split('').sort(randomSort)
  return randsArr.slice(0, length).join('')
}
