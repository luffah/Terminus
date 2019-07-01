class Seq {
  constructor (list) {
    this.seq = this._getlist(list)
    this.idx = 0
    this.current = this.seq[0]
  }
  _getlist (it) {
    let list = []
    if (it instanceof Seq) {
      list = it.seq
    } else if (it instanceof Array) {
      list = it
    } else if (it) {
      list = [it]
    }
    return list
  }
  then (fu) {
    this.seq.push(fu)
    return this
  }
  infect (idx, fu) {
    if (idx < 0) { idx = this.seq.length + idx }
    if (this.seq[idx]) {
      fu(this.seq[idx])
    }
  }
  append (it) {
    this.seq = this.seq.concat(this._getlist(it))
  }
  next () {
    let t = this
    let r = t.seq.shift()
    if (r) {
      let idx = t.idx
      t.idx++
      if (r instanceof Function) { r(function () { t.next() }); return true }
      r.__index__ = idx
    }
    return r
  }
  [Symbol.iterator]() {
    let t = this
    return {
      next() {
        let ret = {value: t.next(), done: true}
        if (ret.value) {
          ret.done = false
        }
        return ret
      }
    }
  }
  get length() {
    return this.seq.length
  }
  getIdx () {
    return this.idx
  }
}
