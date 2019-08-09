Builtin.def('pwd', [], function (args, env, sys) {
  let cwd = env.cwd;
  // vt.push_img(cwd.img)
  return {stdout:_(POPREFIX_CMD + 'pwd', [cwd.name]).concat('\n').concat(cwd.text)};
});
