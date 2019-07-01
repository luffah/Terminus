({
   mod: 750,
   group: 0,
   v: {
     a: 'others',
     w: 'without',
     s: 'suicide',
     p: 'powerless',
     i: 'inarticulate',
     l: 'lost', 
     h: 'here'
   },
   init: (c) => {
     c.syntax = [ARGT.opts(keys(c.v).map((i) => '-' +i))]
    // TODO: gen text...
    keys(c.v).forEach((i) => {
      c.text += "\n -" + i + " ".repeat(8) +  _(c.poid + '_' + c.v[i])
    })
   },
   exec: (args, ctx, vt) => {
      return _stderr(_('cmd_cp_unknown'))
   }
})
