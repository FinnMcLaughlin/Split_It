/*
Home screen of the Split It Application. Once the user has successfully logged in, they can
either host a new bill or join an existing bill, by pushing the respective buttons.

--1 When a user attempts to join an existing bill the bill id must be checked. This function checks
    that the bill is the correct length, and whether the bill id exists in the database. If so, the
    application navigates to the results page, passing the bill ID.

--2 Checks to see if the user is logged in using firebases authorization check. If the user is logged
    in already, the rendered page changes to the standard home screen, and the user's name is displayed
    at the top of the page. If the user is not logged in then they are rerouted to the login page.

--3 If the user has successfully logged in, the home page is rendered. If the user is not currently attempting
    to join an exisitng bill, then the standard home page is rendered, featuring the welcome message, application
    logo, a button to host and a button to join a bill, and the sign out button. 
    If the user is joining a bill, then the join screen is rendered, which features a text input and two touchable
    texts, allowing the user to join a specific bill (if the specified bill id exists), or to return to the home screen
    rendering
*/


'use strict';

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View, Button, TextInput, TouchableOpacity, Image, ActivityIndicator} from 'react-native';
import firebase from '@firebase/app';
import '@firebase/auth';
import Database from './Database';

type Props = {};

export default class Home extends Component<Props>{
    static navigationOptions = {
        headerStyle: {
            backgroundColor: 'rgb(221, 193, 54)',
        }
    };

    constructor(props){
        super(props);

        this.state = {
            userAuthenticated: false,
            userDisplayName: "",
            joiningBill: false,
            joinBillID: "",
            joinBillID_Error: "",
            billIDcheck: false
        }

        this.DB = new Database();
    }
    
    //--1
    _billIDCheck(billID){
        if(billID.length == 4){
            this.DB._findBillID(billID).then((result) => {
                if(result.val() == null){
                    this.setState({
                        joinBillID_Error: "No Bill ID Found"
                    });
                }
                else{
                    this.props.navigation.navigate("Results", {ID: billID});
                }    
            });

            return true;
        }
        else{
            return false;
        }        
    }

    //--2
    componentDidMount(){
        firebase.auth().onAuthStateChanged(user => {(user ? this.setState({ userAuthenticated: true }) : this.props.navigation.navigate("Login"))});        
        //firebase.auth().onAuthStateChanged(user => {this.props.navigation.navigate(user ? "Payment" : "Login")});
    }
  
    //--3
    _renderHomeScreen(){
        if(!this.state.joiningBill){
            console.log(this.state.userDisplayName)
            return(
            <View>
                <View style={styles.home_style}>
                    <Image style={styles.logoStyle} source={require('../Resources/Logo_Orange.png')}/>
                    
                    <TouchableOpacity onPress={() => {this.props.navigation.navigate("Camera"), console.log("Preparing to Host Bill")}}>
                        <Text style={styles.button_style}>Host Bill</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.button_view}>

                <TouchableOpacity onPress={() => {this.setState({joiningBill: true}), console.log("Preparing to Join Bill")}}>
                    <Text style={styles.button_style}>Join Bill</Text>
                </TouchableOpacity>
            
                </View>
                
                <View style={styles.sign_out_view}>
                    <TouchableOpacity onPress={() => {this.DB._signOutUser(), console.log("Preparing to Sign Out User")}}>
                        <Text style={styles.button_style}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
            );
        }
        else{
            return(
                <View style={styles.joinBillViewStyle}>

                    <Text style={styles.header_style}>Join Bill</Text>

                    <TextInput style={styles.textInputBox} value={this.state.joinBillID}
                        onChangeText={(billID) => this.setState({joinBillID: billID})}/>

                    <Text style={styles.err_message}>{this.state.joinBillID_Error}</Text>

                    <TouchableOpacity onPress={() => {this._billIDCheck(this.state.joinBillID.length > 0 && this.state.joinBillID.toUpperCase().trim()) ? console.log("Length Correct") : this.setState({joinBillID_Error: "Bill ID must be 4 characters long"})}}> 
                        <Text style={styles.button_style}>Join</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => {this.setState({joiningBill: false, joinBillID: "", joinBillID_Error: ""})}}>
                        <Text style={styles.button_style}>Return</Text>
                    </TouchableOpacity>

                </View>
            );
        }
    }

    render(){       
        return(!this.state.userAuthenticated ?
            <View style={styles.authentication_view}>
                <Text style={styles.authentication_style}>Authenticating User...</Text>
                <ActivityIndicator size='large' color='rgb(221, 193, 54)'/>
            </View>
            :
            <View style={styles.home_view}>
                {this._renderHomeScreen()}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    authentication_view: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgb(80, 120, 192)'
        
    },
    authentication_style: {
        fontSize: 30,
        fontFamily: 'Rocco',
        color: 'rgb(251, 113, 5)'
    },
    
    
    home_view: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: 'rgb(80, 120, 192)',
    },
    home_style: {
        marginTop: 50,
        alignItems: 'center',
    },
    searchInput: {
        flexGrow: 1,
        backgroundColor: 'rgb(58, 102, 185)',
    },
    header: {
        fontSize: 35,
        fontFamily: 'Rocco',
        color: 'rgb(251, 113, 5)',
    },
    button_view: {
        marginTop: 15,
        alignItems: 'center',
    },
    button_style: {
        fontSize: 25,
        fontFamily: 'Rocco',
        color: 'rgb(251, 113, 5)'
    },
    sign_out_view: {
        marginTop: 35,
        alignItems: 'center'
    },
    
    
    joinBillViewStyle: {
        justifyContent: "space-between",
        marginTop: 200,
        alignItems: "center"
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
    header_style: {
        fontSize: 40,
        alignItems: "center",
        fontFamily: 'Rocco',
        color: 'rgb(251, 113, 5)',
    },
    err_message: {
        color: 'rgb(221, 50, 20)',
        fontFamily: 'Rocco',
        marginTop: 5,
        marginBottom: 5

    }
});

AppRegistry.registerComponent('Home', () => Home);