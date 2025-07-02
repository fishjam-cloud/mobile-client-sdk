import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import HomeScreen from '../screens/home';
import RoomScreen from '../screens/room';

export type RootStackParamList = {
  Home: undefined;
  Room: {
    userName: string;
  };
};

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

const RootStack = createNativeStackNavigator<RootStackParamList>();

const RootNavigation = () => {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen name="Room" component={RoomScreen} />
    </RootStack.Navigator>
  );
};

export default RootNavigation;
