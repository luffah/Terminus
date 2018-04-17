Dans un univers où la magie a été remplacée par le mystérieux pouvoir de la ligne de commande, vous incarnez un personnage démuni qui n'aura d'autre choix que d'en servir pour reprendre le contrôle de sa vie.

Terminus est un jeu d'aventure textuel (jouable sur un navigateur Web), le but n'est pas de vaincre ou détruire des ennemis, mais d'aider les autres personnes que tu rencontre. 

Pour contribuer, voir le [wiki](https://github.com/luffah/Terminus/wiki) et les [règles de contributions](https://github.com/luffah/Terminus/wiki/R%C3%A8gles-de-contributions).


Compilation
===========
Pour compiler les éléments du jeu, `NodeJs` est requis.

Ensuite, il suffit de faire `make` qui met à jour les dialogues (en se basant sur les fichiers '''.po''') et produit seulement une version compacte du code.


Lancer le jeu (test)
======================
Ouvrir `src/index.html`.

# Version minifiée
La version minifiée est dans `webroot`.

Langue
======================
Pour compiler les dialogues, `NodeJs` est requis.

# Changer la langue du jeu
Dans `src/index.html`, modifier la ligne contenant 'terminus.dialog.lang.js'.

# Faire des corrections
Éditer les fichiers '''.po''' dans '''src/js''' et faire '''make''' pour générer les nouveaux dialogues.
("terminal.dialog.lang.js").

