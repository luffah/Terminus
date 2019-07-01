function genUID (name) {
  return name.substr(0, 4) + inc(genUID.cnt, name)
}

genUID.cnt = {}

class Properties {
  constructor (prop) {
    this.uid = genUID(prop.poid || prop.name)
  }
  set (prop) {
    Object.assign(this, prop)
  }
  consume(prop, keys, func){
    if (keys instanceof String) {
      keys = [ keys ]
    }
    for (let k of keys) {
      if ( prop.hasOwnProperty(k) ) {
        if (func) func(this, k, prop[k])
        else this[k] = prop[k]
        delete prop[k]
      }
    }
  }
}
