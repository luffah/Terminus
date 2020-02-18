
add_test(function(next){
  console.log('TEST CMD GREP (find sudo password)');
  enterRoom($morekernel, vt);
  _addGroup('grep');
  vt.set_line('ls');
  vt.enter();
  vt.set_line('grep t *');
  vt.enter();
  vt.set_line('grep password *');
  vt.enter();
  vt.set_line('cd ..');
  vt.enter();
  vt.set_line('cat Instructions');
  vt.enter();
  vt.set_line('cat Certificat');
  vt.enter();
  vt.set_line('sudo cat Certificat');
  vt.enter();
  setTimeout(next,1000);
});
