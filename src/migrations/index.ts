import * as migration_20260924_013002_initial from './20260924_013002_initial';

export const migrations = [
  {
    up: migration_20260924_013002_initial.up,
    down: migration_20260924_013002_initial.down,
    name: '20260924_013002_initial'
  },
];
