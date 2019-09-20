class GameState {
  constructor () {
    this.params = { opts: {} }
    this._params_cache = { opts: {} }
    this.active = false
    this.actions = {}
    this.filesystem = {}
    this.alias = {}
    this.cookie = null
  }

  startCookie (name) {
    console.log(name)
    this.cookie = new Cookie(name)
    if (this.cookie.check()) {
      this._params_cache = this.cookie.read()
      console.log(this._params_cache)
      return true
    }
    return false
  }

  stopCookie (name) {
    this.cookie = null
  }

  setCookieDuration (minutes) {
    this.cookie.minutes = minutes
  }

  saveCookie () {
    // when you call this function, set the cookie in the browser
    if (this.cookie) {
      this.cookie.write(this.params)
    }
  }

  add (name, fun, tgt, orig) {
    this.actions[name] = (re) => fun(re, tgt, orig)
  }

  set (name, fun) {
    this.params[name] = fun
  }

  get (name) {
    return this.params[name]
  }

  setopt (name, val) {
    if (this.active) this.params.opts[name] = val
    else this._params_cache.opts[name] = val
  }

  getopt (name, fallback) {
    let val
    if (this.active) val = this.params.opts[name]
    else val = this._params_cache.opts[name]
    return (def(val) ? val : fallback)
  }

  applied (name) {
    return this.actions[name]
  }

  apply (name, replay) {
    // console.log('apply ' + name)
    this.params[name] = 1
    if (name in this.actions) { this.actions[name](replay || false) }
  }

  loadActions () {
    var params = this._params_cache
    if (params) {
      for (var k in params) {
        if (params.hasOwnProperty(k)) {
          if (k in this.actions) {
            this.apply(k, params[k])
          }
        }
      }
      return true
    }
    return false
  }

  saveEnv (env) {
    this.params[0] = env.stringify()
    this.saveCookie()
  }

  loadEnv () {
    const params = this._params_cache
    this.active = true
    if (params[0]) {
      this.params[0] = params[0]
      return Env.parse(params[0])
    }
    return false
  }
}
