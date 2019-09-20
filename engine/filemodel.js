/*
 *   Define default properties on File object
 *
 *   Properties -> Eventable -> Statable -> POable ->  FileModel -> File
 *
 *
 *   Following structure is not modified :
 *
 *   File -> |-> Room
 *           |-> Link (to a room or an item)
 *           |-> Item (executable) -> People
 *
 **/
class FileModel extends POable {
  constructor (prop) {
    for (const k of ['group', 'owner', 'cmd', 'var']) {
      if (prop[k] === 0) prop[k] = prop.id
    }
    super(prop)
  }

  set (prop) {
    super.set(prop)
    recordAssetRef(prop, this)
  }
}

File.owner = 'user'
File.group = 'user'
File.mod = 'a+r'

function recordAssetRef (prop, obj) {
  Object.keys(RES).forEach(t => {
    if (prop[t]) {
      if (RES[t][prop[t]]) {
        const files = RES[t][prop[t]].files || {}
        files[obj.name] = obj
        RES[t][prop[t]].files = files
      } else {
        console.log(t, prop[t], 'not found for', this.name, this)
      }
    }
  })
}
