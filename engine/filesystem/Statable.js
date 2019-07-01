// var STATE = 
class Statable extends Eventable {
  set (prop) {
    let states = prop.states
    delete prop.states
    super.set(prop)
    if (states) {
      Object.keys(states).forEach((i) => {
        this.addState(i, states[i])
      })
    }
  }

  getHash () {
    let h = {}
    h['m'] = this.mod.stringify()
    h['d'] = this.hasOwnProperty('children') * 1
    h['events'] = this.cmd_event
    // TODO: revoir définition d'une sauvegarde... + alteration d'état room/file dans gamestate ?
    // h['states_']=state;
    h['img'] = this.img
    return h
  }

  apply (e) {
    let name, target
    if (typeof e === 'string') {
      name = e
      target = this
    } else {
      name = e.type
      target = e.target
    }
    this.STATE.apply(target.uid + name)
  }

  addState (name, fun) {
    this.STATE.add(this.uid + name, fun, this, name)
    this.cmd_event[name] = name
    return this
  }
}
Statable.prototype.STATE = new GameState()
