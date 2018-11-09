
function RoomLink (linkname, file, text, picname, prop) {
  prop = prop || {}
  prop.mod = 777
  prop.poprefix = d(prop.poprefix, POPREFIX_ROOMLINK)
  Link.call(this, linkname || _(PO_DEFAULT_LINK, []), picname, prop)
  this.link = file
  this.enter_callback = prop.enterCallback || null
  this.children = file.children
  this.items = file.items
}
RoomLink.prototype = Room.prototype

function Link (linkname, file, text, picname, prop) {
  prop = prop || {}
  prop.mod = 777
  prop.poprefix = d(prop.poprefix, POPREFIX_LINK)
  File.call(this, linkname || _(PO_DEFAULT_LINK, []), picname, prop)
  this.link = file
}
Link.prototype = File.prototype
