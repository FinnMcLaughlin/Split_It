'use strict' 

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View} from 'react-native';
import firebase from '@firebase/app';
import '@firebase/auth';

var config = {
    
};

if (!firebase.apps.length) {
    firebase.initializeApp(config);
}

export default class Database extends Component<Props>{

    constructor(props)
    {
        super(props);
    }
    
    _RegisterUser(email, password, name){
        console.log("Email", email);
        firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(() => {
            firebase.auth().currentUser.updateProfile({displayName: name});
            const uid = firebase.auth().currentUser.uid;
            this.DB._newUser(uid, email, name);
            this.props.navigation.navigate("Home"), 
            console.log("Success")})
    }

    _newRoom(roomID){
        const _path = "Rooms/" + roomID;
        const content = {
            "Item": {
                "Value": "",
                "ChosenBy": [""]
            },
            "Total":{
                "Value": "",
                "Remaining": ""
            }
        };

        const members = {
            "Host": "",
            "Joined": [""]
        };


        firebase.database().ref("Rooms").child(roomID).set({
            content,
            members
        }).then(() =>{
            console.log("New Room:", roomID);
        });  
    }

    _DisplayFromDatabase(table, uid, props){
        const _table = table + "/" + uid;

        console.log("Display From Database ----")        

        firebase.database().ref(_table).once('value', function(values){
            props.navigation.navigate("Display", {data: values.val()})
        });
    }

    _GetTextResult(roomID){
        const _path = "Rooms/" + roomID + "/data/TextDetections";
        firebase.database().ref(_path).once('value', function(values){
            console.log("Path: ", _path);
            console.log("Values: ", values.val());
            return values.val();
        })
    }

    _UpdateDatabase(table, id, key, value){
        const _table = table + "/" + id;
        
        firebase.database().ref(_table).update({
           Value: value
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

    _setRemainingPrice(id, remainingPrice){
        //Set initial remaining price calculated using generated item list prices
        const _table = "Rooms/" + id;
        
        firebase.database().ref(_table).child("/PriceValues").set({
            remainingBillPrice: remainingPrice
        });
    }

    _updateRemainingPrice(id, userTotalPrice, rejectItem){
        const _table = "Rooms/" + id + "/PriceValues";
        let newRemainingBillPrice = 0;

        firebase.database().ref(_table).once('value', function(snapshot){
            //If item has already been chosen, then add that items price back to remaining Bill Price
            if(rejectItem){
                console.log("Rejected Item Cost: " + userTotalPrice);
                newRemainingBillPrice = parseFloat(snapshot.val().remainingBillPrice) + userTotalPrice;
            }
            //If item has not been chosen yet, take item price from remaining Bill Price
            else{
                console.log("Item Cost: " + userTotalPrice);
                newRemainingBillPrice = parseFloat(snapshot.val().remainingBillPrice) - userTotalPrice;
            }

            console.log("Remaining Price: " + newRemainingBillPrice);    
            //Update remaining Bill Price in Database
            firebase.database().ref(_table).update({
                remainingBillPrice: newRemainingBillPrice
            });
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