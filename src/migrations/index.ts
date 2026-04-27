import * as migration_20260424_122019 from './20260424_122019';
import * as migration_20260424_180000 from './20260424_180000';
import * as migration_20260427_120000 from './20260427_120000';

export const migrations = [
  {
    up: migration_20260424_122019.up,
    down: migration_20260424_122019.down,
    name: '20260424_122019'
  },
  {
    up: migration_20260424_180000.up,
    down: migration_20260424_180000.down,
    name: '20260424_180000'
  },
  {
    up: migration_20260427_120000.up,
    down: migration_20260427_120000.down,
    name: '20260427_120000'
  },
];
