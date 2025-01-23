### Guide rapide de comment utiliser git

# Initialisation

Pour initialiser git écrivez "git init" dans l'invite de commandes
Ensuite écrivez :
    - git remote add "origin" https://github.com/Nathan-Cel/Cli_Egerine.git

# Aller chercher les nouveautés

Si des modifications ont été faîtes par d'autres et déposées, vous pouvez vous tenir à jour avec :
    - git pull origin main

Si vous créez une nouvelle branche, changez 'main' contre le nom de la branche en question

# Modification

Vous avez créé ou modifié un ou plusieurs fichiers et vous voulez appliquer ces changements : 
    - git add monfichier.py
    - git add .

La fonction "add" ajoute le ou les fichiers spécifiés à un requête qui pourra plus tard être envoyée
"git add ." ajoute absoluments tous les fichiers à cette requête

# Envoi

Une fois les fichiers ajoutés à cette requête, il faut maintenant l'envoyer vers le dêpot avec la fonction :
    - git push lien_vers_le_dêpot.git

Donc pour notre dêpot : git push https://github.com/Nathan-Cel/Cli_Egerine.git


## .gitignore

J'ai ajouté un fichier .gitignore qui sert simplement à ce que git ignore certains dossiers ou fichiers lors de constructions de requêtes.

Par exemple, j'ai sur dans mon dossiers du projet un sous dossiers appelé "Tests" où je mets tous mes fichiers tests, or ça ne sert à rien de le partager avec vous. Donc dans le fichier .gitignore je rajoute : "Tests/**"

Des commentaires sont mit dedans pour comprendre comment l'utiliser