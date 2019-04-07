'use strict';

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View, Button, 
    TextInput, WebView, Modal} from 'react-native';
import firebase from '@firebase/app';

type Props = {};

export default class Payment extends Component<Props>{
    static navigationOptions = {
        headerStyle: {
            backgroundColor: 'rgb(221, 193, 54)',
        }
    };

    constructor(props){
        super(props);

        this.state = {
            userBillTotal: this.props.navigation.state.params.finalTotal,
            hostAccount: this.props.navigation.state.params.hostAccount
        }

        console.log("Bill Total: " + this.state.userBillTotal + " Host: " + this.state.hostAccount)
    }
//'https://splitit.localtunnel.me/'
    
    render(){       
        return(
            <View style={styles.modalView}>
                <View style={ styles.modalView }>
                    <WebView
                        source={{uri: 'http://d5532eb9.ngrok.io/', method: 'POST', body: `price=${this.state.userBillTotal}&host=${this.state.hostAccount}`}}
                        
                        onNavigationStateChange = {data => {                          
                            console.log(data)
                            if(data.url.includes("/success")){
                                   this.props.navigation.navigate("Home");
                               }
                            }                          
                        }
                        
                        injectedJavaScript={`document.index.submit()`}
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