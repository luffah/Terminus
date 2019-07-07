
class NestedTextIO {
    constructor (redir_in, redir_out, redir_err) {
      this.stdin = redir_in
      this.stdout = redir_out
      this.stderr = redir_err
    }
}

class TextIO {
    constructor (fd, renderer, reader) {
      this.lines = []
      this.render = renderer
      this.reader = reader
      this.fd = (fd === undefined) ? TextIO.FD++ : fd
      this.open = true
      TextIO.LSOF.push(this)
    }
    get length() {
      return this.lines.length
    }
    close() {
      this.open = false
      delete this.notify_loop
    }
    defaultReader(func, end) {
      this.notify_loop()
      end()
    }
    loop(func, cb) {
      let v = this
      v.notify_loop = () => {
        func(v.readlines())
      }
      let reader = v.reader || ((f, e) => v.defaultReader(f, e))
      reader(
        (l) => v.write(l),
        () => {v.close(); cb()})
    }
    read() {
      return this.lines.shift()
    }
    readlines() {
      let ret = this.lines.concat()
      this.lines = []
      return ret
    }
    write(line, opt, cb) {
      // console.log('TextIO/w', this.fd, line, opt, cb)
      let lines = (typeof line === 'string') ? line.split('\n') : line
      // console.log(lines[0])
      if (this.render) {
        this.render(lines, opt, cb)
      } else {
        this.lines = this.lines.concat(lines)
        if (this.open && this.notify_loop) this.notify_loop()
        if (cb) cb()
      }
    }
}
Object.assign(TextIO, { STDIN: 0, STDOUT: 1, STDERR: 3, FD: 10, LSOF: []})
