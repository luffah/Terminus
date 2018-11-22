function Context(h){
  // h = {users:{name: {groups:[]}}, me:name, v:{PATH:[],HOME:room} }
  h.v = h.v || {}
  this.h=h
  this.user=h.users[h.me]
}
Context.prototype = {
  traversee(path, mod){
    return this.h.r.traversee(path, this, mod)
  },
  getDir(p){
    return this.h.r.getDir(p, this)
  },
  addGroup(grp){
    this.user.groups.push(grp);
  },
  hasGroup(grp){
    return this.user.groups.indexOf(grp)>-1;
  },
  setUserName(val){
    if (val.length) {
      this.users[val]=this.users[this.me];
      delete this.users[this.me];
      this.me=val;
      this.user=this.users[val];
      File.prototype.user=val;
    }
  },
  setUserAddress(val){
    if (val.length) this.user.address=val;
  },
  getCommand(cmdname){
    if (cmdname.match(/^(\.\/|\/)/)) { // find a local program
      let tr = this.room.traversee(cmdname)
      if (tr.item && tr.item.ismod('x', ctx)) {
        return tr.item
      }
    }
    cmd = Builtin.get(cmdname)
    if (cmd) return cmd
    if (this.h.v.PATH){
      let p=this.h.v.PATH
      let it
      for (let i=0; i < p.length; i++){
        it = p[i].getItemFromName(cmdname)
        if (it && it.ismod('x', this)) return it
      }
    }
  },
  hasRightForCommand(cmdname) {
    return this.getCommand(cmdname)
  },
  getCommands () {
    let ret = []
    let i
    let r = this.h.r
    for (i = 0; i < r.items.length; i++) {
      if (r.items[i].ismod('x', this)) {
        ret.push('./' + r.items[i].name)
      }
    }
    ret = ret.concat(Builtin.keys())
    if (this.h.v.PATH){
      let p=this.h.v.PATH
      let it
      for (i=0; i < p.length; i++){
        ret = ret.concat(p[i].items.filter(it=>it.ismod('x',this)).map(it=>it.name))
      }
    }
    return ret
  },
  stringify(){
    return JSON.stringify(Vars.stringify(this.h))
  }
}
Context.parse = (str) => str ? new Context(Vars.parse(JSON.parse(str))) : null

Vars={
  stringify(h){
      if (h instanceof Room) return 'r.' + h.stringify()
      if (Array.isArray(h)) return h.map(i => Vars.stringify(i))
      if (h instanceof Object) {
        let tmph = {}
        Object.keys(h).forEach((i) => {
          tmph[i] = Vars.stringify(h[i])
        })
        return tmph
      }
      return h
  },
  parse(h){
      if (Array.isArray(h)) return h.map(i => Vars.parse(i))
      if (h instanceof Object) {
        let tmph = {}
        Object.keys(h).forEach((i) => {
          tmph[i] = Vars.parse(h[i])
        })
        tmph[i] = h[i]
        return tmph
      }
      if (h.slice(O,2) = 'r.') return Room.parse(h.slice(2))
      return h
  }
}
