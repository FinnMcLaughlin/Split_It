'use strict';

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View, Button, TextInput} from 'react-native';
import {createStackNavigation} from 'react-navigation';
import Database from './Database';
import firebase from 'firebase';

type Props = {};

export default class Register extends Component{
    static NavigationOptions = {
        title: 'Register',
      };
    
    constructor(props){
        super(props);

        this.state = {
            name: "NAME",
            email: "EMAIL",
            password: "PASSWORD"
        };

        this.DB = new Database();
    }

    _newUser(email, password, name){
        this.DB._RegisterUser(email, password, name);
    }

    render(){
        return(
            <View style={styles.view_style}>
            <TextInput style={styles.textInputBox} onFocus={() => this.setState({name: ""})}
            onChangeText = {(name) => this.setState({name})} value= {this.state.name}/>
            <TextInput style={styles.textInputBox} onFocus={() => this.setState({email: ""})}
            onChangeText = {(email) => this.setState({email})} value={this.state.email}/>
            <TextInput style={styles.textInputBox} onFocus={() => this.setState({password: ""})}
            onChangeText = {(password) => this.setState({password})} value={this.state.password}/>
            <Button styles={styles.button_style} title='Go' 
            onPress={() => {this._newUser(this.state.email, this.state.password, this.state.name)}}/>
           </View>
        );
    }
}

const styles = StyleSheet.create({
    view_style:{
        height: 200,
        width: 300,
        marginTop: 80,
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
        height: 30
    },
});

AppRegistry.registerComponent('Register', () => Register);