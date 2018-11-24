class Context {
  constructor(h){
    // h = {users:{$name: {groups:[]}}, me:$name, r:$room,  v:{PATH:[],HOME:$room} }
    h.users = h.users || {}
    if (! h.users[h.me]){
      h.users[h.me] = {groups:[]}
    }
    if (! h.r) h.r = h.v.HOME
    this.h=h
  }
  get r(){ return this.h.r }
  set r(r){ this.h.r = r }
  get vars() { return this.h.v }
  set me(u){
    if (u.length) {
      this.h.users[u]=this.h.users[this.h.me];
      delete users[this.h.me];
      this.h.me=val;
      File.prototype.user=val;
    }
  }
  get me(){return this.h.me}
  get user() { return this.h.users[this.h.me] }
  traversee(path){
    return this.h.r.traversee(path, this)
  }
  getDir(p){
    return this.h.r.getDir(p, this)
  }
  addGroup(grp){
    addUniq(this.user.groups,grp)
  }
  hasGroup(grp){
    return this.user.groups.indexOf(grp)>-1;
  }
  getCommand(cmdname){
    if (cmdname.match(/^(\.\/|\/)/)) { // find a local program
      let tr = this.traversee(cmdname)
      if (tr.item && tr.item.ismod('x', ctx)) {
        return tr.item
      }
    }
    let cmd = Builtin.get(cmdname)
    if (cmd) return cmd
    if (this.h.v.PATH){
      let p=this.h.v.PATH
      let it
      for (let i=0; i < p.length; i++){
        it = p[i].getItemFromName(cmdname)
        if (it && it.ismod('x', this)) return it
      }
    }
  }
  hasRightForCommand(cmdname) {
    return this.getCommand(cmdname)
  }
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
  }
  stringify(){
    return JSON.stringify(Vars.stringify(this.h))
  }
  static parse(str) {
    return str ? new Context(Vars.parse(JSON.parse(str))) : null
  }
}

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
        return tmph
      }
      if (h.slice(0,2) == 'r.') return Room.parse(h.slice(2))
      return h
  }
}
