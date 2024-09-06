/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { LogBox } from 'react-native';
import notifee from '@notifee/react-native';

LogBox.ignoreLogs(['new NativeEventEmitter']);

notifee.registerForegroundService((notification) => {
  return new Promise(() => {});
});

AppRegistry.registerComponent(appName, () => App);
