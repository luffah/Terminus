
function Link (linkname, file, picname, prop) {
  prop = prop || {}
  prop.mod = 777
  prop.poprefix = prop.poprefix || ((file instanceof Room) ? POPREFIX_ROOMLINK : POPREFIX_LINK)
  prop.picname = picname
  prop.link = file
  File.call(this, linkname || _(PO_DEFAULT_LINK, []), undefined, prop)
}
RoomLink = Link
Link.prototype = File.prototype
RoomLink.prototype = Room.prototype
