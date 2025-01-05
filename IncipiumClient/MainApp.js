import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importing screens
import HomeScreen from './screens/HomeScreen';  
import RecordMemoScreen from './screens/RecordMemoScreen';  
import TranscriptionScreen from './screens/TranscriptionScreen';  
import DashboardScreen from './screens/DashboardScreen'; 
import HelpScreen from './screens/HelpScreen'; 

const Stack = createStackNavigator();

function MainApp() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          cardStyle: { backgroundColor: '#FFFFFF' }, // Background color for all screens
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="RecordMemo" component={RecordMemoScreen} />
        <Stack.Screen name="Sentiment" component={TranscriptionScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default MainApp;
