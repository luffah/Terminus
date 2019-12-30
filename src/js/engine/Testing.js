var test_sequence=new Seq();
function do_test(){
  test_sequence.next();
}
function add_test(fu){
  TESTING=true;
  test_sequence.then(fu);
}


