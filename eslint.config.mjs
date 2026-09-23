import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

/** ESLint (flat config natif de Next.js 16). */
const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^(_|ignore)' }],
      // Images décoratives/avatars externes servis hors next/image volontairement (SVG, avatars Twitch).
      '@next/next/no-img-element': 'off',
    },
  },
  {
    ignores: ['.next/', 'node_modules/', 'src/payload-types.ts', 'src/app/(payload)/admin/importMap.js', 'src/migrations/', 'reference/', 'public/'],
  },
]

export default eslintConfig
