if (!dialog) {
  console.log('Before this script, you have to load the script defining the dialog table.')
}
var POPREFIX_CMD = 'cmd_'
var POPREFIX_ROOM = 'room_'
var POPREFIX_ITEM = 'item_'
var POPREFIX_PEOPLE = 'people_'
var POSUFFIX_DESC = '_text'
var PO_NONE = 'none'
var PO_NONE_DESC = PO_NONE + POSUFFIX_DESC
var PO_DEFAULT_ROOM = POPREFIX_ROOM + PO_NONE
var PO_DEFAULT_ITEM = POPREFIX_ITEM + PO_NONE
var PO_DEFAULT_PEOPLE = POPREFIX_PEOPLE + PO_NONE
var PO_DEFAULT_ROOM_DESC = POPREFIX_ROOM + PO_NONE_DESC
var PO_DEFAULT_ITEM_DESC = POPREFIX_ITEM + PO_NONE_DESC
var PO_DEFAULT_PEOPLE_DESC = POPREFIX_PEOPLE + PO_NONE_DESC

String.prototype.printf = function (vars) {
  var i = -1
  return this.replace(/\%[sd]/g,
    function (a, b) {
      i++
      return vars[i]
    })
}
function objToMsg (o) {
  return o.toMsg()
}

var type_decorations = {
  people: '<span class="color-people">%s</span>',
  item: '<span class="color-item">%s</span>',
  room: '<span class="color-room">%s</span>',
  cmd: '<span class="color-cmd">%s</span>'
}
function guess_gettext_mod (txt) {
  typ = txt.split('_')[0]
  return {
    decorate: type_decorations[typ]
  }
}

var poe = (typeof pogen === 'function')
var var_regexp = /\{\{\w+(\.\w+|,\[([^,]*(,)?)\])?\}\}/g
var var_vars_regexp = /\[([^,]*(,)?)\]/g
var var_vars_regexpbis = /\.(\w+)/
function var_resolve (a) {
  a = a.substring(2, a.length - 2)
  if (var_vars_regexp.test(a)) {
    vars = JSON.parse(a.match(var_vars_regexp))
    a = a.split(',')[0]
  } else if (var_vars_regexpbis.test(a)) {
    b = a.split('.')
    //  console.log(b);
    a = b[0]
    vars = [b[1]]
  } else {
    vars = []
  }
  //  console.log(a,vars);
  return _(a, vars, guess_gettext_mod(a))
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
function _ (str, vars, args) {
  if (!def(str)) return ''
  if (typeof vars === 'string' || typeof vars === 'number') {
    vars = [vars]
  }
  if (typeof vars !== 'object' || vars.length === 0) {
    vars = ['', '', '', '']
  }
  args = d(args, {})
  var ret
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
      if (vars.length > 0) ret += ' ' + vars.join(' ')
      return ret
    }
  }
  while (var_regexp.test(ret)) {
    ret = ret.replace(var_regexp, var_resolve)
  }
  ret = ret.printf(vars)
  //  if (poe){
  //     return ret + "#" + str +"#" ;
  //  }
  if (args.decorate) {
    //    console.log('decorate',args.decorate);
    ret = args.decorate.printf([ret])
  }
  return ret
}
