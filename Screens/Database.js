'use strict' 

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View} from 'react-native';
import Home from './Home';
import firebase from '@firebase/app';
import '@firebase/auth';

var config = {
    
};

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
    
    _RegisterUser(email, password, name, paypal_email, context){
        let nav = context;

        firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(() => {
            //firebase.auth().currentUser.updateProfile({displayName: name});
            const uid = firebase.auth().currentUser.uid;
            var _table = "Users/" + uid;
            
            firebase.database().ref(_table).set({
                account_email: email,
                name: name,
                paypal_email: paypal_email
            }).then(() => {
                console.log("User Registered");
                nav.navigate("Login");
            });        
        });
    }

    // _DisplayFromDatabase(table, uid, props){
    //     const _table = table + "/" + uid;

    //     console.log("Display From Database ----")        

    //     firebase.database().ref(_table).once('value', function(values){
    //         props.navigation.navigate("Display", {data: values.val()})
    //     });
    // }

    // _GetTextResult(roomID){
    //     const _path = "Rooms/" + roomID + "/data/TextDetections";
    //     firebase.database().ref(_path).once('value', function(values){
    //         console.log("Path: ", _path);
    //         console.log("Values: ", values.val());
    //         return values.val();
    //     })
    // }

    // _UpdateDatabase(table, id, key, value){
    //     const _table = table + "/" + id;
        
    //     firebase.database().ref(_table).update({
    //        Value: value
    //     });
    // }

    _findBillID(billID){
        console.log("Checking");
        return firebase.database().ref(`Rooms/${billID}/content`).once("value");
    }

    _billIDGen(navigate, data, hostID){
        const ID_chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var ID = "";
        var idLength = 4;        

        do{
            var randIndex = Math.floor(Math.random() * (ID_chars.length));
            ID = ID + ID_chars.charAt(randIndex);
            console.log("Room ID: " + ID);
        }
        while(ID.length < idLength);

        console.log("New Room: " + ID);

        this._findBillID(ID.toUpperCase()).then((snapshot) => {
            if(snapshot.val() == null){
                console.log("Unique ID: " + ID);
                this._createNewRoom(ID, data).then(() => {
                    console.log("Room Created");
                    navigate.navigate("Register");
                });
            }
            else{
                console.log("Not Unqiue, regenerate ID")
                this._billIDGen();
            }
        });
    }

    _createNewRoom(billID, data){
        return firebase.database().ref(`Rooms/${billID}`).set({
            content: data
        }).then(() => {
                firebase.database().ref(`Rooms/${billID}/host`).set({
                hostID: firebase.auth().currentUser.uid
            });
        });
    }

    _getCurrentUserDisplayName(){
        var userID = firebase.auth().currentUser.uid;
        const _table = "Users/" + userID;
        var userDisplayName = firebase.auth().currentUser.displayName;
        //Set Authentication display name if one has not been set already
        //Return current user display name
        if(userDisplayName == null){
            firebase.database().ref(_table).on('value', function(snapshot){
                firebase.auth().currentUser.updateProfile({displayName: snapshot.val().name});
            });

            userDisplayName = firebase.auth().currentUser.displayName;
            return userDisplayName;
        }
        else{
            return userDisplayName;
        }   
    }

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
    }

    _initUserBillData(billID, userID){
        const _table = "Rooms/" + billID + "/users/" + userID;

        firebase.database().ref(_table).set({
            finishedChoosing: false,
            finishedPaying: false
        });
    }

    _updateUserBillData(billID, userID, info, value){
        const _table = "Rooms/" + billID + "/users/" + userID;

        firebase.database().ref(_table).update({
            [info]: value 
        });
    }

    _initHostData(){
        //Initialize
    }

    _getHostPaypalAccount(billID, userID, info, value){
        const host_path = "Rooms/" + billID + "/host";
        const user_path = "Users";
        let dis = this;
        
        firebase.database().ref(user_path).once('value', function(snapshot){
            
            Object.keys(snapshot.val()).forEach(user =>{
                if(user == userID){
                    dis.state.hostPayPal = snapshot.val()[user].paypal_email;
                }
            });
        }).then(() => {
            firebase.database().ref(host_path).update({
                hostPayPalEmail: dis.state.hostPayPal
            });
        });
    }

    _setTotalPrice(id, billTotal){
        //Set initial remaining price calculated using generated item list prices
        const _table = "Rooms/" + id + "/priceValues/billTotal";
        
        firebase.database().ref(_table).set({
            value: billTotal.toFixed(2)
        });
    }

    _setCaclulateTotalPrice(id, calculatedTotal){
        //Set initial remaining price calculated using generated item list prices
        const _table = "Rooms/" + id + "/priceValues/calculatedTotal";
        
        firebase.database().ref(_table).set({
            value: calculatedTotal.toFixed(2)
        });
    }

    _setRemainingTotal(id, remainingTotal){
        //Set initial remaining price calculated using generated item list prices
        const _table = "Rooms/" + id + "/priceValues/remainingBillPrice";
        var val = remainingTotal.toFixed(2)
        
        firebase.database().ref(_table).set({
            value: val
        });
    }

    _updateRemainingTotal(id, items){
        const _table = "Rooms/" + id + "/priceValues/calculatedTotal";
        let newRemainingBillPrice = 0;
        let chosenItemsTotalPrice = 0;
        let dis = this;

        firebase.database().ref(_table).once('value', function(snapshot){
            var currentRemainingPrice = snapshot.val().value;

            for(var itemIndex=0; itemIndex < items.length; itemIndex++){
                var chosenByInfo = items[itemIndex].data.chosenBy;
                var itemPrice = items[itemIndex].data.price
        
                if(chosenByInfo[0] != ""){
                    chosenItemsTotalPrice = chosenItemsTotalPrice + parseFloat(itemPrice);
                    //console.log("Index: " + itemIndex + " " + chosenByInfo);
                }
            }
            
            newRemainingBillPrice = parseFloat(currentRemainingPrice) - chosenItemsTotalPrice;
            console.log("New Price: " + newRemainingBillPrice.toFixed(2));
            console.log(" ");
    
            dis._setRemainingTotal(id, newRemainingBillPrice);
        });
    }

    _UserChooseItem(id, itemIndex, uid){
        const _table = "Rooms/" + id + "/content/" + itemIndex + "/data";
        var existingData = [];
        //Pull array of UIDs who have chosen the item at itemIndex
        firebase.database().ref(_table + "/chosenBy").on('value', function(snapshot){
            existingData = snapshot.val();     
        });

        //If current user is not in the existing array of UIDs, begin adding them to the array
        if(!existingData.includes(uid)){
            //Check if the array consists of an empty string i.e. no current users
            //If so then put their UID in position 0
            if(existingData == ""){
                existingData = [`${uid}`]
            }
            //If not then push UID to the next position in the array
            else{
                existingData.push(uid);
            }                
            //Update the database array    
            firebase.database().ref(_table).update({
                chosenBy: existingData
            });
        }
        //If current user is already in existing array of UIDs, begin removing them from the array 
        else if(existingData.includes(uid)){
            //If their are more UIDs in the array
            if(existingData.length > 1){
                //Check if the user being removed is in the first position of the array
                //If so then move the user who is last psoition in the array to the first position
                if(existingData.indexOf(uid) == 0){
                    existingData[0] = existingData[length-1];
                    existingData.splice(length-1, 1);
                }
                //If not then just remove the user from their current position
                else{
                    existingData.splice(existingData.indexOf(uid), 1);
                }
            }
            //If there are no other users in the array, replace the current user with an empty string
            else{
                existingData[existingData.indexOf(uid)] = "";
            }
            //Update the database array    
            firebase.database().ref(_table).update({
                chosenBy: existingData
            })
        }
    }

    _updateItemInfo(id, itemIndex, attribute, data){
        var _table = "Rooms/" + id + "/content/" + itemIndex + "/"
        console.log("Data: " + data)
        if(attribute == "price"){
            _table = _table + "data/"
        }
        
        firebase.database().ref(_table).update({
            [attribute]: data
        });
    }
}

AppRegistry.registerComponent('Database', () => Database);