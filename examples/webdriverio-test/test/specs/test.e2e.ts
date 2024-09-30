import {
  ConfigurationParameters,
  Configuration,
  RoomApiFp,
  AddPeerRequest,
  PeerDetailsResponseData,
  Room,
} from '@fishjam-cloud/fishjam-openapi';
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
  getWebsocketUrl,
  getHttpUrl,
  tapApp,
  tapButton,
  typeToInput,
  swipeDown,
} from '../../utils';

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

type Test = {
  name: string;
  run: () => Promise<void>;
  skip: boolean;
};

const configParam: ConfigurationParameters = {
  accessToken: 'development',
  basePath: getHttpUrl(process.env.FISHJAM_HOST_SERVER as string),
};

const config = new Configuration(configParam);
const createFishjamRoom = async () => {
  const { createRoom } = RoomApiFp(config);
  const createRoomFunction = await createRoom();
  try {
    const response = await createRoomFunction();
    return response.data.data.room;
  } catch (e) {
    console.log(e);
  }
};
const addPeerToRoom = async (
  roomId: string,
  enableSimulcast: boolean = true,
) => {
  const { addPeer } = RoomApiFp(config);
  const addPeerRequest: AddPeerRequest = {
    type: 'webrtc',
    options: { enableSimulcast },
  };
  const addPeerFunction = await addPeer(roomId, addPeerRequest);
  try {
    const response = await addPeerFunction();
    return response.data.data;
  } catch (e) {
    console.log(e);
  }
};

let peerDetails: PeerDetailsResponseData | undefined;
let room: Room | undefined;

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
      await typeToInput(
        driver,
        '~' + TOKEN_INPUT,
        'SFMyNTY.g2gDdAAAAAJkAAdwZWVyX2lkbQAAACQwZjYwYmE5Ny0zOWY1LTQxZTktYjgwMC1iZGU3NjJjOTc3ZTBkAAdyb29tX2lkbQAAAAE5bgYADH9jQ5IBYgABUYA.RLquiU0W34ROD8nOW38m_8v18kTC8EJcUxNKnyEvrTg',
      );
      await typeToInput(driver, '~' + URL_INPUT, webSocketUrl);
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
      await driver.pause(1000);
      await tapButton(driver, '~' + TOGGLE_MICROPHONE_BUTTON_PREVIEW);
      await driver.pause(1000);
      await tapButton(driver, '~' + TOGGLE_CAMERA_BUTTON_PREVIEW);
      await driver.pause(1000);
      await tapButton(driver, '~' + JOIN_BUTTON);
      await driver.pause(1000);
      if (driver.isIOS) {
        try {
          await driver.acceptAlert();
          await driver.pause(1000);
          await tapButton(driver, '~' + JOIN_BUTTON);
          await driver.pause(1000);
        } catch (e) {
          console.log('Alert could not be accepted');
        }
      }
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
    skip: false,
  },
  {
    name: 'check if two video cells',
    run: async () => {
      await getElement(driver, '~' + VIDEO_CELL + 0);
      await getElement(driver, '~' + VIDEO_CELL + 1);
      await getElement(driver, '~' + VIDEO_CELL + 3, true);
    },
    skip: false,
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
    skip: false,
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
    skip: false,
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
