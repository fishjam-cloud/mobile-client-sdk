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

const { OUTPUT_DEVICE_BOTTOM_SHEET } = soundOutputDevicesLabels;

// TODO: Remove after fixing: https://linear.app/swmansion/issue/FCE-504/fix-e2e-test-on-ios-related-to-showing-camera-view-when-camera-is
const SKIP_IOS_TODO = driver.isIOS;

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
const addParticipantToRoom = async (
  roomId: string,
  enableSimulcast: boolean = true,
) => {
  const { addPeer: addParticipant } = RoomApiFp(config);
  const addParticipantRequest: AddPeerRequest = {
    type: 'webrtc',
    options: { enableSimulcast },
  };
  const addParticipantFunction = await addParticipant(
    roomId,
    addParticipantRequest,
  );
  try {
    const response = await addParticipantFunction();
    return response.data.data;
  } catch (e) {
    console.log(e);
  }
};

let participantDetail: PeerDetailsResponseData | undefined;
let room: Room | undefined;

const tests: Test[] = [
  {
    name: 'create room and participant to obtain credentials',
    run: async () => {
      room = await createFishjamRoom();
      assert.ok(room !== undefined);
      participantDetail = await addParticipantToRoom(room.id);
      assert.ok(participantDetail !== undefined);
    },
    skip: false,
  },
  {
    name: 'type fishjam url and token',
    run: async () => {
      assert.ok(participantDetail !== undefined);
      const webSocketUrl = getWebsocketUrl(
        process.env.FISHJAM_HOST_MOBILE as string,
      );
      await tapButton(driver, '~' + TOKEN_TAB);
      await typeToInput(driver, '~' + TOKEN_INPUT, participantDetail.token);
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
        await swipeDown(driver, '~' + OUTPUT_DEVICE_BOTTOM_SHEET);
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
