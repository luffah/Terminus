({
  img: 'test',
  states: {
    mv_done: (re) => {
      console.log('mv_done pillier...')
      if (++$academy_practice.v === 3) {
        $spell_casting_academy.setEnterCallback(null)
        if (re) { $spell_casting_academy.chmod('-x') } else {
          $spell_casting_academy.setLeaveCallback(() => {
            $spell_casting_academy.chmod('-x')
            playMusic()
            success(_('room_spell_casting_academy'), re)
          })
          ondone(function () {
            setTimeout(() => { playSound('broken') }, 1000)
            setTimeout(() => {
              prof
                .moveTo($academy_practice)
                .textIdx = 'quit'
              $lessons
                .setLeaveCallback(() => { $academy_practice.destroy() })
                .textIdx = 'escape'
              playMusic('warning', { loop: true })
              mesg(_('leave_academy'), re)
            }, 3000)
          })
        }
      }
    }
  }
})
