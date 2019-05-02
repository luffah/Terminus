// Cookies contain "cookiename=key:value=key:value=key:value..."
// In document.cookie, cookies are seperated by a ";"
class Cookie {
  constructor (name, minutes) {
    this.name = name
    this.minutes = minutes
  }
  read () {
    let c = this.check()
    if (c) {
      let ret = {}
      c.split('=').forEach((i) => {
        let kv = i.split(':')
        let k = kv[0]
        let v = kv.slice(1).join(':')
        if (v !== 'undefined') {
          ret[k] = v
        }
      })
      return ret
    }
  }
  check () {
    let c = this
    return dom.cookie.split(';').find(i => i.startsWith(c.name))
  }
  write (params) {
    let date = new Date()
    date.setTime(date.getTime() + (this.minutes * 60 * 1000))
    let c = ''
    Object.keys(params).forEach(k => {
      c += k + ':' + params[k] + '='
    })
    dom.cookie = this.name + '=' + c + '; expires=' + date.toGMTString() + '; path=/'
  }
  destroy () {
    this.minutes = -1
    this.write('')
  }
}
