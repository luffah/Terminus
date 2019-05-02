function credits (room) {
  if (room) {

  } else {
    let ret = []
    let tcredit
    CREDITS_ORD.forEach(t => {
      if (t === 'assets') {
        Object.keys(RES).sort().forEach(p => {
          let full = true
          let poid = 'credit_' + p
          let cls = overclass(poid)
          ret.push(span(_(poid), cls))
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
            let title = RES[p][ref].by.title || ref
            if (!(author in tcredit)) tcredit[author] = []
            let files = RES[p][ref].files
            if (p === 'img') {
              tcredit[author].push(img(RES[p][ref].src, title, files ? Object.keys(files).sort().join(', ') : '—'))
            } else {
              if (files) {
                tcredit[author].push(span(title +
                  ' (' + Object.keys(files).sort().join(', ') + ')',
                'by-title'))
              }
            }
          })
          Object.keys(tcredit).sort().forEach(author => {
            ret.push(span(_(author), 'by-author'))
            ret.push(ul(tcredit[author], 'ul-credit'))
          })
          if (!full) {
            ret.push(span(_(poid + '_incomplete'), cls + ' t-credit-missing'))
          }
        })
        return
      }
      let poid = 'credit_' + t
      let cls = overclass(poid)
      if (t === 'translation') {
        ret.push(span(_(poid), cls))
        ret.push(ul(LANG_CREDITS[t].map(name => _(name)), 'ul-credit'))
      } else if (CREDITS[t] instanceof Array) {
        ret.push(span(_(poid), cls))
        ret.push(ul(CREDITS[t].map(name => _(name)), 'ul-credit'))
      } else if (CREDITS[t] instanceof Object) {
        ret.push(span(_(poid, CREDITS[t]), cls))
      } else {
        ret.push(span(_(poid, CREDITS[t]), cls))
        ret.push(span(CREDITS[t], 'by-author'))
      }
    })
    return ret
  }
}
