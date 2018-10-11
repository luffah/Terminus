function Context(users, currentuser, room, variables){
  this.currentuser=currentuser;
  this.users=users;
  this.user=this.users[this.currentuser];
  this.room=room;
  this.variables=variables;
}
Context.prototype = {
  stringify:function(){
    return JSON.stringify({
      u:this.currentuser,
      us:this.users,
      r:this.room.stringify(),
      v:this.variables
    });
  },
  addGroup(grp){
    this.users[this.currentuser].groups.push(grp);
  },
  hasGroup(grp, ctx){
    return this.users[this.currentuser].groups.indexOf(grp)>-1;
  },
  setUserName(val){
    if (val.length) {
      this.users[val]=this.users[this.currentuser];
      delete this.users[this.currentuser];
      this.currentuser =val;
      this.user=this.users[this.currentuser];
    }
  },
  setUserAddress(val){
    if (val.length) this.users[this.currentuser].address=val;
  }
}
Context.parse = function(str){
  if (def(str)){
    jsonable = JSON.parse(str);
    return new Context(jsonable.u, jsonable.us, Room.parse(jsonable.r),jsonable.v);
  } else {
    return undefined;
  }
}

