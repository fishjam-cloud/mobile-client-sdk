import { PeerDetailsResponseData, Room } from '@fishjam-cloud/fishjam-openapi';
import { driver } from '@wdio/globals';
import * as assert from 'assert';
import type { Suite } from 'mocha';
import {
  connectScreenLabels,
  roomScreenLabels,
  previewScreenLabels,
  soundOutputDevicesLabels,
  appNavigationLabels,
} from '@fishjam-example/fishjam-chat/types/ComponentLabels';

import {
  getElement,
  tapApp,
  tapButton,
  typeToInput,
  swipeDown,
} from '../../utils/appium_utils.ts';
import {
  addPeerToRoom,
  createFishjamRoom,
  getWebsocketUrl,
} from '../../utils/fishjam_cloud_utils.ts';
import { type Test } from '../../models.ts';

const { TOKEN_TAB } = appNavigationLabels;
const { URL_INPUT, TOKEN_INPUT, CONNECT_BUTTON } = connectScreenLabels;
const {
  JOIN_BUTTON,
  TOGGLE_CAMERA_BUTTON: TOGGLE_CAMERA_BUTTON_PREVIEW,
  TOGGLE_MICROPHONE_BUTTON: TOGGLE_MICROPHONE_BUTTON_PREVIEW,
  SELECT_AUDIO_OUTPUT,
} = previewScreenLabels;
const {
  SWITCH_CAMERA_BUTTON,
  SHARE_SCREEN_BUTTON,
  DISCONNECT_BUTTON,
  TOGGLE_CAMERA_BUTTON,
  NO_CAMERA_VIEW,
  TOGGLE_MICROPHONE_BUTTON,
  VIDEO_CELL,
} = roomScreenLabels;

const { TITLE_TEXT, OUTPUT_DEVICE_BUTTON } = soundOutputDevicesLabels;

const { OUTPUT_DEVICES_BOTTOM_SHEET } = soundOutputDevicesLabels;

let peerDetails: PeerDetailsResponseData | undefined;
let room: Room | undefined;

const shouldSkipIOSScreenCast =
  driver.isIOS && !(process.env.IOS_TEST_SCREEN_BROADCAST === 'true');

