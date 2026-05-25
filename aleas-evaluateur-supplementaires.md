# 20 aléas supplémentaires possibles

Les 2 aléas déjà donnés ne sont pas repris ici. La liste ci-dessous va du plus facile au plus difficile.

1. **Intitulé** : Ajouter un champ prérempli dans le formulaire.
   - **Difficulté** : ⭐
   - **Pourquoi c'est déstabilisant** : Ça paraît simple, mais dans un formulaire déjà connecté aux données, il faut éviter d’écraser une valeur saisie par l’utilisateur au mauvais moment.

2. **Intitulé** : Rendre un champ obligatoire seulement dans certains cas.
   - **Difficulté** : ⭐
   - **Pourquoi c'est déstabilisant** : La logique de validation devient conditionnelle, ce qui est souvent plus délicat qu’un simple `required`.

3. **Intitulé** : Ajouter un bouton pour remettre le formulaire à zéro.
   - **Difficulté** : ⭐
   - **Pourquoi c'est déstabilisant** : Il faut distinguer les valeurs à effacer de celles à conserver, surtout si le formulaire est alimenté par plusieurs sources.

4. **Intitulé** : Afficher un compteur en temps réel pendant la saisie.
   - **Difficulté** : ⭐
   - **Pourquoi c'est déstabilisant** : Le texte affiché doit suivre la saisie sans retard ni décalage visuel, ce qui peut révéler des soucis de rafraîchissement.

5. **Intitulé** : Ajouter un tri automatique à l’ouverture d’une liste.
   - **Difficulté** : ⭐⭐
   - **Pourquoi c'est déstabilisant** : Le tri semble trivial, mais il peut casser l’ordre attendu ailleurs ou révéler une dépendance cachée au format des données.

6. **Intitulé** : Filtrer une liste avec un critère visible dans l’interface.
   - **Difficulté** : ⭐⭐
   - **Pourquoi c'est déstabilisant** : Entre l’état local, les données affichées et les données d’origine, il faut choisir le bon point de vérité.

7. **Intitulé** : Garder un filtre actif après changement de page.
   - **Difficulté** : ⭐⭐
   - **Pourquoi c'est déstabilisant** : Ça oblige à persister l’état, alors que beaucoup d’implémentations Angular/Vue/React le laissent disparaître au changement de vue.

8. **Intitulé** : Afficher un message différent selon le type d’erreur.
   - **Difficulté** : ⭐⭐
   - **Pourquoi c'est déstabilisant** : Les erreurs réseau, métier et validation arrivent souvent au même endroit, mais ne doivent pas être traitées comme une seule catégorie.

9. **Intitulé** : Empêcher un bouton d’action tant que les données ne sont pas chargées.
   - **Difficulté** : ⭐⭐⭐
   - **Pourquoi c'est déstabilisant** : Le vrai piège est le timing : l’écran peut s’afficher avant la fin du chargement, puis se reconfigurer ensuite.

10. **Intitulé** : Ajouter une confirmation avant une suppression sensible.
    - **Difficulté** : ⭐⭐⭐
    - **Pourquoi c'est déstabilisant** : Il faut intercepter l’action au bon endroit sans casser le flux de suppression déjà existant.

11. **Intitulé** : Mettre à jour immédiatement une liste après une modification.
    - **Difficulté** : ⭐⭐⭐
    - **Pourquoi c'est déstabilisant** : On veut éviter le rechargement complet, mais il faut garder la liste cohérente avec ce que le serveur renvoie.

12. **Intitulé** : Calculer automatiquement un total à partir de plusieurs lignes.
    - **Difficulté** : ⭐⭐⭐
    - **Pourquoi c'est déstabilisant** : Le calcul est simple, mais il devient fragile si les lignes sont modifiées, ajoutées ou supprimées dynamiquement.

13. **Intitulé** : Préremplir un écran à partir d’une donnée chargée plus tard.
    - **Difficulté** : ⭐⭐⭐⭐
    - **Pourquoi c'est déstabilisant** : En Angular, l’instant où la donnée arrive peut être contre-intuitif, surtout si le composant a déjà rendu une première fois.

14. **Intitulé** : Afficher un état intermédiaire pendant plusieurs chargements en parallèle.
    - **Difficulté** : ⭐⭐⭐⭐
    - **Pourquoi c'est déstabilisant** : Il faut gérer un chargement partiel plutôt qu’un simple oui/non, ce qui devient vite pénible avec plusieurs appels asynchrones.

15. **Intitulé** : Refaire un écran sans perdre la position dans la page.
    - **Difficulté** : ⭐⭐⭐⭐
    - **Pourquoi c'est déstabilisant** : Le rafraîchissement visuel peut remonter la page ou réinitialiser des éléments, alors que l’utilisateur s’attend à rester au même endroit.

16. **Intitulé** : Ajouter une sélection qui change les options d’un autre champ.
    - **Difficulté** : ⭐⭐⭐⭐
    - **Pourquoi c'est déstabilisant** : On touche à des dépendances entre champs, et une mise à jour mal gérée peut effacer une valeur déjà choisie.

17. **Intitulé** : Modifier une ligne imbriquée sans casser le reste du formulaire.
    - **Difficulté** : ⭐⭐⭐⭐
    - **Pourquoi c'est déstabilisant** : Les structures imbriquées sont souvent plus simples à lire qu’à maintenir, surtout quand une seule ligne doit se rafraîchir.

18. **Intitulé** : Dupliquer un élément en conservant certaines infos mais pas les identifiants techniques.
    - **Difficulté** : ⭐⭐⭐⭐⭐
    - **Pourquoi c'est déstabilisant** : Il faut copier juste ce qu’il faut : trop peu casse le flux métier, trop copie crée des collisions ou des doublons invisibles.

19. **Intitulé** : Recalculer l’affichage après une mise à jour venant d’un service partagé.
    - **Difficulté** : ⭐⭐⭐⭐⭐
    - **Pourquoi c'est déstabilisant** : Le changement peut bien exister dans les données, mais ne pas apparaître immédiatement à l’écran selon la façon dont le composant écoute les mises à jour.

20. **Intitulé** : Faire en sorte qu’un changement dans un tableau se reflète partout sans recharger la page.
    - **Difficulté** : ⭐⭐⭐⭐⭐
    - **Pourquoi c'est déstabilisant** : C’est le genre d’ajustement qui expose les limites de synchro entre écrans, services, cache local et rendu, surtout dans une app déjà assez riche en listes et en imports.
