'use strict' 

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View} from 'react-native';
import firebase from '@firebase/app';

var config = {
    apiKey: "AIzaSyBY7NjjYQ9tHYwCOu-ilMZaG4BZsbuI9V4",
    authDomain: "splitit-21d20.firebaseapp.com",
    databaseURL: "https://splitit-21d20.firebaseio.com",
    projectId: "splitit-21d20",
    storageBucket: "splitit-21d20.appspot.com",
    messagingSenderId: "610097620685"
};

if (!firebase.apps.length) {
firebase.initializeApp(config);
}

export default class Database extends Component<Props>{

    constructor(props)
    {
        super(props);
    }
    
    _newUser(uid, email, name){
        firebase.database().ref("Users").child(uid).set({
            name,
            email
        });
    }

    _newRoom(roomID){
        const _path = "Rooms/" + roomID;
        const content = {
            "Item": {
                "Value": "",
                "ChosenBy": ""
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

    _UserChooseItem(id, itemIndex, username){
        const _table = "Rooms/" + id + "/content/" + itemIndex + "/data";
        
        firebase.database().ref(_table + "/chosenBy").on('value', function(snapshot){
            var existingData = snapshot.val();
            var newData = [];
            console.log("Existing Data: " + existingData)

            if(!existingData.includes(username)){

                if(existingData == ""){
                    existingData = [`${username}`]
                }
                else{
                    existingData.push(username);
                }                
                
                firebase.database().ref(_table).update({
                    chosenBy: existingData
                })
            }
            else{
                existingData[existingData.indexOf(username)] = "";

                console.log("Updated: " + existingData)
                // firebase.database().ref(_table).update({
                //     chosenBy: existingData
                // })
            }
          })    
    }
}

AppRegistry.registerComponent('Database', () => Database);