// function isStr (v) {
//   return (typeof v === 'string')
// }

var re = {
  batch: /(\w*){(\w+(,\w+)*)}/, // for batch creation, see directory.js
  printf: /%[sd]/g, // printf
  format: /\{(\d)\}/g, // format
  template: /\{\{(\w+):\}\}/g, // template
  noaccents: /[\u0300-\u036f]/g,
  str: /^'[^']*'$/,
  strv: /^"[^"]*"$/,
  strr: /("[^"]*"|'[^']*')/g,
  escaped: /\\(.)/g,
  escapend: /\\$/g,
  varr: /\$({\w+}|\w+)/g,
  star: /.*\*.*/,
  nbsp: /\u00A0/g,
  tab: /\t/g,
  br: /(\n|<br\/?>)/g,
  hashtag: /(#[^#]+#)/g,
  voice: /<voice (\w*)\/>/g,
  tag: /(<\w+[^>]*><\/\w+>|<\w+[^>]*\/>)/g,
  quote: /[«»]/g,
  dots: /(\.\.\.)/g,
  localcmd: /^(\.\/|\/)/
}
var Str = {
  rdr: (str, vars, noformat) => {
    if (vars) {
      if (['number', 'string'].includes(typeof vars)) vars = [vars]
      if (vars instanceof Array) {
        if (noformat) return str + (vars.length ? ' ' + vars.join(' ') : '')
        return Str.printf(str, vars)
      }
      if (vars instanceof Object) {
        if (noformat) return str + ' ' + JSON.stringify(vars)
        return Str.render(str, vars)
      }
    }
    return str
  },
  printf: (str, vars) => {
    // printf allow to simply template a string
    let i = 0
    return Str.format(str.replace(re.printf, () => { return vars[i++] || '' }), vars)
  },
  format: (str, vars) => {
    // format allow to more advanced format, string + css
    return str.replace(re.format, (i, j) => { return span(vars[j * 1], 'i-' + j) || i })
  },
  render: (str, vars) => {
    // render allow to use a template, to print information => string + css
    return str.replace(re.template, (i, j) => { return span(vars[j], 'i-' + j) || i })
  }
}

function addspace (i) { return i + ' ' }

function noAccents (str) {
  return str.normalize('NFD').replace(re.noaccents, '')
}

function setChr (str, pos, chr) {
  return str.slice(0, pos) + chr + str.slice(pos + chr.length)
}

function rtrim(t){
  return t.replace(/\s+$/, '')
}
function ltrim(t){
  return t.replace(/^\s*/, '')
}
function trim(t){
  return t.replace(/^\s*/, '').replace(/\s+$/, '')
}

var CONSONANT = 'bcdfghjklmnpqrstvwxz'

function articulate (txt) {
  // using a node to ignore html tags
  let node = document.createElement('p')
  node.innerHTML = txt
  let tret = []
  for (let i = 0; i < node.childNodes.length; i++) {
    let o = node.childNodes[i]
    if (o.data) {
      let txttab = o.data.split('')
      let syl = ['', '']
      let idx = 0
      let prev = 0
      while (txttab.length) {
        let c = txttab.shift()
        if (/[-']/.test(c)) {
          syl[idx] += c
          prev = 0
        } else if (/\W/.test(c)) {
          if (syl[0]) { tret.push(syl.join('')); syl = ['', '']; idx = 0 }
          tret.push(c)
          prev = 0
        } else if (CONSONANT.includes(c)) {
          if (prev === 0) {
            syl[idx] += c
          }
          if (prev === 1) {
            syl[idx] += c
            if (idx) { tret.push(syl.shift()); syl.push('') } else idx++
          }
          prev = 0
        } else {
          if (idx) {
            if (prev === 0 && syl[idx].length > 0) {
              // new syllable
              tret.push(syl.shift())
              syl.push('')
              idx--
            }
          }
          syl[idx] += c
          prev = 1
        }
      }
      while (syl.length && syl[0]) tret.push(syl.shift())
    } else {
      tret.push(o)
    }
  }
  return tret
}

function similarity (sa, sb) {
  let a = sa.split('').sort()
  let b = sb.split('').sort()
  let cnt = 0
  let max = sa.length
  let min = sb.length
  if (max < min) {
    let t = a
    a = b
    b = t
    t = max
    max = min
    min = t
  }
  b.forEach(c => {
    if (pick(a, c)) cnt++
  })
  return (cnt / min + cnt / max) / 2
}

function downloadAsFile (fname, text) {
  let textFile = null
  var data = new Blob([text], { type: 'text/plain' })

  textFile = window.URL.createObjectURL(data)

  if (textFile !== null) {
    let dl = dom.El('a')
    dl.setAttribute('download', fname)
    dl.href = textFile
    dl.innerText = dl.href
    dom.body.appendChild(dl)
    dl.click()
    window.URL.revokeObjectURL(textFile)
  }
}

function table_to_printf (tab) {
  let column_size = new Array(tab[0].length +1).fill(0)
  for (let row of tab) {
    for (let i=0; i<row.length; i++) {
      column_size[i] = Math.max(row[i].length, column_size[i])
    }
  }
  let ret = ''
  let val
  for (let row of tab) {
    for (let i=0; i<row.length; i++) {
      val = row[i]
      for (let j=val.length; j<=column_size[i]+1; j++){
        val += ' '
      }
      ret += val
    }
    ret += "\n"
  }
  return ret
}
