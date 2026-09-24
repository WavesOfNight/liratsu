import * as migration_20260924_013002_initial from './20260924_013002_initial';
import * as migration_20260924_023225_add_site_maintenance from './20260924_023225_add_site_maintenance';
import * as migration_20260924_123500_add_schedule_page from './20260924_123500_add_schedule_page';
import * as migration_20260924_151400_schedule_title_optional from './20260924_151400_schedule_title_optional';

export const migrations = [
  {
    up: migration_20260924_013002_initial.up,
    down: migration_20260924_013002_initial.down,
    name: '20260924_013002_initial',
  },
  {
    up: migration_20260924_023225_add_site_maintenance.up,
    down: migration_20260924_023225_add_site_maintenance.down,
    name: '20260924_023225_add_site_maintenance'
  },
  {
    up: migration_20260924_123500_add_schedule_page.up,
    down: migration_20260924_123500_add_schedule_page.down,
    name: '20260924_123500_add_schedule_page'
  },
  {
    up: migration_20260924_151400_schedule_title_optional.up,
    down: migration_20260924_151400_schedule_title_optional.down,
    name: '20260924_151400_schedule_title_optional'
  },
];
