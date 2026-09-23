/**
 * Registre des mini-jeux de l'Arcade. Pour ajouter un jeu : créer son dossier dans
 * src/game/<slug>/ avec un composant par défaut, l'ajouter ici et créer sa page
 * src/app/(frontend)/arcade/<slug>/page.tsx (chargement dynamique ssr:false).
 */
export type ArcadeGame = { slug: string; title: string; tagline: string; color: string; status: 'live' | 'soon' }

export const ARCADE_GAMES: ArcadeGame[] = [
  { slug: 'the-saac', title: 'The Saac', tagline: 'Die & retry aquatique : bulles, poissons rouges et pop-ups d’erreur.', color: '#3FA9F5', status: 'live' },
  { slug: 'bientot', title: '???', tagline: 'Une nouvelle borne arrive bientôt…', color: '#FF7EB6', status: 'soon' },
]
