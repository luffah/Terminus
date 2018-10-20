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
  traversee(path){
    return this.room.traversee(path, this)
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
    return global_commands_fu[cmdname]
  },
  hasRightForCommand(cmdname) {
    cmd = this.getCommand(cmdname)
    return ( cmd && cmd.ismod('x', this) ? (
          this.user.isRoot || this.currentuser == cmd.owner || this.user.groups.indexOf(cmd.group) > -1
          ) : false)
  },
  getUserCommands () {
    var t=this
    return Object.keys(global_commands_fu).filter((c) => t.hasRightForCommand(c))
  },
  getCommands () {
    var ret = []; var cmd; var i; var r = this.room
    for (i = 0; i < r.items.length; i++) {
      if (r.items[i].executable) {
        ret.push('./' + r.items[i].name)
      }
    }
    return ret.concat(this.getUserCommands())
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

