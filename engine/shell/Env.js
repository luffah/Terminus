
class Env {
  /*
   * Defined with dict h with (raw properties) :
   *   r        : current working directory
   *   me       : current user name (whoami)
   *   users    : properties for each user => {
   *                  km : { keymap.. }, // cf ../keymap.js
   *                  v: { vars.. },
   *                  a: { aliases.. },
   *                  groups: [ str.. ],
   *                  password: str
   *                  }
   *
   * Give getter and setter for current user:
   *   me       : user name as str
   *   cwd      : GET/SET current working directory
   *   user     : GET { user properties .. }
   *              SET user with name
   *   groups   : GET [ group as str.. ]
   *   km       : GET { keymap to use.. }
   *   v        : GET { current user vars.. }
   *   a        : GET { current user aliases.. }
   *   PS1      : GET prompt
   *   HOME     : GET variable HOME as dir
   *   PATH     : GET variable PATH as dir list
   *
   * */
  constructor (h) {
    // h = {users:{$name: {groups:[], v:{PATH:[],HOME:$room}}}, me:$name, r:$room}
    h = h || {}
    this.h = h
    if (this.h.fs && this.h.fixpaths){
      if (typeof this.h.r === 'string'){
        this.h.r = this.h.fs.getDir(this.h.r)
      }
      for (let u in this.h.users) {
        let user = this.h.users[u]
        for (let k in user.v){
          if (k.endsWith('PATH')){ // ensure dir are dir ?
            let paths = []
            for (let kp of user.v[k].split(':')) {
              let p = this.h.fs.getDir(kp)
              console.log(kp, p)  // FIXME check if this func is usefull
              paths.push(p ? p.path : kp)
            }
            user.v[k] = paths.join(':')
          } else if (re.dir.test(user.v[k])) {
            let p = this.h.fs.getDir(user.v[k])
            user.v[k] = p ? p.path : kp
          }
        }
        user.a = user.a || {'ll': 'ls -rtla'}
      }
    }
    console.log(h);
  }

  get cwd () { return this.h.r }

  set cwd (r) { this.h.r = r }

  get me () { return this.h.me }

  set me (u) {
    if (u.length) {
      this.h.users[u] = this.h.users[this.h.me]
      delete this.h.users[this.h.me]
      this.h.me = u
      File.prototype.user = u
    }
  }

  get user () { return (this.h.me && this.h.users[this.h.me]) }

  set user (v) { this.h.me = v; this.v = this.h.users[v].v; this.a = this.h.users[v].a }

  get groups () { return this.h.users[this.h.me].groups }

  get PATH () {
    if (!this.user.v.PATH) return []
    const ret = []
    for (let d of this.user.v.PATH.split(':')) {
      d = this.getDir(d)
      if (d) ret.push(d)
    }
    return ret
  }

  get HOME () {
    const home = this.user.v.HOME
    return (home && home[0] == '/') ? this.getDir(home) : this.h.r.root
  }

  // equiv sh command set
  get PS1 () { return (this.h.me && this.user.v.PS1) || '$&nbsp;' }

  set PS1 (v) { this.user.v.PS1 = v }

  get km () {
    return (this.h.me && this.user.km) || KEYMAP
  }

  traversee (path) {
    return this.h.r.traversee(path, this)
  }

  getDir (p) {
    return this.h.r.getDir(p, this)
  }

  addGroup (grp) {
    addUniq(this.groups, grp)
  }

  hasGroup (grp) {
    return this.groups.indexOf(grp) > -1
  }

  getCommand (cmdname) {
    const c = this
    // console.log(cmdname)
    if (cmdname.match(re.localcmd)) { // find a local program
      // console.log('matched')
      const tr = c.traversee(cmdname)
      if (tr.item && tr.item.ismod('x', c)) {
        return tr.item
      }
    }
    const cmd = Builtin.get(cmdname)
    if (cmd) return cmd
    for (const p of this.PATH.map((p) => p.getItemFromName(cmdname))) {
      if (p && p.ismod('x', this)) return p
    }
  }

  hasRightForCommand (cmdname) {
    return this.getCommand(cmdname)
  }

  getCommands () {
    let ret = []
    for (const it of this.h.r.items) {
      if (it.ismod('x', this)) ret.push('./' + it.name)
    }
    ret = ret.concat(Builtin.keys())
    for (const p of this.PATH) {
      ret = ret.concat(p.items.filter(it => it.ismod('x', this)).map(it => it.name))
    }
    return ret
  }

  stringify () {
    return JSON.stringify(Vars.stringify(this.h))
  }

  altered (h) {
    h.me = h.me || 'root';
    if (h.user) {
      h.me = h.user
      h.v = this.h.v[h.me]
      delete h.user
    }
    let newenv = new Env(Object.assign({}, this.h, h));
    return newenv;
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
      const tmph = {}
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
      const tmph = {}
      Object.keys(h).forEach((i) => {
        tmph[i] = Vars.parse(h[i])
      })
      return tmph
    }
    if (h.slice(0, 2) === 'r.') return Room.parse(h.slice(2))
    return h
  }
}
