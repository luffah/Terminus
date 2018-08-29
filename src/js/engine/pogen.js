var pogencnt=0;
function pogen(str){
  pogencnt++;
  console.log('POgen new : '+str)
  dialog[str]=str;
}

function pogen_content(){
  var ret="";
  ret+='msgid  ""\n';
  ret+='msgstr ""\n';
  ret+='"Project-Id-Version: \\n"\n';
  ret+='"POT-Creation-Date: \\n"\n';
  ret+='"PO-Revision-Date: \\n"\n';
  ret+='"Last-Translator: \\n"\n';
  ret+='"Language-Team: \\n"\n';
  ret+='"MIME-Version: 1.0\\n"\n';
  ret+='"Content-Type: text/plain; charset=UTF-8\\n"\n';
  ret+='"Content-Transfer-Encoding: 8bit\\n"\n';
  ret+='"Language: '+LANG+'\\n"\n';
  ret+='"X-Generator: Poedit 1.8.11\\n"\n';
  ret+='"X-Poedit-SourceCharset: UTF-8\\n"\n';


  for (var i in dialog){
    ret+='msgid "'+i+"\"\n";
    ret+='msgstr "'+dialog[i].replace(/\\n/g,'\\n').replace(/\n/g,'\\n').replace(/"/g,'\\"')+"\"\n\n";
  }
  return ret;
}

//https://stackoverflow.com/questions/21012580/is-it-possible-to-write-data-to-file-using-only-javascript

function makeTextFile(text) {
  var textFile = null;
  var data = new Blob([text], {type: 'text/plain'});

  // If we are replacing a previously generated file we need to
  // manually revoke the object URL to avoid memory leaks.
  if (textFile !== null) {
    window.URL.revokeObjectURL(textFile);
  }

  textFile = window.URL.createObjectURL(data);

  // returns a URL you can use as a href
  return textFile;
}

function pogen_deliver_link(){
  var dl=document.createElement('a');
  dl.setAttribute('download', APP_NAME+'.'+LANG+'.po');
  dl.href = makeTextFile(pogen_content());
  dl.innerText=dl.href;
  return dl;
}
console.log('pogen loaded');
