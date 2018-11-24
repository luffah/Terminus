
class Link extends Room {
  constructor (file, prop) {
    prop = inject({mod:777, link: file }, prop)
    prop.poprefix = prop.poprefix || ((file instanceof Room) ? POPREFIX_ROOMLINK : POPREFIX_LINK)
    // linkname || _(PO_DEFAULT_LINK, [])
    super(prop)
  }
  set(prop){
    if (prop.link) this.link = prop.link
  }
}
/* TODO : split symbolic link which is just a path pointer
 * with link which is an inode pointer.
 * With direct link, dates and modes are identical to the target,
 *  the link never broke and if target is removed, then link remains as a copy
 */
