var pogencnt = 0
function pogen (str) {
  pogencnt++
  console.log('POgen new : ' + str)
  dialog[str] = str
}

function pogen_content () {
  let ret = ''
  ret += 'msgid  ""\n'
  ret += 'msgstr ""\n'
  ret += '"Project-Id-Version: \\n"\n'
  ret += '"POT-Creation-Date: \\n"\n'
  ret += '"PO-Revision-Date: \\n"\n'
  ret += '"Last-Translator: \\n"\n'
  ret += '"Language-Team: \\n"\n'
  ret += '"MIME-Version: 1.0\\n"\n'
  ret += '"Content-Type: text/plain; charset=UTF-8\\n"\n'
  ret += '"Content-Transfer-Encoding: 8bit\\n"\n'
  ret += '"Language: ' + LANG + '\\n"\n'
  ret += '"X-Generator: Poedit 1.8.11\\n"\n'
  ret += '"X-Poedit-SourceCharset: UTF-8\\n"\n'

  for (let i in dialog) {
    ret += 'msgid "' + i + '"\n'
    ret += 'msgstr "' + dialog[i].replace(/"/g, '\\"').replace(/(\\n|\n)/g, '\\n"\n"') + '"\n\n'
  }
  return ret
}

function pogen_dl () {
  return downloadAsFile( APP_NAME + '.' + LANG + '.po', pogen_content())
}
console.log('pogen loaded')
