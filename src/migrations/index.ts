import * as migration_20260923_194627_initial from './20260923_194627_initial';
import * as migration_20260923_204305_moderation from './20260923_204305_moderation';

export const migrations = [
  {
    up: migration_20260923_194627_initial.up,
    down: migration_20260923_194627_initial.down,
    name: '20260923_194627_initial',
  },
  {
    up: migration_20260923_204305_moderation.up,
    down: migration_20260923_204305_moderation.down,
    name: '20260923_204305_moderation'
  },
];
