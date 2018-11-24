function objToMsg (o) {
  return o.toMsg()
}

function _guess_gettext_mod (txt) {
  let typ = txt.split('_')[0]
  return {
    decorate: span('%s', 't-'+typ)
  }
}

var poe = (typeof pogen === 'function')
// resolve {{msg_id}} and {{msg_id,arg1,arg2,...}} in msg_str
var var_regexp = /\{\{\w+(,([^,}]*(,)?))?\}\}/g
function var_resolve (a) {
  a = a.substring(2, a.length - 2)
  let b = a.split(',')
  a = b[0]
  return _(a, b.slice(1), _guess_gettext_mod(a))
}

function _ (str, vars, args) {
  if (!str) return ''
  args = d(args, {})
  let ret
  if (str in dialog) {
    ret = dialog[str]
  } else {
    if (poe) {
      pogen(str)
    }
    if (args.or && args.or in dialog) {
      str = ret
      ret = dialog[args.or]
    } else {
      ret = str
      if (vars && vars.length > 0) ret += ' ' + vars.join(' ')
      return ret
    }
  }
  if (typeof vars === 'string' || typeof vars === 'number') {
    vars = [vars]
  }
  if (typeof vars !== 'object' || vars.length === 0) {
    vars = ['', '', '', '']
  }
  while (var_regexp.test(ret)) {
    ret = ret.replace(var_regexp, var_resolve)
  }
  ret = ret.printf(vars)
  if (args.decorate) ret = args.decorate.printf([ret])
  return ret
}

function _match (str, strb) {
  ret = -1
  if (str in dialog) {
    re = new RegExp(dialog[str])
    return strb.match(re)
  } else if (poe) {
    pogen(str)
  }
  return ret
}
