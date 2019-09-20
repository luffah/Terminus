function splitLines (text) {
  let ret = []
  if (text instanceof Object) {
    for (const t of text) {
      ret = ret.concat(splitLines(t))
    }
  } else {
    const node = document.createElement('p')
    node.innerHTML = text.replace(/([^\\])?\n/, '<br/>')
    let curr = ''
    for (const o of node.childNodes) {
      if (o.data) {
        curr += o.data
      } else if (o.tagName === 'SPAN') {
        curr += o.outerHTML
      } else if (o.tagName === 'BR') {
        ret.push(curr)
        curr = ''
      } else if (o.style.display === 'block') {
        ret.push(curr)
        curr = ''
        ret.push(o.outerHTML)
      }
    }
    if (curr.length) ret.push(curr)
  }
  return ret
}

Command.def('grep', [ARGT.pattern, ARGT.strictfile], function () {
  const task = this
  const [args, sys, env] = [task.args, task.io, task.env]

  const word = args[0]
  // console.log(sys)
  if (args.length == 1) {
    return sys.stdin.loop((lines) => {
      lines = splitLines(lines).filter((l) => l.indexOf(word) >= 0)
      // console.log(lines)
      if (lines) sys.stdout.write(lines)
    }, () => task.exit())
  } else {
    for (const [f, i] of get_files_args(args.slice(1), 'grep', env, sys)) {
      const lines = splitLines(f.text).filter((l) => l.indexOf(word) >= 0)
      if (lines) {
        sys.stdout.write(lines)
      }
    }
    task.exit() // FIXME ////////// TASKSSSSS
  }
})
