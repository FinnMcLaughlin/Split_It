import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View, Button, TextInput, Image} from 'react-native';
import firebase from '@firebase/app';
import '@firebase/auth';

export default class Loading extends Component{
    static NavigationOptions = {
        title: 'Loading',
      };

      constructor(props){
        super(props);
    }
      
    componentDidMount(){
      firebase.auth().onAuthStateChanged(user => {this.props.navigation.navigate(user ? "Home" : "Login")});
    }

    _SignOutUser(){
        const user = firebase.auth().currentUser.uid;

        firebase.auth().signOut()
        .then( () => {console.log("Log Out", user)})
        .catch( () => {console.log("Unable to sign out")})
    }

    render(){
        return(
            <Text>Loading</Text>
        )
    }
}

AppRegistry.registerComponent('Loading', () => Loading);