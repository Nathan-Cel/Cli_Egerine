# OIP
Le projet Optimisation des Itinéraires Publicitaires est un projet visant comme son nom l'indique à optimiser les trajets de vélos publicitaires afin d'avoir le plus grand impact au près des consommateurs et passer devant un maximum de personnes.
Pour se faire l'algorithme prends la position de l'utilisateur, lui propose 5 destinations au choix et une fois la destination choisie prends un itinéraires passant par un nombre des points d'intérêts prédéfini. 

# Généralisation
Néanmoins, ce projet reposant grandement sur des données Géographiques provisionner par des API, il est en réalité très modulable et ce repository a été mis en place pour cela. Ici il n'y a que le squelette, libre afin de pouvoir en faire ce que bon vous semble

# Comment ça marche?

Comment ce projet marche? Et bien le plus simplement du monde.

Vous avez besoin de:
    -votre propre clé API GraphHopper
    -vos données géographiques à passer sous le format : {lon : 0, lat : 0, densité : 0}

Une fois ça en poche, l'algorithme fait son boulot, quadrille votre zone de recherche et vous ressort des trajets optimisé passant par les points dont la "densité" est la plus intéressante.

# Tweaking
Vous pouvez aussi modifier certains paramètres comme le nombre de points d'intérêts par lesquels passer ou leur distance maxmale par rapport au trajet initiale

<pre><code>```javascript const maxDistanceFromRoute = 0.3; // Distance maximale (en km) pour laquelle on peut s'éloigner du chemin
const maxPOIs = 3; // Limite le nombre de POIs ajoutés```</code></pre>

# Remarque
Ce projet marche mieux pour des petits trajets, plus les trajets demandés seront longs, plus il y aura de chance qu'ils fassent des détours importants quand même. Privilégiez des trajets au niveau d'une commune ou d'un département