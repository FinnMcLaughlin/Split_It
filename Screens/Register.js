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
            email: "Sign in Email",
            password: "Sign in Password",
            name: "Name",
            paypal_email: "PayPal Account Email",
            err_message: ""
        };

        this.DB = new Database();

        if(typeof this.props.navigation.state.params.err_message != undefined){
            this.state.err_message = this.props.navigation.state.params.err_message;
        }
    }

    render(){
        return(
            <View>
                <Text style={styles.headerStyle}>Register User</Text>
                <View style={styles.inputStyle}>
                    <TextInput style={styles.textInputStyle} onFocus={() => this.setState({email: ""})}
                        onChangeText = {(email) => this.setState({email})} value={this.state.email}/>
                    <TextInput style={styles.textInputStyle} onFocus={() => this.setState({password: ""})}
                        onChangeText = {(password) => this.setState({password})} value={this.state.password}/>
                    <TextInput style={styles.textInputStyle} onFocus={() => this.setState({name: ""})}
                        onChangeText = {(name) => this.setState({name})} value= {this.state.name}/>
                    <TextInput style={styles.textInputStyle} onFocus={() => this.setState({paypal_email: ""})}
                        onChangeText = {(paypal_email) => this.setState({paypal_email})} value={this.state.paypal_email}/>
                    <Text style={{color: "red"}}>{this.state.err_message}</Text>
                </View>
                <View style={styles.buttonStyle}>
                    <Button styles={styles.button_style} title='Go' 
                        onPress={() => {this.DB._registerUser(this.state.email, this.state.password, this.state.name, this.state.paypal_email, this.props.navigation)}}/>
                </View>         
            </View>
        );
    }
}

const styles = StyleSheet.create({
    headerStyle: {
        fontSize: 30,
        alignItems: "center"
    },
    inputStyle: {
        justifyContent: "space-between",
        alignItems: "center"
    },
    textInputStyle: {
        height: 40,
        width: 200,
        marginTop: 25,
        borderWidth: 1,
        borderColor: 'blue'
    },
    buttonStyle: {
        height: 30,
        marginTop: 20
    }
    // view_style:{
    //     height: 200,
    //     width: 300,
    //     marginTop: 80,
    //     marginLeft: 40
    // },
    // textInputBox: {
    //     height: 40,
    //     width: 250,
    //     padding: 10,
    //     marginTop: 35,
    //     marginLeft: 15,
    //     borderWidth: 1,
    //     borderColor: 'blue',
    // },
    // button_style: {
    //     height: 30,
    //     marginTop: 35
    // },
});

AppRegistry.registerComponent('Register', () => Register);