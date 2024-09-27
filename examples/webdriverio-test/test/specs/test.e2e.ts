import { driver } from '@wdio/globals';
// import * as assert from 'assert';
import type { Suite } from 'mocha';
import {
  appNavigationLabels,
  connectScreenLabels,
  previewScreenLabels,
  roomScreenLabels,
  soundOutputDevicesLabels,
} from '@fishjam-example/fishjam-chat/types/ComponentLabels';

// import {FishjamClient, FishjamConfig, Peer, Room} from "@fishjam-cloud/js-server-sdk";

import { getElement, swipeDown, tapApp, tapButton } from '../../utils';
// import {getElement, getHttpUrl, getWebsocketUrl, swipeDown, tapApp, tapButton, typeToInput,} from '../../utils';

const { TOKEN_TAB } = appNavigationLabels;
const { CONNECT_BUTTON } = connectScreenLabels;
// const { CONNECT_BUTTON } = connectScreenLabels;
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

// TODO: Remove after fixing: FCE-504
const SKIP_IOS_TODO = driver.isIOS;

type Test = {
  name: string;
  run: () => Promise<void>;
  skip: boolean;
};

// const configParam: FishjamConfig = {
//   serverToken: 'development',
//   fishjamUrl: getHttpUrl(process.env.FISHJAM_HOST_SERVER as string),
// };

// const client = new FishjamClient(configParam)
//
//
// const createFishjamRoom = async () => {
//   try {
//     return await client.createRoom();
//   } catch (e) {
//     console.log(e);
//   }
// };
// const addPeerToRoom = async (
//   roomId: string,
// ) => {
//   try {
//     const response = await client.createPeer(roomId, );
//     console.log(response)
//     return response;
//   } catch (e) {
//     console.log(e);
//   }
// };
//
// let peerDetails: {
//   peer: Peer;
//   token: string;
// } | undefined;
// let room: Room | undefined;

const tests: Test[] = [
  // {
  //   name: 'create room and peer to obtain credentials',
  //   run: async () => {
  //     room = await createFishjamRoom();
  //     assert.ok(room !== undefined);
  //     peerDetails = await addPeerToRoom(room.id);
  //     assert.ok(peerDetails !== undefined);
  //   },
  //   skip: false,
  // },
  {
    name: 'type fishjam url and token',
    run: async () => {
      // assert.ok(peerDetails !== undefined);
      // const webSocketUrl = getWebsocketUrl(
      //   process.env.FISHJAM_HOST_MOBILE as string,
      // );
      await tapButton(driver, '~' + TOKEN_TAB);
      // await typeToInput(driver, '~' + TOKEN_INPUT,"SFMyNTY.g2gDdAAAAAJkAAdwZWVyX2lkbQAAACQyZGQ2OWU1MS1kNGMzLTQyY2QtYTMwMC1lODgzNmRlMmI4NmNkAAdyb29tX2lkbQAAAAE1bgYAfldGM5IBYgABUYA.kaVfloe3c6tX7VljQLyJB3h-gQ0mfdaoVnS_3_OWRkk");
      // await typeToInput(driver, '~' + URL_INPUT, "ws://192.168.83.211:5002");
    },
    skip: false,
  },
  {
    name: 'request necessary permissions and connect',
    run: async () => {
      await tapButton(driver, '~' + CONNECT_BUTTON);
      if (driver.isIOS) {
        await driver.acceptAlert();
        await driver.pause(1000);
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
      await driver.pause(1000);
      if (driver.isIOS) {
        await driver.acceptAlert();
      }
      await driver.pause(1000);
    },
    skip: false,
  },
  {
    name: 'check if no camera view',
    run: async () => {
      await getElement(driver, '~' + NO_CAMERA_VIEW);
      //todo remove next lines of code when this issue is solved https://membraneframework.atlassian.net/browse/RTC-549
      await driver.pause(4000);
      //todo up to here
    },
    skip: SKIP_IOS_TODO,
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
    skip: SKIP_IOS_TODO,
  },
  {
    name: 'check if two video cells',
    run: async () => {
      await getElement(driver, '~' + VIDEO_CELL + 0);
      await getElement(driver, '~' + VIDEO_CELL + 1);
      await getElement(driver, '~' + VIDEO_CELL + 3, true);
    },
    skip: SKIP_IOS_TODO,
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
      await getElement(driver, '~' + VIDEO_CELL + 0);
      await getElement(driver, '~' + VIDEO_CELL + 1, true);
    },
    skip: SKIP_IOS_TODO,
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
    skip: SKIP_IOS_TODO,
  },
  {
    name: 'check if no camera view again',
    run: async () => {
      await getElement(driver, '~' + NO_CAMERA_VIEW);
    },
    skip: SKIP_IOS_TODO,
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
