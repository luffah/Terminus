function Context(users, currentuser, room, variables){
  this.currentuser=currentuser;
  this.users=users;
  this.user=this.users[this.currentuser];
  this.room=room;
  this.variables=variables;
}
Context.prototype = {
  stringify(){
    return JSON.stringify({
      u:this.currentuser,
      us:this.users,
      r:this.room.stringify(),
      v:this.variables
    });
  },
  traversee(path, mod){
    return this.room.traversee(path, this, mod)
  },
  addGroup(grp){
    this.user.groups.push(grp);
  },
  hasGroup(grp){
    return this.user.groups.indexOf(grp)>-1;
  },
  setUserName(val){
    if (val.length) {
      this.users[val]=this.users[this.currentuser];
      delete this.users[this.currentuser];
      this.currentuser=val;
      this.user=this.users[this.currentuser];
      File.prototype.user=this.currentuser;
    }
  },
  setUserAddress(val){
    if (val.length) this.user.address=val;
  },
  getCommand(cmdname){
    if (cmdname.match(/^(\.\/|\/)/)) { // find a local program
      // console.log('matched')
      let tr = this.room.traversee(cmdname)
      if (tr.item && tr.item.ismod('x', ctx)) {
        return tr.item
      }
    }
    cmd = global_commands_fu[cmdname]
    if (cmd && cmd.ismod('x', this)) return cmd
  },
  hasRightForCommand(cmdname) {
    let cmd = getCommand(cmdname)
    return cmd && cmd.ismod('x', this)
  },
  getCommands () {
    var ret = []
    var cmd; var i; var r = this.room
    for (i = 0; i < r.items.length; i++) {
      if (r.items[i].ismod('x', this)) {
        ret.push('./' + r.items[i].name)
      }
    }
    return ret.concat(
        Object.keys(global_commands_fu).filter((c) => global_commands_fu[c].ismod('x', this))
    )
  }
}
Context.parse = function(str){
  if (def(str)){
    jsonable = JSON.parse(str);
    return new Context(jsonable.us, jsonable.u, Room.parse(jsonable.r),jsonable.v);
  } else {
    return undefined;
  }
}

