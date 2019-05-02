function Seq (list) {
  this.seq = this._getlist(list)
  this.idx = 0
}
Seq.prototype = {
  _getlist: function (it) {
    let list = []
    if (it instanceof Seq) {
      list = it.seq
    } else if (it instanceof Array) {
      list = it
    } else if (it) {
      list = [it]
    }
    return list
  },
  then: function (fu) {
    this.seq.push(fu)
    return this
  },
  infect: function (idx, fu) {
    if (idx < 0) { idx = this.seq.length + idx }
    if (this.seq[idx]) {
      fu(this.seq[idx])
    }
  },
  append: function (it) {
    this.seq = this.seq.concat(this._getlist(it))
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
