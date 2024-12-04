import type { Capabilities } from '@wdio/types';

const TIMEOUT = 3000;
const INTERVAL = 1000;

const getAndroidDeviceCapabilities = (
  name: string,
): Capabilities.RemoteCapability => ({
  'platformName': 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': name,
  'appium:autoGrantPermissions': true,
  'appium:app': process.env.ANDROID_APP_PATH,
  'appium:newCommandTimeout': TIMEOUT,
  'appium:fullReset': true,
});

const getIosDeviceCapabilities = (
  id: string,
  teamId?: string,
): Capabilities.RemoteCapability => ({
  'platformName': 'iOS',
  'appium:automationName': 'XCUITest',
  'appium:udid': id,
  'appium:app': process.env.IOS_APP_PATH,
  'appium:newCommandTimeout': TIMEOUT,
  'appium:xcodeOrgId': teamId,
  'appium:xcodeSigningId': 'iPhone Developer',
  'appium:fullReset': true,
});

const getCapabilityIfDeviceAvailable = (
  deviceName: string | undefined,
  capabilityGetter: (device: string) => Capabilities.RemoteCapability,
): Capabilities.RemoteCapability | undefined =>
  deviceName ? capabilityGetter(deviceName) : undefined;

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

export { TIMEOUT, INTERVAL, capabilities };
