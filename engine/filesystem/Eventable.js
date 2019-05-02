function genUID (name) {
  return name.substr(0, 4) + inc(genUID.cnt, name)
}
genUID.cnt = {}

class Eventable {
  constructor (prop) {
    this.cmd_event = {}
    this.uid = genUID(prop.poid || prop.name)
  }

  set (prop) {
    if (prop.events) {
      Object.keys(prop.events).forEach((i) => {
        this.cmd_event[i] = (prop.events[i] || i)
      })
    }
  }

  unsetCmdEvent (cmd) {
    delete this.cmd_event[cmd]
    return this
  }

  setCmdEvent (cmd, fun) {
    this.cmd_event[cmd] = fun || cmd
    return this
  }

  fire (vt, cmd, args, idx, ct) {
    ct = ct || {}
    let f = this.tgt
    let trigger = null
    let ctx = { arg: (def(idx) ? args[idx] : null), args: args, i: idx, ct: ct }
    if (ct.unreachable_room) {
      if ((ct.unreachable_room.name in globalSpec) && (cmd in globalSpec[ct.unreachable_room.name])) {
        trigger = globalSpec[ct.unreachable_room.name][cmd]
      }
    } else if (cmd in f.cmd_event) {
      trigger = f.cmd_event[cmd]
    }
    if (trigger) {
      let ck = (typeof trigger === 'function' ? trigger(ctx, this, cmd) : trigger)
      if (ck) {
        console.log(f.uid + ' FIRE ' + ck)
        this.apply && this.apply(ck)
      }
    }
  }
}
