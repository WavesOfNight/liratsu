import * as migration_20260924_013002_initial from './20260924_013002_initial';
import * as migration_20260924_023225_add_site_maintenance from './20260924_023225_add_site_maintenance';
import * as migration_20260924_123500_add_schedule_page from './20260924_123500_add_schedule_page';
import * as migration_20260924_151400_schedule_title_optional from './20260924_151400_schedule_title_optional';
import * as migration_20260924_163000_broadcaster_followers from './20260924_163000_broadcaster_followers';
import * as migration_20260924_180000_member_account from './20260924_180000_member_account';
import * as migration_20260924_215500_remove_fish_toggle from './20260924_215500_remove_fish_toggle';

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
  {
    up: migration_20260924_163000_broadcaster_followers.up,
    down: migration_20260924_163000_broadcaster_followers.down,
    name: '20260924_163000_broadcaster_followers'
  },
  {
    up: migration_20260924_180000_member_account.up,
    down: migration_20260924_180000_member_account.down,
    name: '20260924_180000_member_account'
  },
  {
    up: migration_20260924_215500_remove_fish_toggle.up,
    down: migration_20260924_215500_remove_fish_toggle.down,
    name: '20260924_215500_remove_fish_toggle'
  },
];
