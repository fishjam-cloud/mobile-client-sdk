import type { Options } from '@wdio/types';

import { capabilities } from './configuration';
import * as dotenv from 'dotenv';

dotenv.config({
  path: '.env',
});

export const config: Options.Testrunner = {
  runner: 'local',
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: {
      project: './tsconfig.json',
      transpileOnly: true,
    },
  },
  port: 4723,
  specs: ['./test/specs/**/*.ts'],
  exclude: [],
  maxInstances: 10,
  capabilities,
  logLevel: 'info',
  bail: 1,
  baseUrl: '127.0.0.1',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services: [
    [
      'appium',
      {
        command: 'appium',
      },
    ],
  ],
  framework: 'mocha',
  reporters: [
    [
      'spec',
      {
        showPreface: false,
      },
    ],
  ],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
    bail: true,
  },
};
