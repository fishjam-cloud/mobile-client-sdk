import type { Capabilities } from '@wdio/types';
import * as assert from 'assert';

const TIMEOUT = 3000;
const INTERVAL = 1000;

type TimeoutConfig = {
  timeout: number;
  timeoutMsg: string;
  interval: number;
};

const findTimeoutConfig = (selector: string): TimeoutConfig => {
  return {
    timeout: TIMEOUT,
    timeoutMsg: `Element with selector ${selector} not found within the specified time`,
    interval: INTERVAL,
  };
};

const getElement = async (
  driver: WebdriverIO.Browser,
  selector: string,
  reverse: boolean = false,
  timeout: TimeoutConfig = findTimeoutConfig(selector),
) => {
  const element = await driver.$(selector);
  await element.waitForExist({ ...timeout, reverse });
  return element;
};

const typeToInput = async (
  driver: WebdriverIO.Browser,
  selector: string,
  text: string,
) => {
  const input = await getElement(driver, selector);
  await input.setValue(text);
};

const compareInputValue = async (
  driver: WebdriverIO.Browser,
  selector: string,
  expectedValue: string | undefined,
) => {
  assert.equal(await getInputValue(driver, selector), expectedValue);
};

const getInputValue = async (driver: WebdriverIO.Browser, selector: string) => {
  const element = await getElement(driver, selector);
  return await element.getText();
};

const tapButton = async (driver: WebdriverIO.Browser, selector: string) => {
  const button = await getElement(driver, selector);
  await button.click();
};

const tapApp = async (driver: WebdriverIO.Browser) => {
  const x = 100;
  const y = driver.isIOS ? 100 : 300;
  await driver.actions([
    driver.action('pointer').move(x, y).down().pause(200).up(),
  ]);
};

const swipeDown = async (driver: WebdriverIO.Browser, selector: string) => {
  const element = await getElement(driver, selector);

  await driver.executeScript('mobile: swipeGesture', [
    {
      elementId: element.elementId,
      direction: 'down',
      percent: 1.0,
    },
  ]);
};

const getWebsocketUrl = (host: string, secure: boolean = false) =>
  `${secure ? 'wss' : 'ws'}://${host}`;

const getHttpUrl = (host: string, secure: boolean = false) =>
  `${secure ? 'https' : 'http'}://${host}`;

const getAndroidDeviceCapabilities = (
  name: string,
): Capabilities.RemoteCapability => {
  return {
    'platformName': 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': name,
    'appium:autoGrantPermissions': true,
    'appium:app': process.env.ANDROID_APP_PATH,
    'appium:newCommandTimeout': TIMEOUT,
    'appium:fullReset': false,
    'appium:noReset': true,
  };
};

const getIosDeviceCapabilities = (
  id: string,
  teamId?: string,
): Capabilities.RemoteCapability => {
  return {
    'platformName': 'iOS',
    'appium:automationName': 'XCUITest',
    'appium:udid': id,
    'appium:app': process.env.IOS_APP_PATH,
    'appium:newCommandTimeout': TIMEOUT,
    'appium:xcodeOrgId': teamId,
    'appium:xcodeSigningId': 'App Developer',
    'appium:fullReset': true,
  };
};

const getCapabilityIfDeviceAvailable = (
  deviceName: string | undefined,
  capabilityGetter: (deviceName: string) => Capabilities.RemoteCapability,
): Capabilities.RemoteCapability | undefined => {
  return deviceName ? capabilityGetter(deviceName) : undefined;
};

const androidDeviceName = process.env.ANDROID_DEVICE_NAME;
const iosDeviceId = process.env.IOS_DEVICE_ID;
const teamId = process.env.IOS_TEAM_ID;

const capabilities: Capabilities.RemoteCapabilities = [
  getCapabilityIfDeviceAvailable(
    androidDeviceName,
    getAndroidDeviceCapabilities,
  ),
  getCapabilityIfDeviceAvailable(iosDeviceId, (id) =>
    getIosDeviceCapabilities(id, teamId),
  ),
].filter((object) => object !== undefined) as Capabilities.RemoteCapabilities;

export {
  tapApp,
  typeToInput,
  tapButton,
  swipeDown,
  getElement,
  getInputValue,
  compareInputValue,
  findTimeoutConfig,
  getWebsocketUrl,
  getHttpUrl,
  capabilities,
};
