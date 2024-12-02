import { INTERVAL, TIMEOUT } from '../configuration';
type TimeoutConfig = {
  timeout: number;
  timeoutMsg: string;
  interval: number;
};

const findTimeoutConfig = (selector: string): TimeoutConfig => ({
  timeout: TIMEOUT,
  timeoutMsg: `Element with selector ${selector} not found within the specified time`,
  interval: INTERVAL,
});

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

export {
  tapApp,
  typeToInput,
  tapButton,
  swipeDown,
  getElement,
  findTimeoutConfig,
};
