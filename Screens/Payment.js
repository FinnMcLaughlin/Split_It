'use strict';

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View, Button, 
    TextInput, WebView, Modal} from 'react-native';
import firebase from '@firebase/app';

type Props = {};

export default class Payment extends Component<Props>{
    static NavigationOptions = {
        title: 'Payment',
      };

    constructor(props){
        super(props);
    }

    render(){       
        return(
            <View style={styles.modalView}>
                <View style={ styles.modalView }>
                    <WebView
                        source={{uri: 'http://147.252.138.118:3005/', body: '{"amount": "5.99"}'}}
                        
                        onNavigationStateChange = {data => {                          
                            console.log(data)
                            if(data.url.includes("/success")){
                                   this.props.navigation.navigate("Home");
                               }
                            }                          
                        }
                        
                        //injectedJavaScript={`document.index.submit()`}
                    />
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    modalView: {
        margin: 10,
        width: 300,
        height: 400
    }
});

AppRegistry.registerComponent('Payment', () => Payment);