'use strict';

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View, Button, TextInput} from 'react-native';
import {createStackNavigation} from 'react-navigation';
import firebase from 'firebase';

type Props = {};

export default class Login extends Component{
    static NavigationOptions = {
        title: 'Login',
      };
  
      constructor(props){
        super(props);

        this.state = {
            email: "EMAIL",
            password: "PASSWORD"
        };
    }

    _LoginUser(email, password)
    {
        firebase.auth().signInWithEmailAndPassword(email, password)
        .then( () => {this.props.navigation.navigate("Home"), console.log("Success ", email)})
        .catch( () => {this.props.navigation.navigate("Login"), console.log("Unable to sign in")})
    }
  

    render(){
        return(
            <View style={styles.view_style}>
                <TextInput style={styles.textInputBox}
                onChangeText = {(email) => this.setState({email})} value={this.state.email}/>
                <TextInput style={styles.textInputBox}
                onChangeText = {(password) => this.setState({password})} value={this.state.password}/>
                <View style={styles.button_style}>
                    <Button styles={styles.button_style} title='Login' 
                    onPress={() => {this._LoginUser("finnmclaughlin2@gmail.com", "DimiDink2")}}/>
                </View>
                <View style={styles.button_style}>
                    <Button styles={styles.button_style} title='Register' 
                    onPress={() => {this.props.navigation.navigate("Register")}}/>
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    view_style:{
        height: 200,
        width: 300,
        marginTop: 200,
        marginLeft: 40
    },
    textInputBox: {
        height: 40,
        width: 250,
        padding: 10,
        marginTop: 35,
        marginLeft: 15,
        borderWidth: 1,
        borderColor: 'blue',
    },
    button_style: {
        marginTop: 15
    },
});

AppRegistry.registerComponent('Login', () => Login);