class Modes {
  constructor () {
    this.modes = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  }

  parse (chmo) {
    if (typeof chmo === 'number') {
      chmo = String(chmo)
    }
    if (isNaN(chmo)) {
      let curscope = []
      let change = 1
      chmo.split('').forEach(i => {
        if (i === 'a') {
          curscope = [0, 1, 2]
        } else if (i === '+') {
          change = 1
        } else if (i === '-') {
          change = 0
        } else {
          const scope = 'ugo'.indexOf(i)
          if (scope !== -1) {
            curscope.push(scope)
          } else {
            (curscope.length ? curscope : [0, 1, 2])
              .forEach((s) => {
                this.modes[s]['rwx'.indexOf(i)] = change
              })
          }
        }
      })
    } else {
      this.modes = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
      for (let i = 0; i < chmo.length; i++) {
        this.modes[i] = [chmo[i] & 4, chmo[i] & 2, chmo[i] & 1]
      }
    }
  }

  get (scope, right) {
    return this.modes['ugo'.indexOf(scope)]['rwx'.indexOf(right)]
  }

  stringify () {
    return this.modes.map((i) => (i[0] ? 4 : 0) + (i[1] ? 2 : 0) + (i[2] ? 1 : 0)).join('')
  }
}
