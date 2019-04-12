import React, { Component } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createStackNavigator,} from 'react-navigation';
import Home from './Home';
import Camera from './Camera';
import OCRResult from './OCRResult';
import Database from './Database';
import Login from './Login';
import Register from './Register';
import Payment from './Payment';
import { NativeScreen } from 'react-native-screens';

console.disableYellowBox = true;

const navigate = createStackNavigator({
  Home: { screen: Home },
  Login: { screen : Login },
  Register: { screen : Register }, 
  Camera: { screen: Camera },
  Results: { screen: OCRResult},
  Payment: { screen: Payment },
  Database: { screen: Database },
});
export default navigate;