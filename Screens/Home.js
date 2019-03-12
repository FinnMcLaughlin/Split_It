'use strict';

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View, Button, TextInput} from 'react-native';
import firebase from '@firebase/app';
import '@firebase/auth';
import Database from './Database';
import Loading from './Loading';

type Props = {};

export default class Home extends Component<Props>{
    static NavigationOptions = {
        title: 'Home',
      };

    constructor(props){
        super(props);

        this.state = {
            userAuthenticated: false,
            userDisplayName: ""
        }

        this.DB = new Database();
        this.Load = new Loading();
    }

    componentDidMount(){
        //firebase.auth().onAuthStateChanged(user => {(user ? this.setState({ userAuthenticated: true, userDisplayName: this.DB._getCurrentUserDisplayName()}) : this.props.navigation.navigate("Login"))});
        firebase.auth().onAuthStateChanged(user => {this.props.navigation.navigate(user ? "Results" : "Login")});
    }
  
    _SignOutUser(){
          const user = firebase.auth().currentUser.uid;
  
          firebase.auth().signOut()
          .then( () => {console.log("Log Out", user)})
          .catch( () => {console.log("Unable to sign out")})
    }

    _RoomIDGen(){
        const ID_chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var newRoomID = "";
        var idLength = 4;

        do{
            var randIndex = Math.floor(Math.random() * (ID_chars.length));
            newRoomID = newRoomID + ID_chars.charAt(randIndex);
        }
        while(newRoomID.length < idLength);

        this.DB._newRoom(newRoomID)
    }

    render(){       
        return(!this.state.userAuthenticated ?
            <View>
                <Text>Authenticating User...</Text>
            </View>
            :
            <View style={styles.searchInput}>
                <Text>Welcome {this.state.userDisplayName}</Text>
                <View style={styles.button_view}>
                <Button 
                title='Camera'
                onPress={() => {this.props.navigation.navigate("Camera"), console.log("Camera Button Pressed")}} 
                />
                </View>          
                <View style={styles.button_view}>
                    <Button title='Display From Database' 
                    onPress={() => {this.DB._DisplayFromDatabase("Rooms", "A001/content", this.props), console.log("Display Button Pressed")}}/>
                </View>
                <View style={styles.button_view}>
                    <Button title='Create New Room' 
                    onPress={() => {this._RoomIDGen(), console.log("New Room Button Pressed")}}/>
                </View>
                <View style={styles.sign_out_view}>
                    <Button title='Sign Out' 
                    onPress={() => {this.Load._SignOutUser(), console.log("Sign Out Button Pressed")}}/>
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    searchInput: {
        flexGrow: 1
    },
    button_view: {
        marginTop: 20
    },
    sign_out_view: {
        marginTop: 65
    }
});

AppRegistry.registerComponent('Home', () => Home);