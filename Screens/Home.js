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
import {AppRegistry, Platform, StyleSheet, Text, View, Button, TextInput, TouchableOpacity, Image} from 'react-native';
import firebase from '@firebase/app';
import '@firebase/auth';
import Database from './Database';

type Props = {};

export default class Home extends Component<Props>{
    static NavigationOptions = {
        title: 'Home',
      };

    constructor(props){
        super(props);

        this.state = {
            userAuthenticated: false,
            userDisplayName: "",
            joiningBill: false,
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
        firebase.auth().onAuthStateChanged(user => {(user ? this.setState({ userAuthenticated: true, userDisplayName: this.DB._getCurrentUserDisplayName()}) : this.props.navigation.navigate("Login"))});
        ///firebase.auth().onAuthStateChanged(user => {this.props.navigation.navigate(user ? "Results" : "Login")});
    }
  
    //--3
    _renderHomeScreen(){
        if(!this.state.joiningBill){
            return(
            <View style={styles.searchInput}>
                <Text>Welcome {this.state.userDisplayName}</Text>
                <View style={styles.button_view}>
                    <Image style={styles.logoStyle} source={require('../Resources/Logo.png')}/>
                    <Button title='Host Bill'
                        onPress={() => {this.props.navigation.navigate("Camera"), console.log("Preparing to Host Bill")}}/>
                </View>
                <View style={styles.button_view}>
                    <Button title='Join Bill' 
                        onPress={() => {this.setState({joiningBill: true}), console.log("Preparing to Join Bill")}}/>
                </View>
                <View style={styles.sign_out_view}>
                    <Button title='Sign Out' 
                        onPress={() => {this.DB._signOutUser(), console.log("Preparing to Sign Out User")}}/>
                </View>
            </View>
            );
        }
        else{
            return(
                <View style={styles.joinBillViewStyle}>
                    <Text style={{fontSize:40}}>Joining Bill</Text>
                    <TextInput style={styles.textInputBox} value={this.state.joinBillID}
                        onChangeText={(billID) => this.setState({joinBillID: billID})}/>
                    <Text style={{color: "red"}}>{this.state.joinBillID_Error}</Text>
                    <TouchableOpacity onPress={() => {this._billIDCheck(this.state.joinBillID.toUpperCase().trim()) ? console.log("Length Correct") : this.setState({joinBillID_Error: "Bill ID must be 4 characters long"})}}> 
                        <Text style={{fontSize:20}}>Join</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {this.setState({joiningBill: false, joinBillID: "", joinBillID_Error: ""})}}>
                        <Text style={{fontSize:20}}>Return</Text>
                    </TouchableOpacity>
                </View>
            );
        }
    }

    render(){       
        return(!this.state.userAuthenticated ?
            <View>
                <Text>Authenticating User...</Text>
            </View>
            :
            <View>
                {this._renderHomeScreen()}
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
    },
    textInputBox: {
        height: 40,
        width: 250,
        padding: 5,
        borderWidth: 1,
        borderColor: 'blue',
    },
    joinBillViewStyle: {
        justifyContent: "space-between",
        marginTop: 200,
        alignItems: "center"
    },
    joinBillButtonStyle:{
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-around"
    },
    logoStyle: {
       marginLeft: 25
    }
});

AppRegistry.registerComponent('Home', () => Home);