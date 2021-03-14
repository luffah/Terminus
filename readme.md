# Terminal game common
A tool box to create games with command line interface, based on a classical filesystem structure.


What does provide this (game) engine ?
======================================
* a customizable terminal (command line) interface
  * for Web browser (Javascript)
  * from a shell (experimental - Python)
* most of a shell functionnalities
* picture and music support
* some game dev tools : build, manage resources, track credits, split/group translations

Games
=====


<table>
<tr>
<td>
<img src="game_art/img/terminus_overview_poster.png" title="Terminus"/> 
</td>
<td>
<p>A rewrite of <a href="http://mprat.github.io/Terminus/">mprat's Terminus game</a> (<a href="https://github.com/mprat/Terminus/">code</a>)</p>
<p>Terminus is a text adventure game running on your Web browser.</p>
<p></p>
<p>In a mysterious land, both physical and magical powers had been surpassed by a new power : the command line.  Lost somewhere in this land, you discover that you could use this power without knowing how. </p>
<p>Jouer (French) : <a href="https://luffah.xyz/bidules/Terminus/">Démo du jeu</a></p>
<p>
Note : If you tested the original Terminus game, you may discover that : the scenario had been altered; the MIT part and the 'add' locker command had been removed, because these things are really specific to MIT; 
there is sounds...
</p>

</td>
</tr>
</table>



Why ?
=====
Originally, the project was intended to translate the game "Terminus" from English to French.
Now, this framework is an attempt to be a kind of command line based "Twine" with files and programs as items for the player. 

### Dialogs outside of code
Dialogs and relation between object was written in code.
This was an obstacle for translation contributors.

Here, the file structure and dialogs has been put outside of code.
The dialogs are referenced with a keyword like (e.g. `room_home_text`).
Translations can be found in each directory, but can be all gathered in one `po` file.

### No Interactive Fiction maker that could easily describe files permissions and commands was found
The needs :
* textual player input that provide completion
* the world as filesystem
* all items (that include game items and characters) described with dynamic properties
* an item can have specific behavior with any command
* the programs (commands that are not a shell function) are items
* The player shall be able create/read/copy/move/rename/delete items and use commands on them

Here, each item have a text description and additional properties (including the program associated to the file).
If it is a quest item, the properties can be filled when it appears in the right place.

### This framework just reproduce the behavior of a shell. Why not just sandboxing some `rootfs` ?
Yes, it could do the job. You can even add sound, images and event with a small bunch of code that the source a profile on each directory.
(look at `tiv` for images, and `aplay` for sounds)

But sometimes, you need to add some restrictions, and extra features to make a game interesting.



The aim is not to destroy the enemy, no, you'll just have to help people you could meet.


Build
=====

### For test
Next, `make` updates texts (using '''.po''' files) and produce a minified version of the code.

### For final build
In order to produce a code usable in all browsers, you need `NodeJs` with `npm`.

Start game
==========
`make server`,  select the game and go to the url given as response. 

Language
========
Edit `.po` files in game directory to edit translation.
In `tools/gamedev`, there is tools to generate the `.pot` file, and ensure all references are translated.

Why the terminal ?
==================
Our usage of computers are focused on graphical user interfaces.
By ignoring command line, you miss a huge collection of usefull tool you can use to automate your task.

Some examples of things you can easily do with command line :
- find files or a specific informations
- change a word for each file of a collection of thousand
- convert your whole multimedia library in any format
- insert text (or copyrights) in images and videos
- press a key every 2 seconds, without touching your keyboard
- install applications from source
- use advanced options
- access servers
- develop scripts to repeat useful tasks


Note for game dev
=================
- `make build` can be used to build the game(s) in `./game`
- `make fetch_ressources` can be used to fetchs ressources registered `./ressources`
- `./game/terminus/devenv.sh` set up a bash shell for dev...
- to work on develop branch : `git fetch origin; git checkout --track origin/develop`
- get missing tools `git submodule update --init --recursive`


