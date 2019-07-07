class Eventable extends Properties {
  constructor (prop) {
    super(prop)
    this.cmd_event = {}
  }

  set (prop) {
    let events = prop.events
    delete prop.events
    super.set(prop)
    if (events) {
      Object.keys(events).forEach((i) => {
        this.cmd_event[i] = (events[i] || i)
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

  fire (cmd, args, env, sys, idx) {
    let ct = env.cwd || {}
    let f = this.tgt
    let trigger = null
    let ctx = { arg: (def(idx) ? args[idx] : null), args: args, i: idx, env: env, sys: sys }
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
