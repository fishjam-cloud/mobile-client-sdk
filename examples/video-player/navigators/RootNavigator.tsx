import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import VideoPlayerScreen from "../screens/VideoPlayerScreen";

export type AppRootStackParamList = {
  VideoPlayer: undefined;
};

const Stack = createNativeStackNavigator<AppRootStackParamList>();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="VideoPlayer"
        component={VideoPlayerScreen}
        options={{
          orientation: "portrait",
          navigationBarHidden: true,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
