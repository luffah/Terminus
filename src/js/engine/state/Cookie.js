function Cookie (name, minutes) {
  this.name = name
  this.minutes = minutes
}
// Cookies can only contains text or numbers.
// If you need to stored an object, it shall be referenced elsewhere.
Cookie.prototype = {
  // Cookies contain "cookiename=key:value=key:value=key:value..."
  // In document.cookie, cookies are seperated by a ";"
  parse: function (content) {
    var ret = null// return null or a dict
    var ca = content.split(';')
    for (var j = 0; j < ca.length; j++) {
      var c = ca[j]
      while (c.charAt(0) == ' ') c = c.substring(1, c.length)
      if (c.indexOf(this.name) === 0) {
        ret = {}
        var params = c.split('='); params.shift()
        for (var i = 0; i < params.length; i++) {
          var kv = params[i].split(':')
          if (kv.length >= 2) {
            var k = kv[0]
            var v = kv.slice(1).join(':')

            if (v !== 'undefined') {
              ret[k] = v
            }
          }
        }
        break
      }
    }
    return ret
  },
  check: function () {
    var ca = dom.cookie.split(';')
    for (var j = 0; j < ca.length; j++) {
      var c = ca[j]
      while (c.charAt(0) == ' ') c = c.substring(1, c.length)
      if (c.indexOf(this.name) === 0) {
        return true
      }
    }
    return false
  },
  stringify: function (params) {
    var content = ''
    for (var key in params) {
      if (params.hasOwnProperty(key)) {
        content += key + ':' + params[key] + '='
      }
    }
    return content
  },
  read: function () {
    return this.parse(dom.cookie)
  },
  write: function (params) {
    var date = new Date()
    date.setTime(date.getTime() + (this.minutes * 60 * 1000))
    console.log('write cookie', params)
    dom.cookie = this.name + '=' + this.stringify(params) + '; expires=' + date.toGMTString() + '; path=/'
  },
  destroy: function () {
    this.minutes = -1
    this.write('')
  }
}
