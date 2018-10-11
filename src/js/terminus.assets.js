// import { SoundBank, Music } from 'engine'
var snd = new SoundBank()
var music = new Music(snd)

/// sound set
// The sounds in vterm are : choicemove choicemove question exclm endoftext dot learned space ret tag virg char
snd.set('choicemove', './snd/sfx_movement_ladder5a.', ['wav'])
snd.set('choiceselect', './snd/sfx_movement_ladder2a.', ['wav'])
snd.set('tag', './snd/sfx_movement_ladder2a.', ['wav'])
// snd.set('char','./snd/voicehigh.',['mp3']);
snd.set('char', './snd/char.', ['wav'])
snd.set('grl', './snd/grl.', ['wav'])
snd.set('poney', './snd/sfx_menu_move3.', ['wav'])
snd.set('portal', './snd/sfx_movement_portal6.', ['wav'])
snd.set('learned', './snd/sfx_sounds_fanfare3.', ['wav'])
snd.set('unlocked', './snd/sfx_sounds_fanfare3.', ['wav'])
snd.set('success', './snd/snd_5000points.', ['mp3'])
snd.set('broken', './snd/sfx_exp_cluster9.', ['wav'])
snd.set('hit', './snd/sfx_menu_move3.', ['wav'])
snd.set('poweron', './snd/snd_steel.', ['mp3'])

/// music set
music.set('chapter2', './music/place/slowdrum-cave.', ['wav'])
music.set('academy', './music/mystic/caravan.', ['ogg'])
music.set('battle', './music/danger/snd__bairustage_loop.', ['mp3'])
music.set('warning', './music/danger/trolls-beatdown-05l.', ['wav'])
music.set('story', './music/cave/Searching.', ['ogg'])
music.set('forest', './music/nature/Forest_Ambience.', ['mp3'])
music.set('yourduty', './music/Intro_Theme.', ['mp3'])
music.set('title', './music/Intro_Theme.', ['mp3'])
music.set('trl', './music/danger/trolls-beatdown-05l.', ['wav'])
