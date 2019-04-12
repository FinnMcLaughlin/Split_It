'use strict';

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View, Button, 
    TextInput, WebView, Dimensions, ToastAndroid} from 'react-native';
import firebase from '@firebase/app';
import Database from './Database';

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
            userSubTotal: this.props.navigation.state.params.subTotal,
            hostAccount: this.props.navigation.state.params.hostAccount,
            userFinalTotal: this.props.navigation.state.params.finalTotal,
            isHost: this.props.navigation.state.params.isHost,
            finishedPaying: this.props.navigation.state.params.isHost,
            everyoneFinished: false,
            remainingUsers: [],
            billID: this.props.navigation.state.params.billID,
            userID: firebase.auth().currentUser.uid,
            remaining_users: []
        }

        this.DB = new Database();

        if(this.state.isHost){
            firebase.database().ref(`Bills/${this.state.billID}/users/${this.state.userID}`).update({
                finishedPaying: true
            })
        }

        console.log("Bill Total: " + this.state.userSubTotal + " Host: " + this.state.hostAccount)        
    }

    _renderWaitingForUsers(){
        var remaining_users = this.state.remainingUsers;
        var renderString = "";
  
        for(var usersIndex = 0; usersIndex < remaining_users.length; usersIndex++){
          renderString = renderString + ", " + this.DB._getSpecificUserDisplayName(remaining_users[usersIndex]);
        }
  
        return renderString.substring(2);
  
      } //
        
    
    render(){ 
        let dis = this;
        let nav = this.props.navigation;
        let uid = this.state.userID;
        

        firebase.database().ref(`Bills/${this.state.billID}/users`).on('value', function(users){
            var values = users.val();
            var remaining_users = [];
            var no_users = 0;
            var no_finished_users = 0;

            Object.keys(values).forEach(user =>{
              
                no_users += 1;
  
                if(values[user].finishedPaying){
                  no_finished_users += 1;
                }
                else{
                  remaining_users.push(user)
                }
            });

            if(no_users == no_finished_users){
                dis.DB._deleteBill(dis.state.billID)
                ToastAndroid.show("Bill Split Finished", ToastAndroid.LONG)
                nav.navigate("Home")
                
            }

            if(!remaining_users.includes(uid)){
                dis.state.finishedPaying = true
            }

            dis.state.remainingUsers = remaining_users;
        });

        if(this.state.isHost || this.state.finishedPaying){
            return(
                <View style={styles.review_modal_view}>
                    <Text style={styles.review_text_style}>Waiting For: {this._renderWaitingForUsers()}</Text>
                    <View style={{alignItems: 'center'}}>
                    </View>
                </View>
            )
        }
        else{
            return(
                <View style={styles.view_style}>
                    <View style={styles.modalView}>
                            <WebView
                                source={{uri: 'http://fbf19f56.ngrok.io/', method: 'POST', body: `pay_price=${this.state.userFinalTotal}&payout_price=${this.state.userSubTotal}&host=${this.state.hostAccount}`}}
                                onNavigationStateChange = {data => {                          
                                        if(data.url.includes("/success")){
                                            firebase.database().ref(`Bills/${this.state.billID}/users/${this.state.userID}`).update({
                                                finishedPaying: true
                                            })
                                        }
                                    }                          
                                }
                    />
                    </View>
                </View>
            )
        }
        
    }
}

const styles = StyleSheet.create({
    view_style: {
        backgroundColor: 'rgb(58, 102, 185)'
    },
    modalView: {
        width: Dimensions.get('screen').width,
        height: Dimensions.get('screen').height,
    },
    review_modal_view: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgb(80, 120, 192)'
      },
      review_text_style: {
        fontSize: 25,
        fontFamily: 'Rocco',
        color: 'rgb(251, 113, 5)',
      },
});

AppRegistry.registerComponent('Payment', () => Payment);