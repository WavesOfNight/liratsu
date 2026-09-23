/**
 * Démarre un PostgreSQL local "embarqué" pour le développement (aucune installation requise).
 * Données dans ./.pgdata. NE PAS utiliser en production (voir README, section Plesk).
 *
 * Usage : npm run db:local   (laisser tourner dans un terminal séparé)
 */
import EmbeddedPostgres from 'embedded-postgres'
import { existsSync } from 'node:fs'

const pg = new EmbeddedPostgres({
  databaseDir: './.pgdata',
  user: 'liratsu',
  password: 'liratsu',
  port: 5432,
  persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
})

const fresh = !existsSync('./.pgdata/PG_VERSION')
if (fresh) await pg.initialise()
await pg.start()
if (fresh) await pg.createDatabase('liratsu')
console.log('✔ PostgreSQL local prêt : postgres://liratsu:liratsu@127.0.0.1:5432/liratsu')

const stop = async () => {
  await pg.stop()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
setInterval(() => {}, 1 << 30)
