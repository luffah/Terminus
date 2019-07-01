({
  povars: ['T'],
  hooks: {
    grep: (args) => {
      if (args[0].indexOf('pass') === 0) return { ret: _stdout('password = IFHTP'), pass: true }
    }
  }
})
