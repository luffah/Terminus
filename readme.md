|  | | 
| :--------------------------- | :--------------------------- | 
|![Terminus : un jeu pour s'amuser avec la ligne de commande]( ./src/img/promo_image_char_pxl.png)| Contribuer : [Wiki en Français](https://github.com/luffah/Terminus/wiki) <br> <br> Essayer : [Démo du jeu (alpha)](http://luffah.xyz/bidules/Terminus/)<br> <br> Licenses : [GPLv2](./LICENSE.md) <br> <br> Version originale (English) : [mprat's Terminus game](http://mprat.github.io/Terminus/) ([code](https://github.com/mprat/Terminus/))  |

 *(Les fondements du jeu sont en cours de révision)* <br><br>

| [Français](./readme.fr.md) |  | [English](./readme.en.md) |
| :---                 | - | :---    |
| Dans un univers où la magie a été remplacée par le mystérieux pouvoir de la ligne de commande, vous incarnez un personnage démuni qui n'aura d'autre choix que d'en servir pour reprendre le contrôle de sa vie. [>> wiki](https://github.com/luffah/Terminus/wiki) [>> install](./readme.fr.md)|| In a mysterious land, both physical and magical powers had been surpassed by a new power : the command line. Lost somewhere in this land, you discover that you could use this power without knowing how. [>> wiki (not available)](https://github.com/luffah/Terminus/wiki/Home.en) [>> install](./readme.en.md) |

The engine
==========
The main purpose of this fork of Terminus is to provide an engine for interactive story.
It provide:
- most of a shell functionnalities
- picture and music support
- some dev tools

Note for game dev
=================
- `make` can be used to build the game(s) in `./game`
- `make fetch_ressources` can be used to fetchs ressources registered `./ressources`
- `./game/terminus/devenv.sh` set up a bash shell for dev...
- to work on develop branch : `git fetch origin; git checkout --track origin/develop`
- get missing tools `git submodule update --init --recursive`

