
class Link extends Room {
  constructor (prop) {
    prop = inject({ mod: 777, link: prop.tgt }, prop)
    prop.poprefix = prop.poprefix || ((prop.link instanceof Room) ? POPREFIX_ROOMLINK : POPREFIX_LINK)
    // linkname || _(PO_DEFAULT_LINK, [])
    super(prop)
  }

  get exec () { return this.tgt.exec }

  get syntax () { return this.tgt.syntax }

  set (prop) {
    if (prop.link) {
      this.link = prop.link
      this.tgt = prop.link
    }
    delete prop.link
    delete prop.tgt
    super.set(prop)
  }
}
/* TODO : split symbolic link which is just a path pointer
 * with link which is an inode pointer.
 * With direct link, dates and modes are identical to the target,
 *  the link never broke and if target is removed, then link remains as a copy
 */
