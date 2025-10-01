import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigationProp } from '@react-navigation/native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import ConnectWithRoomManagerScreen from '../screens/ConnectWithRoomManagerScreen';
import ConnectWithVideoRoomScreen from '../screens/ConnectWithVideoRoomScreen';
import ConnectWithTokenScreen from '../screens/ConnectWithTokenScreen';
import PreviewScreen from '../screens/PreviewScreen/PreviewScreen';
import RoomScreen from '../screens/RoomScreen/RoomScreen';
import { appNavigationLabels } from '../types/ComponentLabels';
import { AdditionalColors, BrandColors } from '../utils/Colors';
import { ConnectWithFishjamRoom } from '../screens/ConnectWithFishjamRoom';
import ConnectToLivestreamScreen from '../screens/ConnectToLivestreamScreen';
import LivestreamStreamerScreen from '../screens/LivestreamScreen/LivestreamStreamerScreen';
import LivestreamViewerScreen from '../screens/LivestreamScreen/LivestreamViewerScreen';

export type AppRootStackParamList = {
  Home: undefined;
  Preview: {
    userName?: string;
    fishjamId: string;
    peerToken: string;
  };
  LivestreamViewerScreen: {
    fishjamId: string;
    roomName: string;
  };
  LivestreamStreamerScreen: {
    fishjamId: string;
    roomName: string;
  };
  Room: {
    isCameraOn: boolean;
    userName?: string;
  };
};

export type TabParamList = {
  ConnectWithToken: undefined;
  ConnectWithRoomManager: undefined;
  ConnectWithVideoRoom: undefined;
  ConnectWithFishajamRoom: undefined;
  ConnectToLivestream: undefined;
};

const tabBarIcon = (icon: keyof typeof MaterialCommunityIcons.glyphMap) => {
  const TabBarIconComponent = ({ color }: { color: string }) => (
    <MaterialCommunityIcons name={icon} size={24} color={color} />
  );
  TabBarIconComponent.displayName = `TabBarIcon(${icon})`;
  return TabBarIconComponent;
};

export type AppStackNavigation = NavigationProp<AppRootStackParamList>;

const Stack = createNativeStackNavigator<AppRootStackParamList>();

const Tab = createBottomTabNavigator<TabParamList>();

const { ROOM_MANAGER_TAB, TOKEN_TAB } = appNavigationLabels;

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}>
      <Tab.Screen
        name="ConnectWithVideoRoom"
        component={ConnectWithVideoRoomScreen}
        options={{
          tabBarLabel: 'VideoRoom',
          tabBarActiveTintColor: BrandColors.darkBlue100,
          tabBarInactiveTintColor: AdditionalColors.grey60,
          tabBarIcon: tabBarIcon('alarm-bell'),
          tabBarAccessibilityLabel: ROOM_MANAGER_TAB,
        }}
      />
      <Tab.Screen
        name="ConnectWithRoomManager"
        component={ConnectWithRoomManagerScreen}
        options={{
          tabBarLabel: 'Use Room Manager',
          tabBarActiveTintColor: BrandColors.darkBlue100,
          tabBarInactiveTintColor: AdditionalColors.grey60,
          tabBarIcon: tabBarIcon('room-service'),
          tabBarAccessibilityLabel: ROOM_MANAGER_TAB,
        }}
      />
      <Tab.Screen
        name="ConnectToLivestream"
        component={ConnectToLivestreamScreen}
        options={{
          tabBarLabel: 'Livestream',
          tabBarActiveTintColor: BrandColors.darkBlue100,
          tabBarInactiveTintColor: AdditionalColors.grey60,
          tabBarIcon: tabBarIcon('video'),
          tabBarAccessibilityLabel: 'LIVESTREAM_TAB',
        }}
      />
      <Tab.Screen
        name="ConnectWithToken"
        component={ConnectWithTokenScreen}
        options={{
          tabBarLabel: 'Use Token',
          tabBarActiveTintColor: BrandColors.darkBlue100,
          tabBarInactiveTintColor: AdditionalColors.grey60,
          tabBarIcon: tabBarIcon('ticket'),
          tabBarAccessibilityLabel: TOKEN_TAB,
        }}
      />
      <Tab.Screen
        name="ConnectWithFishajamRoom"
        component={ConnectWithFishjamRoom}
        options={{
          tabBarLabel: 'Fishjam Room',
          tabBarActiveTintColor: BrandColors.darkBlue100,
          tabBarInactiveTintColor: AdditionalColors.grey60,
          tabBarIcon: tabBarIcon('ticket'),
          tabBarAccessibilityLabel: TOKEN_TAB,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={() => ({ headerBackTitleVisible: false })}>
        <Stack.Screen
          name="Home"
          options={{ headerShown: false }}
          component={TabNavigator}
        />
        <Stack.Screen name="Preview" component={PreviewScreen} />
        <Stack.Screen
          name="LivestreamStreamerScreen"
          component={LivestreamStreamerScreen}
        />
        <Stack.Screen
          name="LivestreamViewerScreen"
          component={LivestreamViewerScreen}
        />
        <Stack.Screen
          name="Room"
          options={{
            headerBackVisible: false,
            gestureEnabled: false,
          }}
          component={RoomScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
