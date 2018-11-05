
function RoomLink (linkname, file, text, picname, prop) {
  prop = prop || {}
  Link.call(this, linkname || _(PO_DEFAULT_LINK, []), picname, prop)
  this.enter_callback = prop.enterCallback || null
  this.children = file.children
  this.items = file.items
}

function Link (linkname, file, text, picname, prop) {
  File.call(this, linkname || _(PO_DEFAULT_LINK, []), picname, prop)
  this.link = file
}
