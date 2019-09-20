var POPREFIX_CMD = 'cmd_'
var POPREFIX_ROOM = 'room_'
var POPREFIX_ITEM = 'item_'
var POPREFIX_LINK = 'link'
var POPREFIX_ROOMLINK = 'link'
var POPREFIX_PEOPLE = 'people_'
var POSUFFIX_DESC = '_text'
// var PO_NONE = 'none'
// var PO_NONE_DESC = PO_NONE + POSUFFIX_DESC
// var PO_DEFAULT_ROOM = POPREFIX_ROOM + PO_NONE
// var PO_DEFAULT_ITEM = POPREFIX_ITEM + PO_NONE
// var PO_DEFAULT_LINK = POPREFIX_LINK
// var PO_DEFAULT_ROOMLINK = POPREFIX_ROOMLINK
// var PO_DEFAULT_PEOPLE = POPREFIX_PEOPLE + PO_NONE
// var PO_DEFAULT_ROOM_DESC = POPREFIX_ROOM + PO_NONE_DESC
// var PO_DEFAULT_ITEM_DESC = POPREFIX_ITEM + PO_NONE_DESC
// var PO_DEFAULT_PEOPLE_DESC = POPREFIX_PEOPLE + PO_NONE_DESC
var globalSpec = {}

class Room extends File {
  constructor (prop) {
    prop = inject({ mod: 755 }, prop)
    prop.poprefix = prop.poprefix || POPREFIX_ROOM
    // console.log('room ' + prop.id, prop.var)
    super(prop)
    this.effects = { key: {} }
    // name || _(PO_DEFAULT_ROOM),
    // text || _(PO_DEFAULT_ROOM_DESC),
  }

  set (prop) {
    const peoples = prop.peoples
    const items = prop.items
    const children = prop.children
    const tree = prop.tree
    delete prop.items
    delete prop.peoples
    delete prop.children
    delete prop.tree
    super.set(prop)
    if (!this.peoples) this.peoples = []
    if (!this.items) this.items = []
    if (!this.children) this.children = []
    // if (prop.starterMsg) this.starter_msg = prop.starterMsg
    // if (prop.lost) this.lost = prop.lost
    // if (prop.enterCallback) this.enterCallback = prop.enterCallback
    // if (prop.leaveCallback) this.leaveCallback = prop.leaveCallback
    // if (prop.pic_shown_as_item) this.pic_shown_as_item = prop.pic_shown_as_item
    if (items) {
      Object.keys(items).forEach((i) => {
        const m = i.match(re.batch)
        if (m) this.newItemBatch(m[1], m[2].split(','), items[i])
        else this.newItem(i, items[i])
      })
    }
    if (peoples) {
      Object.keys(peoples).forEach((i) => {
        this.newPeople(i, peoples[i])
      })
    }
    if (children) {
      Object.keys(children).forEach((i) => {
        this.newRoom(i, children[i])
      })
    }
    if (tree) {
      Object.keys(tree).forEach((i) => {
        this.newRoom(i, tree[i])
      })
    }
    return this
  }

  isRoot () { return !this.room }

  getDoors () { return this.tgt.children }

  getItems () { return this.tgt.items.filter((o) => !(o instanceof People)) }

  getPeoples () { return this.tgt.items.filter((o) => (o instanceof People)) }

  // a message displayed on game start
  set starterMsg (txt) { this.tgt.starter_msg = txt; return this.tgt }

  get starterMsg () {
    if (this.tgt.starter_msg) {
      return this.tgt.starter_msg
    } else {
      return _(POPREFIX_CMD + 'pwd', [this.tgt.name]).concat('\n').concat(this.tgt.text)
    }
  }

  // sub room management
  getChildFromName (name) {
    return this.children.find(c => c.name === name)
  }

  hasChild (child) { return this.getChildFromName(child.name) }

  addDoor (f, wayback = true) {
    if (f) {
      let i = 0
      const name = f.name
      while (this.children.find(c => c.name === f.name)) {
        f.name = name + '.' + (++i)
      }
      this.children.push(f)
      if (wayback) {
        f.room = this.tgt
      }
    }
    return this.tgt
  }

