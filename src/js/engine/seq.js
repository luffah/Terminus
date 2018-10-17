function Seq (list) {
  this.seq = d(list, [])
  this.idx = 0
}
Seq.prototype = {
  then: function (fu) {
    this.seq.push(fu)
    return this
  },
  next: function () {
    let t = this
    t.idx++
    let r = t.seq.shift()
    if (r instanceof Function) { r(function () { t.next() }); return true }
    return r
  },
  length: function () {
    return this.seq.length
  },
  getIdx: function () {
    return this.idx
  }
}
