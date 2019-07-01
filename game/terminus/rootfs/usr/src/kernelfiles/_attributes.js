({
  states: {
    sudoComplete: function (re, o) {
      o.addDoor($paradise)
      vt.echo(_('room_kernel_sudo'))
    }
  }
})
