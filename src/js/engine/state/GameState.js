function GameState () {
  this.params = {}
  this._params_cache = {}
  this.actions = {}
  this.filesystem = {}
  this.alias = {}
  this.cookie = null
}

GameState.prototype = {
  saveCookie: function () {
    // when you call this function, set the cookie in the browser
    if (this.cookie) {
      this.cookie.write(this.params)
    }
  },
  add: function (name, fun) {
    this.actions[name] = fun
  },
  set: function (name, fun) {
    this.params[name] = fun
  },
  get: function (name, fun) {
    return this.params[name]
  },
  applied: function (name) {
    return this.actions[name]
  },
  apply: function (name, replay) {
    console.log('apply ' + name)
    this.params[name] = 1
    if (name in this.actions) { this.actions[name]((typeof replay === 'undefined') ? false : replay) }
  },
  startCookie: function (name) {
    this.cookie = new Cookie(name)
    if (this.cookie.check()) {
      this._params_cache = this.cookie.read()
      return true
    }
    return false
  },
  stopCookie: function (name) {
    this.cookie = null
  },
  setCookieDuration: function (minutes) {
    this.cookie.minutes = minutes
  },
  loadActions: function () {
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
  },
  loadContext: function () {
    var params = this._params_cache
    if (params.hasOwnProperty(0)) {
      this.params[0] = params[0]
      return Context.parse(params[0])
    }
    return false
  },
  setCurrentContext: function (ctx) {
    this.params[0] = ctx.stringify()
    this.saveCookie()
  }
}

var state = new GameState() // GameState to initialize a game script
