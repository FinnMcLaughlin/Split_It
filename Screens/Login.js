'use strict';

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View, Button, TouchableOpacity, TextInput, Image, KeyboardAvoidingView} from 'react-native';
import {createStackNavigation} from 'react-navigation';
import firebase from 'firebase';


type Props = {};

export default class Login extends Component{
    static navigationOptions = {
        headerStyle: {
            backgroundColor: 'rgb(221, 193, 54)',
        }
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
        .then( () => {this.props.navigation.navigate("Home"), console.log("Successfully logged in ", email)})
        .catch( () => {this.props.navigation.navigate("Login"), console.log("Unable to sign in")})
    }
  

    render(){
        return(
            <KeyboardAvoidingView style={styles.view_style} behavior='position' enabled>

                <View>
                    <Image style={styles.logo_style} source={require('../Resources/Logo_Orange.png')}/>
                </View>

                <View style={styles.textInput_style}>
                    <TextInput style={styles.textInputBox} onFocus={() => this.setState({email: ""})}
                        onChangeText = {(email) => this.setState({email})} value={this.state.email}/>
                </View>
                <View style={styles.textInput_style}>
                    <TextInput style={styles.textInputBox}  onFocus={() => this.setState({password: ""})}
                        onChangeText = {(password) => this.setState({password: password})} value={this.state.password}/>
                </View>                    
                    
                <View style={styles.button_view}>
                    <TouchableOpacity onPress={() => {this._LoginUser(this.state.email.trim(), this.state.password.trim())}}>
                        <Text style={styles.button_style}>Login</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.button_view}>
                    <TouchableOpacity onPress={() => {this.props.navigation.navigate("Register", {err_message: null})}}>
                        <Text style={styles.button_style}>Register</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            
        )
    }
}

const styles = StyleSheet.create({
    view_style: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: 'rgb(80, 120, 192)'
    },
    textInput_style: {
        marginBottom: 15,
        alignItems: 'center'
    },
    textInputBox: {
        height: 40,
        width: 250,
        borderWidth: 3,
        borderColor: 'rgb(221, 193, 54)',
        paddingLeft: 10,
        color: 'rgb(251, 113, 5)',
        fontFamily: 'Rocco',
        fontSize: 20
    },
    button_view: {
        marginTop: 15,
        alignItems: 'center'
    },
    button_style: {
        fontSize: 25,
        fontFamily: 'Rocco',
        color: 'rgb(251, 113, 5)'
    },
    logo_style: {
       alignItems: 'center'
    }
});

AppRegistry.registerComponent('Login', () => Login);