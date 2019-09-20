function credits (room) {
  if (room) {

  } else {
    const ret = []
    let tcredit
    CREDITS_ORD.forEach(t => {
      if (t === 'assets') {
        Object.keys(RES).sort().forEach(p => {
          let full = true
          const poid = 'credit_' + p
          const cls = overclass(poid)
          ret.push(_span(_(poid), cls))
          tcredit = {}
          Object.keys(RES[p]).sort().forEach(ref => {
            if (!RES[p][ref].used) {
              full = false
              return
            }
            if (!RES[p][ref].by.artist) return
            let author = _('by_author', [RES[p][ref].by.artist])
            if (RES[p][ref].by.designer) {
              author += _('and_designed_by', [RES[p][ref].by.designer])
            }
            const title = RES[p][ref].by.title || ref
            if (!(author in tcredit)) tcredit[author] = []
            const files = RES[p][ref].files
            if (p === 'img') {
              tcredit[author].push(_img(RES[p][ref].src, title, files ? Object.keys(files).sort().join(', ') : '—'))
            } else {
              if (files) {
                tcredit[author].push(_span(title +
                  ' (' + Object.keys(files).sort().join(', ') + ')',
                'by-title'))
              }
            }
          })
          Object.keys(tcredit).sort().forEach(author => {
            ret.push(_span(_(author), 'by-author'))
            ret.push(ul(tcredit[author], 'ul-credit'))
          })
          if (!full) {
            ret.push(_span(_(poid + '_incomplete'), cls + ' t-credit-missing'))
          }
        })
        return
      }
      const poid = 'credit_' + t
      const cls = overclass(poid)
      if (t === 'translation') {
        ret.push(_span(_(poid), cls))
        ret.push(ul(LANG_CREDITS[t].map(name => _(name)), 'ul-credit'))
      } else if (CREDITS[t] instanceof Array) {
        ret.push(_span(_(poid), cls))
        ret.push(ul(CREDITS[t].map(name => _(name)), 'ul-credit'))
      } else if (CREDITS[t] instanceof Object) {
        ret.push(_span(_(poid, CREDITS[t]), cls))
      } else {
        ret.push(_span(_(poid, CREDITS[t]), cls))
        ret.push(_span(CREDITS[t], 'by-author'))
      }
    })
    return ret
  }
}
