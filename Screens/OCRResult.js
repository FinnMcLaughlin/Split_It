'use strict'

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View} from 'react-native';
import firebase from '@firebase/app';

export default class OCRResult extends Component<Props>{
    static NavigationOptions = {
        title: 'Results',
    };

    constructor(props){
        super(props);

        this.state = {
            data: {
                0: {
                    DetectedText: ""
                }
            }
        }

        let dis = this;
        firebase.database().ref("Rooms/T3ST/data/TextDetections").on('value', function(snapshot){
            dis.setState({
                data: snapshot.val(), 
            });

            console.log("Updated", snapshot.val().content);
        });
    }

    render(){     
        console.log("Data: ", this.state.data)
        return(
        <View>
         <Text>Results</Text> 
         <Text>{ JSON.stringify(this.state.data[0].DetectedText) }</Text> 
        </View>
        )
    }
}

AppRegistry.registerComponent('Results', () => OCRResult);
