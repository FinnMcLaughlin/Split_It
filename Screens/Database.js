'use strict' 

import React, { Component } from 'react';
import { AppRegistry, Platform, StyleSheet } from 'react-native';
import firebase from '@firebase/app';
import '@firebase/auth';



if (!firebase.apps.length) {
    firebase.initializeApp(config);
}

type Props = {};

export default class Database extends Component<Props>{
    constructor(props)
    {
        super(props);

        this.state = {
            hostID: "",
            hostPayPal: ""
        }
    }
    
    _registerUser(email, password, name, paypal_email, context){
        let nav = context;
        firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(() => {
            firebase.auth().currentUser.updateProfile({displayName: name});
            const uid = firebase.auth().currentUser.uid;
            var _table = "Users/" + uid;
            
            firebase.database().ref(_table).set({
                account_email: email,
                name: name,
                paypal_email: paypal_email
            }).then(() => {
                console.log("User Registered");
                nav.navigate("Login");
            }).catch(() => {
                var err_message = "Error Registering User";
                console.log(err_message);
                nav.navigate("Register", err_message);
            });        
        });
    } //

    _signOutUser(){
        const userID = firebase.auth().currentUser.uid;
    
        firebase.auth().signOut()
        .then( () => {
            console.log("Signed out user", user)
        })
        .catch( () => {
            console.log("Unable to sign out")
        });
    } //

    _findBillID(billID){
        return firebase.database().ref(`Rooms/${billID}/content`).once("value");
    } //

    _billIDGen(navigate, data, hostID){
        const billID_chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var billID = "";
        var ID_Length = 4;        

        do{
            var randIndex = Math.floor(Math.random() * (billID_chars.length));
            billID=billID+ billID_chars.charAt(randIndex);
            console.log("Room ID: " + billID);
        }
        while(billID.length < ID_Length);

        this._findBillID(billID).then((result) => {
            if(result.val() == null){
                console.log(billID + " Is Unique");
                this._createNewRoom(billID, data).then(() => {
                    console.log("Room Created");
                    navigate.navigate("Results", {ID: billID});
                })
                .catch(() => {
                    var err_message = "Error Creating New Bill"
                    console.log(err_message);
                    navigate.navigate("_Error", {err_message: err_message});
                });
            }
            else{
                console.log(billID + " Is Not Unqiue, regenerate ID");
                this._billIDGen();
            }
        });
    } //

    _createNewRoom(billID, data){
        return firebase.database().ref(`Rooms/${billID}`).set({
            content: data
        }).then(() => {
                firebase.database().ref(`Rooms/${billID}/host`).set({
                hostID: firebase.auth().currentUser.uid                    
            })
        }).then(() => {
            firebase.database().ref(`Rooms/${billID}/priceValues`).set({
                billTotal: "",
                calculatedTotal: "",
                remainingTotal: ""
            })                   
        }).catch(() => {
            var err_message = "Error Storing Information into Database"
            console.log(err_message);
            navigate.navigate("_Error", {err_message: err_message});
        });
    } //

    _getCurrentUserDisplayName(){
        var userID = firebase.auth().currentUser.uid;
        const _table = `Users/${userID}`;
        var userDisplayName = firebase.auth().currentUser.displayName;
        
        //Set Authentication display name if one has not been set already
        //Return current user display name
        if(userDisplayName == null){
            firebase.database().ref(_table).on('value', function(result){
                firebase.auth().currentUser.updateProfile({displayName: result.val().name});
            }).catch(() => {
                var err_message = "Error Storing Information into Database"
                console.log(err_message);
                navigate.navigate("_Error", {err_message: err_message});
            });;

            userDisplayName = firebase.auth().currentUser.displayName;
            return userDisplayName;
        }
        else{
            return userDisplayName;
        }   
    } //

    _getSpecificUserDisplayName(userID){
        //If displayName set for specified user, return it
        const _table = "Users/" + userID;
        var displayName = "";
                
        firebase.database().ref(_table).on('value', function(snapshot){
            if(snapshot.val().name != undefined){
                displayName = snapshot.val().name;
            }
        });       
        
        return displayName;
    } //

    _initUserBillData(billID, userID){
        const _table = `Rooms/${billID}/users/${userID}`;

        firebase.database().ref(_table).set({
            finishedChoosing: false,
            finishedPaying: false
        });
    } //

    _updateUserBillData(billID, userID, info, value){
        const _table = `Rooms/${billID}/users/${userID}`;

        firebase.database().ref(_table).update({
            [info]: value 
        });
    } //