  removeDoor (child) { if (pick(this.children, child.uid, 'uid')) { child.room = null } }

  destroy () { pick(this.room.children, this.uid, 'uid'); this.room = null }

  get root () { return (this.tgt.room ? this.tgt.room.root : this.tgt) }

  next (arg, env) { /* Resolve a path step */
    let r = null

    if (arg === '~') r = env.v.HOME || env.cwd.root
    else if (arg === '..') r = this.room
    else if (arg === '.') r = this
    else if (arg && !arg.includes('/')) r = this.tgt.children.find((i) => arg === i.toString())

    return r || null
  }

  getDir (path, env) {
    // returns room associated to the path,
    if (!path.length) return null
    let room = this.tgt
    if (path[0] === '/') {
      room = this.root
      path = path.slice(1)
    }
    path = path.replace(/\/$/, '')
    path.split('/').findIndex((r) => !(room = room.next(r, env)))
    return room
  }

  // callback when entering in the room
  setLeaveCallback (fu) { this.tgt.leaveCallback = fu; return this }

  doLeaveCallbackTo (to) {
    const r = this
    // console.log(r.toString(), 'doLeaveCallbackTo', to.toString())
    if (r.uid !== to.uid && r.room) {
      if (typeof r.leaveCallback === 'function') {
        r.leaveCallback()
      }
      r.room.doLeaveCallbackTo(to)
    }
  }

  setEnterCallback (fu) { this.tgt.enterCallback = fu; return this }

  doEnterCallbackTo (to) {
    const r = this
    if (r.uid === to.uid) {
    } else if (r.children.length) {
      if (typeof r.enterCallback === 'function') {
        r.enterCallback()
      }
      if (r.room) {
        r.room.doEnterCallbackTo(to)
      }
    }
  }

  isParentOf (par) { return par.room && (par.room.uid === this.uid || this.isParentOf(par.room)) }

  setOutsideEvt (name, fun) { globalSpec[this.name][name] = fun; return this }

  unsetOutsideEvt (name) { delete globalSpec[this.name][name]; return this }

  isEmpty () { return (this.tgt.children.length === 0 && this.tgt.items.length === 0) }

  /* Returns the room and the item corresponding to the path
   * if item is null, then the path describe a room and  room is the full path
   * else room is the room containing the item */
  traversee (path, env) {
    const [room, lastcomponent] = this.pathToRoom(path, env)
    const ret = { room: room, item_name: lastcomponent, item_idx: -1 }
    if (room) {
      ret.room_name = room.name
      if (lastcomponent) {
        ret.item = ret.room.tgt.items.find((it, i) =>
          lastcomponent === it.toString() && (ret.item_idx = i) + 1)
      }
    }
    return ret
  }

  checkAccess (env) {
    const c = env.cwd.tgt
    const r = this.tgt
    if (c.uid === r.uid) {
      return true
    } else if (r.isParentOf(c)) {
      return r.ismod('x', env)
    } else if (c.isParentOf(r)) {
      return r.ismod('x', env) && r.room.checkAccess(env)
    } else {
      return r.ismod('x', env) && (!r.room || r.room.checkAccess(env))
    }
  }

  pathToRoom (path, env) {
    // returns [ room associated to the path,
    //           non room part of path,
    //           valid path ]
    let room = this.tgt
    let pathstr = ''
    if (path[0] === '/') {
      room = this.root
      pathstr = '/'
    }
    path = path.replace(/\/$/, '')
    if (!path.length) return [room, null, pathstr]
    const pat = path.split('/')
    const end = pat.slice(0, -1).findIndex((r) => !(room = room.next(r, env)))
    let lastcomponent = null
    let cancd
    pathstr += pat.slice(0, end).join('/')
    if (room) {
      lastcomponent = pat.pop() || null
      cancd = room.next(lastcomponent, env)
      if (cancd) {
        room = cancd
        pathstr += (end <= 0 ? '' : '/') + lastcomponent + '/'
        lastcomponent = null
      }
    }
    return [room, lastcomponent, pathstr]
  }

