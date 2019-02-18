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

        this.state = {
            initial_check: false,
            data: "",
            D: 12
        };

        let dis = this;
        firebase.database().ref("Rooms/A001").on('value', function(snapshot){
            dis.setState({
                data: snapshot.val().content, 
            });

            console.log("Updated", snapshot.val().content);
        });
    }

    

        render(){
        if(!this.state.initial_check){
            this.state.data = this.props.navigation.getParam("data", "dataless");
            this.state.initial_check = true;    
        }

        var TotalPrice = (parseFloat(this.state.data.Pizza.Value) + parseFloat(this.state.data.Soda.Value)).toFixed(2);
       
        return(
        <View>
            <Text>The Results</Text>
            <Text>Pizza: { JSON.stringify(this.state.data.Pizza.Value) }</Text> 
            <Text>Soda: { JSON.stringify(this.state.data.Soda.Value) }</Text> 
            <Text>Total: { TotalPrice }</Text>
        </View>
        )
    }
}

AppRegistry.registerComponent('Display', () => Display);
