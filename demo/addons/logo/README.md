## Affiche un logo simple

#### 4 ressources dans cet exemples

 - **logo.html** qui contient le code html du logo (lien hypertext et image)
 - **logo.css** qui permet de saisir la taille, la position du logo ...
 - **openlayers.png** - logo a afficher
 - **config.json** - fichier qui est appele par mviewer pour construire ce composant logo.
 
 Pour que ce composant s affiche dans mviewer, il faut depuis un **config.xml** ajouter cette section :
 
 ````
 <extensions>
    <extension type="component" id="logo" path="demo/addons" />
</extensions>
 ````
