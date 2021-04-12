// Process Model with parent and pid properties
class Task {
  constructor (ptask, terminate, cmdline, cmd, args, env, io) {
    this.ptask = ptask
    // this.ppid = ptask
    this.id = Task.id++
    this.io = io
    this.env = env
    this.cmdline = cmdline
    this.cmd = cmd
    this.args = args
    this.terminate = terminate
    Task.reg[this.id] = this
    if (this.cmd) this.run()
  }

  run () {
    const [cmd, env, sys, args] = [this.cmd, this.env, this.io, this.args]
    let hret, ret
    if (cmd.hookable) {
      hret = r.tryhook(cmd.name, args, cmd)
    }
    if (hret && hret.ret) ret = hret.ret
    if (!(hret && hret.ret && !hret.continue)) {
      ret = cmd.exec.call(this, args, env, sys)
    }
    if (ret) this.exit(ret)
  }

  exit (ret) {
    if (typeof ret === 'number') this.returncode = ret
    if (ret instanceof Object) {
      if (ret.code) this.returncode = ret.code
      this.io.push(ret)
    }
    this.returncode = ret || 0
    this.terminate(ret)
  }
}
Task.id = 1
Task.reg = {}
