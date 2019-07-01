
class NestedTextIO {
    constructor (redir_in, redir_out, redir_err) {
      this.stdin = redir_in
      this.stdout = redir_out
      this.stderr = redir_err
    }
}

class TextIO {
    constructor (fd, renderer) {
      this.lines = []
      this.render = renderer
      this.fd = fd
      this.open = true
    }
    get length() {
      return this.lines.length
    }
    close() {
       this.open = false
    }
    read() {
      return this.lines.shift()
    }
    readlines() {
      let ret = this.lines.concat()
      this.lines = []
      return ret
    }
    write(line, opt) {
      console.log('TextIO/w', this.fd, line)
      let lines = (typeof line === 'string') ? line.split('\n') : line
      if (this.render) {
        this.render(lines, opt)
      } else {
        this.lines = this.lines.concat(lines)
      }
    }
}
Object.assign(TextIO, { STDIN: 0, STDOUT: 1, STDERR: 3})
