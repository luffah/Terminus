In a mysterious land, both physical and magical powers had been surpassed by a new power.
The land is very peaceful, but great powers involve great struggles.
Awakened in a strangely familiar place, you discover that you could use this power without knowing how.
Now, you want to learn how to use it.

Terminus is a text adventure game running on your Web browser.

The aim is not to destroy the enemy, no, you'll just have to help people you could meet.


Join the team
=============
Sorry, the English part of this project is completely destroyed.
Anyway, if you wish to collaborate on this project,
take a look at the Framateam page https://framateam.org/terminusjeu

Just declare your presence to invite people to speak English.

Compile
===========
In order to compile,  you need `NodeJs`.

Next, `make` updates texts (using '''.po''' files) and produce a minified version of the code.

Start game (test)
======================
Open `src/index.html`.

# Minified version
The same in `webroot`.

Language
======================

# Change lang
In `src/index.html`, modify line 'terminus.dialog.lang.js'.

# Corrections
Edit '''.po''' files in '''src/js''' and do `make`. 
(it produce "terminal.dialog.lang.js").

Educational targets
===================
The game aims to

- encourage curiosity
- initiate to terminal / command line
+ be usable for game hacking / creation (aim of the fork)

Why the terminal ?
==================
Our usage of computers are focused on graphical user interfaces,
but most of the advanced settings of a system are only accessible with the console mode.
This is done :

- because this is simplest solution, especially for the server machines
- because it asks less resources to the computer
- because many powerful tools are only usable on command line interface, in order to be used in scripts
- to avoid to fear users about things they don't know how to use

By not knowing the command line and scripting.
The user is limited by usage, and is jailed in waiting that some software will do something approaching to the needs.
Therefore the command line tools are very well documented without asking on the Web.

By learning how work command line, you'll be able to do things on your computer, and on a server, such as :

- installing non-packaged applications
- finding files or a specific informations without installing a new software
- calling scripts and programs with advanced options
- accessing servers
- develop simple scripts for launching a set of applications with one click


Deviant part
============
If you tested the original Terminus game, you may discover that :

- the scenario had been altered
- the MIT part and the 'add' locker command had been removed, because these things are really specific to MIT
- there is sounds
- UI has changed in order to be usable with click only
- UI cheats on the accessibility...
