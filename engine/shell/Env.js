class Env {
  constructor (h) {
    // h = {users:{$name: {groups:[]}}, me:$name, r:$room,  v:{PATH:[],HOME:$room} }
    h = h || {}
    h.users = h.users || {}
    if (!h.users[h.me]) {
      h.users[h.me] = { groups: [] }
    }
    if (!h.r && h.v) h.r = h.v.HOME
    this.h = h
    this.km = h.keymap || KEYMAP
  }
  set shell (sh) { this.sh = sh }
  get shell () { return this.sh }
  get cwd () { return this.h.r }
  get r () { return this.h.r }
  set cwd (r) { this.h.r = r }
  set r (r) { this.h.r = r }
  get get () { return this.h.v }
  get vars () { return this.h.v }
  set me (u) {
    if (u.length) {
      this.h.users[u] = this.h.users[this.h.me]
      delete this.h.users[this.h.me]
      this.h.me = u
      File.prototype.user = u
    }
  }
  get PS1 () { return '$&nbsp;' }
  get me () { return this.h.me }
  get user () { return this.h.users[this.h.me] }
  traversee (path) {
    return this.h.r.traversee(path, this)
  }
  getDir (p) {
    return this.h.r.getDir(p, this)
  }
  addGroup (grp) {
    addUniq(this.user.groups, grp)
  }
  hasGroup (grp) {
    return this.user.groups.indexOf(grp) > -1
  }
  getCommand (cmdname) {
    let c = this
    if (cmdname.match(re.localcmd)) { // find a local program
      let tr = c.traversee(cmdname)
      if (tr.item && tr.item.ismod('x', c)) {
        return tr.item
      }
    }
    let cmd = Builtin.get(cmdname)
    if (cmd) return cmd
    if (this.h.v.PATH) {
      let it
      for (let p of this.h.v.PATH) {
        it = p.getItemFromName(cmdname)
        if (it && it.ismod('x', this)) return it
      }
    }
  }
  hasRightForCommand (cmdname) {
    return this.getCommand(cmdname)
  }
  getCommands () {
    let ret = []
    let r = this.h.r
    for (let it of r.items) {
      if (it.ismod('x', this)) {
        ret.push('./' + it.name)
      }
    }
    ret = ret.concat(Builtin.keys())
    if (this.h.v.PATH) {
      for (let p of this.h.v.PATH) {
        ret = ret.concat(p.items.filter(it => it.ismod('x', this)).map(it => it.name))
      }
    }
    return ret
  }
  stringify () {
    return JSON.stringify(Vars.stringify(this.h))
  }
  static parse (str) {
    return str ? new Env(Vars.parse(JSON.parse(str))) : null
  }
}

var Vars = {
  stringify (h) {
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
  parse (h) {
    if (Array.isArray(h)) return h.map(i => Vars.parse(i))
    if (h instanceof Object) {
      let tmph = {}
      Object.keys(h).forEach((i) => {
        tmph[i] = Vars.parse(h[i])
      })
      return tmph
    }
    if (h.slice(0, 2) === 'r.') return Room.parse(h.slice(2))
    return h
  }
}
