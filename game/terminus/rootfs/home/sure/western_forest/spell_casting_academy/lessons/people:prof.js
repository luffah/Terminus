({
  v: 0,
  var: 'prof',
  img: 'prof',
  states: { _less: (re, o) => {
    o.unsetCmdEvent('_less')
    addGroup('mv')
    learn('mv', re)
  } },
  hooks: { mv: (o) => _(o.poid + '_mv' + (o.v < 2 ? o.v++ : o.v)) }
})
