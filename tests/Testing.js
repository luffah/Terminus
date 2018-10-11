// import { Seq } from 'engine'
var TESTING = false
var testSequence = new Seq()
function doTest () {
  testSequence.next()
}
function addTest (fu) {
  TESTING = true
  testSequence.then(fu)
}
