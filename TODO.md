
----------------------------------------------------------------------------
# IMPORTANT FEATURES

## Alias shell function
  * code alias as a shell builtin  *IN PROGRESS*

# REFACTORING

## Translation architecture 
  * put engine translations on engine part (`engine/i18n`)
    * collect terms to translate in `engine/js` (using a generator script ?)
    * allow override in assembling tool (`_terminal_game_common`)
    * update the translations

  * add a precompilation step to unify po file (one per lang)
    * find where is the best place for this file
    * idem for pot file ?

# DOCUMENTATION
Need external point of view...
  * Is it easy to start from source ?
  * Is it easy to create a little game with the engine ?
  * Is it really hard to understand how to use the dev tools ?
  * Is it really hard to understand how to parameter the dev tools ?
  * Is it really hard to understand where to add a feature on engine ?

# MISC FEATURES

## Add a map
Allow to set a map position , to see the current place in a plan:
  * require inheritance of parent position
  * result appears with pwd
  * text description of pwd shall have similarity with the picture

## Walkthrough like tests ?
  * test = walkthrough ?
  * an interesting idea is to put logbook in the test/walkthrough. Where to put logbook / itentions ?
  * cf how it is done in pyvida and game "Escape from Pleasure Island".

## 3 dimensionnal tags (for Dunnet-like minigames)
  * Tag directories, i.e
     * bridge/mansion:north
     * bridge/path:west
     * bridge/forest:south
     * bridge/river:under
     * bridge/sky:above


----------------------------------------------------------------------------
# DESIGN

## Choose default font
  * get unifont as webfont ? or go back to terminal grotesque