  find (regex, depth, fullpath, type) {
    depth = depth || 99
    let files = []
    if (type != 'dir') {
      for (const i of this.items.concat(this.peoples)) {
        if (!regex || regex.test(fullpath ? i.relativepath(this) : i.name)) files.push(i)
      }
    }
    if (depth > 1) {
      for (const i of this.children) {
        if (type != 'file' && (!regex || regex.test(fullpath ? i.relativepath(this) : i.name))) files.push(i)
        files = files.concat(i.find(regex, depth - 1, fullpath, type))
      }
    }
    return files
  }

  // item & people management
  addItem (f) {
    if (f) {
      let i = 0
      const name = f.name
      while (this.tgt.items.find(it => it.name === f.name)) {
        f.name = name + '.' + (++i)
      }
      this.tgt.items.push(f)
      f.room = this.tgt
    }
    return this.tgt
  }

  removeItemByIdx (idx) {
    return pop(this.tgt.items, idx)
  }

  removeItemByName (name) {
    return pick(this.tgt.items, name, 'name')
  }

  hasItem (name, args, prefix) {
    const n = _((prefix || POPREFIX_ITEM) + name, args || [])
    return this.tgt.items.find(i => i.name === n)
  }

  removeItem (name, args, prefix) {
    return this.tgt.removeItemByName(_((prefix || POPREFIX_ITEM) + name, args || []))
  }

  hasPeople (name, args) {
    return this.tgt.hasItem(name, args, POPREFIX_PEOPLE)
  }

  removePeople (name, args) {
    return this.tgt.removeItem(name, args, POPREFIX_PEOPLE)
  }

  getItemFromName (name) {
    return this.tgt.items.find(i => i.name === name)
  }

  // PO ready room and item definition
  newItemBatch (id, names, prop) {
    const ret = []
    prop = prop || {}
    for (let i = 0; i < names.length; i++) {
      prop.poid = id
      prop.id = id + names[i]
      prop.povars = [names[i]]
      ret[i] = new Item(prop)
      this.tgt.addItem(ret[i])
    }
    return ret
  }

  newItem (id, prop) {
    const ret = new Item(inject({ poid: id, id: id }, prop))
    this.tgt.addItem(ret)
    return ret
  }

  newPeople (id, prop) {
    const ret = new People(inject({ poid: id, id: id }, prop))
    this.tgt.addItem(ret)
    return ret
  }

  newLink (id, prop) {
    if (!prop.tgt) return undefined
    const ret = new Link(inject({ poid: id, id: id }, prop))
    if (prop.tgt instanceof Room) {
      this.tgt.addDoor(ret)
    } else {
      this.tgt.addItem(ret)
    }
    return ret
  }

  newRoom (id, prop) {
    const ret = newRoom(id, prop)
    this.tgt.addDoor(ret)
    return ret
  }

  addRoom (id, prop) {
    this.tgt.addDoor(newRoom(id, prop))
    return this
  }

  static enter (r, env) {
    // console.log('enterRoom', r, env)
    const prev = env.cwd
    if (prev && !prev.isParentOf(r)) {
      prev.doLeaveCallbackTo(r)
    }
    env.cwd = r
    if (!r.lost) {
      r.STATE.saveEnv(env)
    }
    if (r.music) {
      vt.playMusic(r.music, { loop: true })
    }
    if (typeof r.enterCallback === 'function') {
      r.enterCallback(r, env)
    }
    if (typeof r.effects.enter_room === 'function') {
      r.effects.enter_room(r, env)
    // } else if (typeof vt.effects.enter_room === 'function') {
      // vt.effects.enter_room(r, vt)
    }
    return [r.toString(), r.text]
  }
}
function newRoom (id, prop) {
  // this function automatically set the variable $id to ease game saving
  return new Room(inject({ poid: id, id: id, var: ('$' + id) }, prop || {}))
}
