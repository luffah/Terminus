function Modes () {
  this.modes = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
}
Modes.prototype = {
  _rightidx: { r: 0, w: 1, x: 2 },
  _scopeidx: { u: 0, g: 1, o: 2 },
  parse: function (chmo) {
    if (typeof chmo === 'number') {
      chmo = String(chmo)
    }
    if (isNaN(chmo)) {
      let curscope = []
      let change = 1
      for (let n = 0; n < chmo.length; n++) {
        let i = chmo[n]
        if (i == 'a') {
          curscope = [0, 1, 2]
        } else if ('ugo'.indexOf(i) != -1) {
          curscope.push(this._scopeidx[i])
        } else if (i == '+') {
          change = 1
        } else if (i == '-') {
          change = 0
        } else {
          (curscope.length ? curscope : [0, 1, 2])
            .forEach((s) => {
              this.modes[s][this._rightidx[i]] = change
            })
        }
      }
    } else {
      this.modes = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
      for (let i = 0; i < chmo.length; i++) {
        this.modes[i] = [chmo[i] & 4, chmo[i] & 2, chmo[i] & 1]
      }
    }
  },
  get: function (scope, right) {
    return this.modes[this._scopeidx[scope]][this._rightidx[right]]
  },
  stringify: function () {
    return this.modes.map((i) => (i[0] ? 4 : 0) + (i[1] ? 2 : 0) + (i[2] ? 1 : 0)).join('')
  }
}
