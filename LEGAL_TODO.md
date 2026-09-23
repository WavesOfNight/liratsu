# LEGAL_TODO — points juridiques à relire avant mise en ligne

Les textes juridiques de Reads Records n'ont **pas** été récupérés automatiquement :
comme convenu, ils seront **saisis dans l'admin** (Légal > Pages légales, et Légal >
Identité légale). Le seed installe des **modèles adaptés au site Liratsu** qui servent
de base de travail. Aucune information d'identification de Reads Records n'a été
inventée : elles sont remplacées à l'affichage par les valeurs du global
« Identité légale » (`{{editeur.nom}}`, `{{editeur.siren}}`…) et restent visibles
sous la forme **« [à renseigner] »** tant qu'elles sont vides.

> Si des textes de Reads Records sont déposés dans `/legal-source/<slug>.md`
> (`mentions-legales`, `cgu`, `cgv`, `confidentialite`, `cookies`) **avant** le premier
> `npm run seed`, ils sont utilisés à la place des modèles.

## 1. À renseigner dans l'admin (Légal > Identité légale)

- [ ] Dénomination, forme (SARL), capital, siège, RCS, SIREN/SIRET, TVA intracom.
- [ ] Directeur·rice de la publication, email et téléphone de contact.
- [ ] Email dédié aux demandes RGPD (`dpoEmail`).
- [ ] Hébergeur IONOS : adresse et téléphone **à vérifier** sur ionos.fr (champ pré-rempli « [À VÉRIFIER] »).
- [ ] Médiateur de la consommation (nom + site) — **obligatoire** pour vendre à des consommateurs.
- [ ] Boutique > Paramètres boutique > Factures : coordonnées de l'émetteur si différentes.

## 2. Contenus ajoutés par rapport aux textes Reads Records (à valider)

Tous les points ci-dessous sont spécifiques au site Liratsu et ont été rédigés pour lui :

**Mentions légales**
- [ ] Objet du site (site officiel de la streameuse, boutique, communauté, mini-jeux).
- [ ] Propriété intellectuelle des créations de Liratsu ; fanarts sous licence d'affichage.
- [ ] Procédure de signalement de contenu illicite (LCEN art. 6).
- [ ] Crédit « Site conçu et développé par El Technico Lionel ».

**CGU**
- [ ] Connexion Twitch OAuth (données récupérées, non-conservation du jeton).
- [ ] Livre d'or : modération a priori, contenus interdits, **filtre automatique** (refus des liens, des coordonnées personnelles et des insultes) — à mentionner dans les CGU.
- [ ] Fanarts : licence d'affichage gratuite, non exclusive, site + lives, retrait sur simple demande ; suppression des métadonnées EXIF à l'envoi ; email de décision si une adresse est laissée.
- [ ] Mini-jeux : pseudo public, modération, sanction de la triche.
- [ ] Codes surprise : sans valeur monétaire, non échangeables, peuvent expirer.

**CGV**
- [ ] Deux types de produits (impression à la demande Gelato / stock propre).
- [ ] Délais de fabrication et de livraison **variables** (Gelato).
- [ ] Droit de rétractation 14 jours + **exclusion des produits personnalisés** (L.221-28 3°) — les produits concernés sont à cocher « personnalisé » dans l'admin.
- [ ] Garanties légales de conformité et des vices cachés (textes résumés : vérifier la formulation exacte exigée par l'article L.217-… à jour).
- [ ] Bons de réduction non cumulables sauf mention contraire.
- [ ] Paiement Stripe / PayPal, remboursement sur le moyen de paiement d'origine.
- [ ] Lien vers la plateforme européenne RLL (vérifier qu'elle est toujours en service : la Commission a annoncé sa fermeture).
- [ ] Vente aux mineurs : phrase ajoutée dans la politique de confidentialité, à harmoniser avec les CGV.

**Politique de confidentialité**
- [ ] Tableau des traitements : finalités, bases légales, **durées de conservation** proposées (3 ans clients, 10 ans factures, 12 mois logs, 2 ans classement / membres inactifs) — à valider.
- [ ] Sous-traitants : IONOS, Stripe, PayPal, Gelato, Twitch, fournisseur SMTP **[À RENSEIGNER]**, transporteurs.
- [ ] Transferts hors UE (DPF / clauses contractuelles types) : à vérifier prestataire par prestataire.
- [ ] Mention « moins de 15 ans » (consentement parental, art. 45 loi I&L).
- [ ] Coordonnées CNIL.

**Politique cookies**
- [ ] Liste des traceurs nécessaires (localStorage : préférences, panier, consentement 6 mois ; session admin).
- [ ] Contenus tiers bloqués avant consentement + liens vers les politiques Twitch/YouTube/TikTok/Instagram.
- [ ] Mesure d'audience auto-hébergée (Umami/Plausible) uniquement après consentement.

## 3. Points techniques liés au juridique

- [ ] Numérotation des factures : séquence PostgreSQL par année (`LIR-2026-00001`). Une transaction échouée peut « consommer » un numéro : vérifier avec l'expert-comptable si un trou de numérotation doit être justifié.
- [ ] Mentions obligatoires de facture (adresse de l'émetteur, SIREN, TVA) : alimentées par l'admin.
- [ ] Régime de TVA de Reads Records (franchise en base ? taux applicables aux produits Gelato expédiés hors France / OSS) : **à confirmer avec le comptable** ; les taux sont configurables dans l'admin.
- [ ] Commandes Gelato en mode test = brouillons (rien n'est fabriqué ni facturé).
