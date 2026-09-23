import * as migration_20260923_194627_initial from './20260923_194627_initial';

export const migrations = [
  {
    up: migration_20260923_194627_initial.up,
    down: migration_20260923_194627_initial.down,
    name: '20260923_194627_initial'
  },
];
