var poe = (typeof pogen === 'function')
var pogencnt = 0
function pogenAdd (str) {
  pogencnt++
  console.log('POgen new : ' + str)
  dialog[str] = str
}

function pogenDL () {
  let ret = ''
  ret += 'msgid  ""\n'
  ret += 'msgstr ""\n'
  ret += '"Content-Type: text/plain; charset=UTF-8\\n"\n'
  ret += '"Content-Transfer-Encoding: 8bit\\n"\n'
  ret += '"Language: ' + LANG + '\\n"\n'

  for (let i in dialog) {
    ret += 'msgid "' + i + '"\n'
    ret += 'msgstr "' + dialog[i].replace(/"/g, '\\"').replace(/(\\n|\n)/g, '\\n"\n"') + '"\n\n'
  }
  return downloadAsFile(APP_NAME + '.' + LANG + '.po', ret)
}

// resolve {{msg_id}} and {{msg_id,arg1,arg2,...}} in msg_str
var _rxVar = /\{\{\w+(,[^,}]*)*\}\}/g
function resolveVar (a) {
  a = a.substring(2, a.length - 2)
  let b = a.split(',')
  return __(b[0], b.slice(1))
}

function __ (a, b) {
  return span(_(a, b), overclass(a))
}

function _ (str, vars, fallback) {
  if (!str) return ''
  let ret = dialog[str]
  if (!ret) {
    if (poe) pogenAdd(str)
    if (fallback && fallback in dialog) {
      ret = dialog[fallback]
    } else {
      return Str.rdr(str, vars, 1)
    }
  }
  while (_rxVar.test(ret)) {
    ret = ret.replace(_rxVar, resolveVar)
  }
  return Str.rdr(ret, vars).replace(/\n/g, '<br/>')
}

// function _match (str, strb) {
//   let ret = -1
//   if (str in dialog) {
//     return strb.match(new RegExp(dialog[str]))
//   } else if (poe) {
//     pogenAdd(str)
//   }
//   return ret
// }
