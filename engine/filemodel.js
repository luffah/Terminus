/*
 *   Define default properties on File object
 *
 *   Eventable -> Statable ->_
 *                POable   -' '->  FileModel -> File
 *
 *
 *   Following structure is not modified :
 *
 *   File -> |-> Room
 *           |-> Link (to a room or an item)
 *           |-> Item (executable) -> People
 *
 **/
class FileModel extends Statable {
  constructor (prop) {
    super(prop)
    POable.prototype.init.apply(this)
    this.pic_shown_in_ls = true
  }
  set (prop) {
    POable.prototype.set.call(this, prop)
    if (prop.music) this.music = prop.music
    if (prop.img) this.img = prop.img
    if (prop.pic_shown_in_ls) this.pic_shown_in_ls = prop.pic_shown_in_ls
    recordAssetRef(prop, this)
    super.set(prop)
  }
}
FileModel.prototype.default = { owner: 'user', group: 'user', mod: 'a+r' }
inject(FileModel.prototype, POable.prototype, (k) => k !== 'set')

function recordAssetRef (prop, obj) {
  Object.keys(RES).forEach(t => {
    if (prop[t]) {
      if (RES[t][prop[t]]) {
        let files = RES[t][prop[t]].files || {}
        files[obj.name] = obj
        RES[t][prop[t]].files = files
      } else {
        console.log(t, prop[t], 'not found for', this.name, this)
      }
    }
  })
}