const tests: Test[] = [
  {
    name: 'create room and peer to obtain credentials',
    run: async () => {
      room = await createFishjamRoom();
      assert.ok(room !== undefined);
      peerDetails = await addPeerToRoom(room.id);
      assert.ok(peerDetails !== undefined);
    },
    skip: false,
  },
  {
    name: 'type fishjam url and token',
    run: async () => {
      assert.ok(peerDetails !== undefined);
      const webSocketUrl = getWebsocketUrl(
        process.env.FISHJAM_HOST_MOBILE as string,
      );
      await tapButton(driver, '~' + TOKEN_TAB);
      await typeToInput(driver, '~' + TOKEN_INPUT, peerDetails.token);
      await typeToInput(driver, '~' + URL_INPUT, webSocketUrl);
    },
    skip: false,
  },
  {
    name: 'request necessary permissions and connect',
    run: async () => {
      await tapButton(driver, '~' + CONNECT_BUTTON);
      if (driver.isIOS) {
        try {
          // sometimes permissions are already granted
          await driver.acceptAlert();
        } catch (e) {
          console.log(e);
        }
      }
    },
    skip: false,
  },
  {
    name: 'change sound output device',
    run: async () => {
      await tapButton(driver, '~' + SELECT_AUDIO_OUTPUT);
      if (driver.isAndroid) {
        await getElement(driver, '~' + TITLE_TEXT);
        await tapButton(driver, '~' + OUTPUT_DEVICE_BUTTON + 0);
        await swipeDown(driver, '~' + OUTPUT_DEVICES_BOTTOM_SHEET);
      } else {
        await tapApp(driver);
      }
      await driver.pause(100);
    },
    skip: false,
  },
  {
    name: 'toggle off preview camera and microphone then join the room',
    run: async () => {
      await tapButton(driver, '~' + TOGGLE_MICROPHONE_BUTTON_PREVIEW);
      await tapButton(driver, '~' + TOGGLE_CAMERA_BUTTON_PREVIEW);
      await tapButton(driver, '~' + JOIN_BUTTON);
      if (driver.isIOS) {
        try {
          // sometimes permissions for local network are already granted or connection is not for local network
          await driver.acceptAlert();
        } catch {
          console.log('Alert could not be accepted');
        }
      }
    },
    skip: false,
  },
  {
    name: 'check if no camera view',
    run: async () => {
      await driver.pause(500);
      await getElement(driver, '~' + NO_CAMERA_VIEW);
    },
    skip: false,
  },
  {
    name: 'toggle camera on',
    run: async () => {
      await tapButton(driver, '~' + TOGGLE_CAMERA_BUTTON);
    },
    skip: false,
  },
  {
    name: 'check if only one video cell',
    run: async () => {
      await getElement(driver, '~' + VIDEO_CELL + 0);
      await getElement(driver, '~' + VIDEO_CELL + 1, true);
    },
    skip: false,
  },
  {
    name: 'switch camera',
    run: async () => {
      await tapButton(driver, '~' + SWITCH_CAMERA_BUTTON);
    },
    skip: false,
  },
  {
    name: 'screen share on',
    run: async () => {
      await tapButton(driver, '~' + SHARE_SCREEN_BUTTON);
      if (driver.isAndroid) {
        try {
          await driver.acceptAlert();
        } catch {
          await driver.pause(100);
          let selector = 'new UiSelector().text("A single app")';
          let button = await driver.$(`android=${selector}`);
          button?.click();
          await driver.pause(100);

          selector = 'new UiSelector().text("Entire screen")';
          button = await driver.$(`android=${selector}`);
          button?.click();
          await driver.pause(100);

          selector = 'new UiSelector().text("Start")';
          button = await driver.$(`android=${selector}`);
          button?.click();
        }
      } else {
        const buttons = await driver.$$('//XCUIElementTypeButton');
        const button = buttons[0];
        await button?.click();
        await tapApp(driver);
      }
    },
    skip: shouldSkipIOSScreenCast,
  },
  {
    name: 'check if two video cells',
    run: async () => {
      await driver.pause(500);
      await getElement(driver, '~' + VIDEO_CELL + 0);
      await getElement(driver, '~' + VIDEO_CELL + 1);
      await getElement(driver, '~' + VIDEO_CELL + 3, true);
    },
    skip: shouldSkipIOSScreenCast,
  },
  {
    name: 'toggle camera off',
    run: async () => {
      await tapButton(driver, '~' + TOGGLE_CAMERA_BUTTON);
    },
    skip: false,
  },
  {
    name: 'check if only 1 video cell',
    run: async () => {
      await driver.pause(500);
      await getElement(driver, '~' + VIDEO_CELL + 0);
      await getElement(driver, '~' + VIDEO_CELL + 1, true);
    },
    skip: shouldSkipIOSScreenCast,
  },
  {
    name: 'screen share off',
    run: async () => {
      await tapButton(driver, '~' + SHARE_SCREEN_BUTTON);
      if (driver.isIOS) {
        const buttons = await driver.$$('//XCUIElementTypeButton');
        await buttons[1]?.click();
      }
      await tapApp(driver);
    },
    skip: shouldSkipIOSScreenCast,
  },
  {
    name: 'check if no camera view again',
    run: async () => {
      await getElement(driver, '~' + NO_CAMERA_VIEW);
    },
    skip: false,
  },
  {
    name: 'toggle microphone on',
    run: async () => {
      await tapButton(driver, '~' + TOGGLE_MICROPHONE_BUTTON);
    },
    skip: false,
  },
  {
    name: 'toggle microphone off',
    run: async () => {
      await tapButton(driver, '~' + TOGGLE_MICROPHONE_BUTTON);
    },
    skip: false,
  },
  {
    name: 'disconnect from room',
    run: async () => {
      await tapButton(driver, '~' + DISCONNECT_BUTTON);
    },
    skip: false,
  },
  {
    name: 'connect one more time',
    run: async () => {
      await tapButton(driver, '~' + CONNECT_BUTTON);
      await driver.pause(200);
      await tapButton(driver, '~' + JOIN_BUTTON);
      await driver.pause(200);
      await tapButton(driver, '~' + DISCONNECT_BUTTON);
    },
    skip: false,
  },
];
describe('Walk through app', async function (this: Suite): Promise<void> {
  for (const { name, run, skip } of tests) {
    const testFunction = skip ? it.skip : it.only;
    testFunction(name, async () => {
      await run();
    }).retries(4);
  }
});