    _getHostPaypalAccount(billID, userID, info, value){
        const host_path = `Rooms/${billID}/host`;
        const user_path = "Users";
        let dis = this;
        
        firebase.database().ref(user_path).once('value', function(users){
            
            Object.keys(users.val()).forEach(user =>{
                if(user == userID){
                    dis.state.hostPayPal = users.val()[user].paypal_email;
                }
            });
        }).then(() => {
            firebase.database().ref(host_path).update({
                hostPayPalEmail: dis.state.hostPayPal
            });
        }).catch(() => {
            var err_message = "Error Getting Host Paypal Account"
            console.log(err_message);
            navigate.navigate("_Error", {err_message: err_message});
        });
    } //

    _setTotalPrice(billID, billTotal){
        //Set initial remaining price calculated using generated item list prices
        const _table = `Rooms/${billID}/priceValues/billTotal`;
        
        firebase.database().ref(_table).set({
            value: billTotal.toFixed(2)
        });
    } //

    _setCaclulateTotalPrice(billID, calculatedTotal){
        //Set initial remaining price calculated using generated item list prices
        const _table = `Rooms/${billID}/priceValues/calculatedTotal`;
        
        firebase.database().ref(_table).set({
            value: calculatedTotal.toFixed(2)
        });
    } //

    _setRemainingTotal(billID, remainingTotal){
        //Set initial remaining price calculated using generated item list prices
        const _table = `Rooms/${billID}/priceValues/remainingBillPrice`;
        
        firebase.database().ref(_table).set({
            value: remainingTotal.toFixed(2)
        });
    } //

    _updateRemainingTotal(billID, items){
        const _table = `Rooms/${billID}/priceValues/calculatedTotal`;
        let newRemainingBillPrice = 0;
        let chosenItemsTotalPrice = 0;
        let dis = this;

        firebase.database().ref(_table).once('value', function(current_calc_total){
            var currentRemainingPrice = current_calc_total.val().value;

            for(var itemIndex=0; itemIndex < items.length; itemIndex++){
                var chosenByInfo = items[itemIndex].data.chosenBy;
                var itemPrice = items[itemIndex].data.price
        
                if(chosenByInfo[0] != ""){
                    chosenItemsTotalPrice = chosenItemsTotalPrice + parseFloat(itemPrice);
                }
            }
            
            newRemainingBillPrice = parseFloat(currentRemainingPrice) - chosenItemsTotalPrice;
    
            dis._setRemainingTotal(billID, newRemainingBillPrice);
        });
    } //

    _userChooseItem(billID, itemIndex, uid){
        const _table = `Rooms/${billID}/content/${itemIndex}/data`;
        var itemChosenBy = [];

        //Pull array of UIDs who have chosen the item at itemIndex
        firebase.database().ref(`${_table}/chosenBy`).once('value', function(chosenByData){
            itemChosenBy = chosenByData.val();     
        })
        
        //If current user is not in the existing array of UIDs, begin adding them to the array
        if(!itemChosenBy.includes(uid)){
            //Check if the array consists of an empty string i.e. no current users
            //If so then put their UID in position 0
            if(itemChosenBy == ""){
                itemChosenBy = [`${uid}`]
            }
            //If not then push UID to the next position in the array
            else{
                itemChosenBy.push(uid);
            }

            //Update the database array    
            firebase.database().ref(_table).update({
                chosenBy: itemChosenBy
            });
        }
        //If current user is already in existing array of UIDs, begin removing them from the array 
        else if(itemChosenBy.includes(uid)){
            //If their are more UIDs in the array
            if(itemChosenBy.length > 1){
                //Check if the user being removed is in the first position of the array
                //If so then move the user who is last position in the array to the first position
                if(itemChosenBy.indexOf(uid) == 0){
                    itemChosenBy[0] = itemChosenBy[length-1];
                    itemChosenBy.splice(length-1, 1);
                }
                //If not then just remove the user from their current position
                else{
                    itemChosenBy.splice(itemChosenBy.indexOf(uid), 1);
                }
            }
            //If there are no other users in the array, replace the current user with an empty string
            else{
                itemChosenBy[itemChosenBy.indexOf(uid)] = "";
            }
            //Update the database array    
            firebase.database().ref(_table).update({
                chosenBy: itemChosenBy
            })
        }
    } //

    _updateItemInfo(billID, itemIndex, attribute, data){
        var _table = `Rooms/${billID}/content/${itemIndex}`

        if(attribute == "price"){
            _table = `/${_table}/data`
        }
        
        firebase.database().ref(_table).update({
            [attribute]: data
        });
    } //
}

AppRegistry.registerComponent('Database', () => Database);