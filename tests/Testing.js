// import { Seq } from 'engine'
var testSequence = new Seq()
function doTest () {
  testSequence.next()
}
function addTest (fu) {
  testSequence.then(fu)
}
