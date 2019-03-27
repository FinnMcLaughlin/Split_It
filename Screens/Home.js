'use strict';

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View, Button, TextInput, TouchableOpacity, Image} from 'react-native';
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
            userDisplayName: "",
            joiningBill: false,
            joinBillID: "",
            joinBillIdMessage: "",
            billIDcheck: false
        }

        this.DB = new Database();
        this.Load = new Loading();
    }
    
    _billIDCheck(billID){
        if(billID.length == 4){
            this.DB._findBillID(billID).then((snapshot) => {
                if(snapshot.val() == null){
                    this.setState({
                        joinBillIdMessage: "No Bill ID Found"
                    });
                }
                else{
                    this.props.navigation.navigate("Results", billID);
                }    
            });

            return true;
        }
        else{
            return false;
        }        
    }

    componentDidMount(){
        firebase.auth().onAuthStateChanged(user => {(user ? this.setState({ userAuthenticated: true, userDisplayName: this.DB._getCurrentUserDisplayName()}) : this.props.navigation.navigate("Login"))});
        //firebase.auth().onAuthStateChanged(user => {this.props.navigation.navigate(user ? "Camera" : "Login")});
    }
  
    _SignOutUser(){
          const user = firebase.auth().currentUser.uid;
  
          firebase.auth().signOut()
          .then( () => {console.log("Log Out", user)})
          .catch( () => {console.log("Unable to sign out")})
    }

    _renderHomeScreen(){
        if(!this.state.joiningBill){
            return(
            <View style={styles.searchInput}>
                <Text>Welcome {this.state.userDisplayName}</Text>
                <View style={styles.button_view}>
                <Image style={styles.logoStyle} source={require('./FYP_Logo.png')}/>
                <Button 
                title='Host Bill'
                onPress={() => {this.props.navigation.navigate("Camera"), console.log("Camera Button Pressed")}} 
                />
                </View>
                <View style={styles.button_view}>
                    <Button title='Join Bill' 
                    onPress={() => {this.setState({joiningBill: true}), console.log("Joining Bill")}}/>
                </View>
                <View style={styles.sign_out_view}>
                    <Button title='Sign Out' 
                    onPress={() => {this.Load._SignOutUser(), console.log("Sign Out Button Pressed")}}/>
                </View>
            </View>
            );
        }
        else{
            return(
                <View style={styles.joinBillViewStyle}>
                    <TouchableOpacity onPress={() => {console.log("TESTING TESTING")}}><Text style={{fontSize:40}}>Joining Bill</Text></TouchableOpacity>
                    <TextInput style={styles.textInputBox} value={this.state.joinBillID}
                        onChangeText={(billID) => this.setState({joinBillID: billID})}/>
                    <Text style={{color: "red"}}>{this.state.joinBillIdMessage}</Text>
                    <TouchableOpacity onPress={() => {this._billIDCheck(this.state.joinBillID.toUpperCase().trim()) ? console.log("Length Correct") : this.setState({joinBillIdMessage: "Bill ID Length 4"})}}> 
                        <Text style={{fontSize:20}}>Join</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {this.setState({joiningBill: false, joinBillID: "", joinBillIdMessage: ""})}}>
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



 ////this.props.navigation.navigate("Display", this.state.joinBillID) : this.setState({joinBillIdMessage: "Bill ID Length 4"})}}>
    /*
    <View style={styles.joinBillViewStyle}>
                    <TouchableOpacity onPress={() => {console.log("TESTING TESTING")}}><Text style={{fontSize:40}}>Joining Bill</Text></TouchableOpacity>
                    <TextInput style={styles.textInputBox} value={this.state.joinBillID}
                        onChangeText={(billID) => this.state.joinBillID.length < 4 ? this.setState({joinBillID: billID}) : this.props.navigation.navigate("Results", this.state.joinBillID)}/>
                    <Text>{this.state.joinBillIdMessage}</Text>
                </View>
    */

    //<TouchableOpacity onPress={() => {this.state.joinBillID.length == 4 ? this.props.navigation.navigate("Display", this.state.joinBillID) : this.setState({joinBillIdMessage: "Bill ID Length 4"})}}><Text>JOIN</Text></TouchableOpacity>
    //<TouchableOpacity onPress={() => {this.setState({joiningBill: false})}}><Text>CANCEL</Text></TouchableOpacity>