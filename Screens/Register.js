'use strict';

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View, Button, TextInput, KeyboardAvoidingView, TouchableOpacity} from 'react-native';
import {createStackNavigation} from 'react-navigation';
import Database from './Database';
import firebase from 'firebase';

type Props = {};

export default class Register extends Component{
    static navigationOptions = {
        headerStyle: {
            backgroundColor: 'rgb(221, 193, 54)',
        }
    };
    
    constructor(props){
        super(props);

        this.state = {
            email: "Sign in Email",
            password: "Sign in Password",
            name: "Name",
            paypal_email: "PayPal Account Email",
            err_message: "",
            avoidKeyboard: false
        };

        this.DB = new Database();

        if(typeof this.props.navigation.state.params.err_message != undefined){
            this.state.err_message = this.props.navigation.state.params.err_message;
        }
    }

    _errorCheck(){
        if(!this.state.email.includes('@')){
            this.setState({err_message: "Invalid Email"})
        }
        else if(this.state.password.length < 6){
            this.setState({err_message: "Password's length must be at least 6"})
        }
        else if(!this.state.name.length > 0){
            this.setState({err_message: "No Name Inputted"})
        }
        else if(!this.state.paypal_email.includes('@')){
            this.setState({err_message: "Invalid PayPal Email"})
        }
        else{
            this.DB._registerUser(this.state.email.trim(), this.state.password.trim(), this.state.name.trim(), this.state.paypal_email.trim(), this.props.navigation)
        }
    }

    render(){
        return(
            <KeyboardAvoidingView style={styles.view_style} behavior='position' enabled={this.state.avoidKeyboard}>
           
                <View style={{marginBottom: 15}}>
                <Text style={styles.header_style}>Register User</Text>
                </View>

                <View style={styles.textInput_style}>
                    <TextInput style={styles.textInputBox} onFocus={() => this.setState({email: "", avoidKeyboard: false})}
                        onChangeText = {(email) => this.setState({email})} value={this.state.email}/>
                </View>
                
                <View style={styles.textInput_style}>
                    <TextInput style={styles.textInputBox} onFocus={() => this.setState({password: "", avoidKeyboard: false})}
                        onChangeText = {(password) => this.setState({password})} value={this.state.password}/>
                </View> 

                <View style={styles.textInput_style}>
                <TextInput style={styles.textInputBox} onFocus={() => this.setState({name: "", avoidKeyboard: true})}
                            onChangeText = {(name) => this.setState({name})} value= {this.state.name}/>
                </View> 

                <View style={styles.textInput_style}>
                <TextInput style={styles.textInputBox} onFocus={() => this.setState({paypal_email: "", avoidKeyboard: true})}
                            onChangeText = {(paypal_email) => this.setState({paypal_email})} value={this.state.paypal_email}/>
                </View>     

                <View style={styles.textInput_style}>
                    <Text style={styles.err_style}>{this.state.err_message}</Text>
                </View>
                            
                    
                <View style={styles.button_view}>
                <TouchableOpacity style={styles.button_style}
                    onPress={() => {this._errorCheck()}}>
                        <Text style={styles.button_style}>Register</Text>
                </TouchableOpacity>
                </View>
                
            </KeyboardAvoidingView> 
        );
    }
}


const styles = StyleSheet.create({
    header_style: {
        fontSize: 40,
        alignItems: "center",
        fontFamily: 'Rocco',
        color: 'rgb(251, 113, 5)',
        marginTop: 100
    },
    view_style: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: 'rgb(58, 102, 185)',
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
        alignItems: 'center'
    },
    button_style: {
        fontSize: 25,
        fontFamily: 'Rocco',
        color: 'rgb(251, 113, 5)'
    },
    err_style: {
        fontSize: 15,
        fontFamily: 'Rocco',
        color: 'rgb(255, 25, 25)'
    }
});

AppRegistry.registerComponent('Register', () => Register);