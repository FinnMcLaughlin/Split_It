'use strict'

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View, Button} from 'react-native';
import firebase from '@firebase/app';


export default class Display extends Component<Props>{
    static NavigationOptions = {
        title: 'Display',
      };

      constructor(props){
        super(props);
      }

        

    

        render(){      
        console.log(this.props.navigation.state.params)

        return(
        <View>
            <Text>The Results</Text>
        </View>
        )
    }
}

AppRegistry.registerComponent('Display', () => Display);
