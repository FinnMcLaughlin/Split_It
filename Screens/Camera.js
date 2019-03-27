'use strict';

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View, Button, TouchableOpacity, ImageBackground, Dimensions} from 'react-native';
import {RNCamera} from 'react-native-camera';
import RNFetchBlob from 'rn-fetch-blob';
import { Buffer } from 'safe-buffer';

import RNTesseractOcr from 'react-native-tesseract-ocr';

import navigate from './App';
import firebase from '@firebase/app';
import Database from './Database';
import symbolicateStackTrace from 'react-native/Libraries/Core/Devtools/symbolicateStackTrace';
import { gray } from 'ansi-colors';


var AWS = require('aws-sdk/react-native');

AWS.config.region = 'eu-west-1';


function formatOCROutput(data){
  let TD = data.TextDetections;
  var numCheck = /(?:\d+)?\.\d+/;///\d+\.\d+/; //Checks for Floating Number
  //(?i)\d+([x]) Checks for a quantity value i.e. '1x, 2x, 3X' 
  var itemList = [];
  var itemListIndex = 0;
  var invalidKeyChars = ['.', '#', '$', '/', '[', ']'];

  for(var TextDetectionIndex=0; TextDetectionIndex < TD.length; TextDetectionIndex++){
    if(TD[TextDetectionIndex].Type == "LINE"){     
      var curLine = TD[TextDetectionIndex].Geometry.BoundingBox.Top + TD[TextDetectionIndex].Geometry.BoundingBox.Height;
      var nextLine = TD[TextDetectionIndex+1].Geometry.BoundingBox.Top;
      
      //console.log("CurLine Top: " + TD[i].Geometry.BoundingBox.Top + " CurLine: " + curLine + "  NextLine: " + nextLine)
      //console.log(TD[i].DetectedText)
      //console.log(TD[i+1].DetectedText)

      if(TD[TextDetectionIndex+1].Type == "LINE" && curLine > nextLine)
      {
        if(!numCheck.test(TD[TextDetectionIndex].DetectedText) || !numCheck.test(TD[TextDetectionIndex+1].DetectedText)){   //Checks if there is a floating point missing from either line
          if(numCheck.test(TD[TextDetectionIndex])){   //Checks which line contains the float, arranges line appropriately
            TD[TextDetectionIndex+1].DetectedText = TD[TextDetectionIndex+1].DetectedText + " " + TD[TextDetectionIndex].DetectedText;
            TD[TextDetectionIndex].DetectedText = "N/A";
          }
          else{
            TD[TextDetectionIndex+1].DetectedText = TD[TextDetectionIndex].DetectedText + " " + TD[TextDetectionIndex + 1].DetectedText;
            TD[TextDetectionIndex].DetectedText = "N/A";
          }
          //console.log("New Line " + TD[i+1].DetectedText)
        }
      }

      if(TD[TextDetectionIndex].DetectedText != "N/A"){
        itemList[itemListIndex] = TD[TextDetectionIndex].DetectedText;
        itemListIndex += 1;
      }
    }
  }

  console.log(itemList)   

  for(var itemListIndex=0; itemListIndex < itemList.length; itemListIndex++){
    if(numCheck.exec(itemList[itemListIndex])){
      var splitIndex = numCheck.exec(itemList[itemListIndex]).index;
      var itemName = itemList[itemListIndex].substring(0, splitIndex-1);
      var itemPrice = itemList[itemListIndex].substring(splitIndex);

      for(var invalidKeyCharsIndex=0; invalidKeyCharsIndex < invalidKeyChars.length; invalidKeyCharsIndex++){
        var invalidChar = invalidKeyChars[invalidKeyCharsIndex];

        if(itemName.includes(invalidChar)){
          itemName = itemName.replace(invalidChar, " ");
        }
      }
      
      if(itemName.length < 1){
        itemName = "Invalid";
      }

      // itemList[itemListIndex] = {[itemName]: {
      //   "Price": itemPrice,
      //   "Chosen By": [""]
      //   }
      // }

      //{ item: "Potatoes", data: {price: "€8.50", chosenBy: ["Finn"]}}

      itemList[itemListIndex] = { item: itemName, data: {price: itemPrice, chosenBy: [""]}}
    }
  } 
  
  console.log(itemList)   
  return itemList
}

export default class Camera extends Component<Props>{
    static NavigationOptions = {
        title: 'Camera',
        headerBackTitle: 'Home'
      };
    
    constructor(props)
    {
      super(props);

      this.state = {
        pictureTaken: false,
        picture_uri: "",
        user_id: firebase.auth().currentUser.uid
      }

      this.DB = new Database();
    }

  _formatPicture = async function() {
    await RNFetchBlob.fs.readFile(this.state.picture_uri, 'base64').then( async (value) => {
      var params = {
        Image: {
          Bytes: new Buffer.from(value, 'base64')
        }
      };
      
      var rekt = new AWS.Rekognition();
      
      var newRoom = "J3LW";  
      let uid = this.state.user_id;

      rekt.detectText(params, function(err, data) {      
        if (err) console.log(err, err.stack);
        else {
          var content = formatOCROutput(data)

          firebase.database().ref(`Rooms/${newRoom}`).set({
            content: content,
            host: uid
          });
        }
      });

      //this.DB._billIDGen();
      console.log(this.state.picture_uri);
      this.props.navigation.navigate("Results", newRoom);
    });
  }

  _TakePicture =  async function() {
      if (this.camera) {
        
        const options = { quality: 0.5, base64: true, skipProcessing: true, fixOrientation: true };
        const data =  await this.camera.takePictureAsync(options)
        console.log("Raw Data", data);

        this.setState({
          picture_uri: data.uri,
          pictureTaken: true
        });

          console.log("Picture Taken");

          //this._formatPicture();
      }
  }

  _renderCamera(){
    if(!this.state.pictureTaken){
      return(
          <RNCamera
            ref={ref => {this.camera = ref;}}
            type={RNCamera.Constants.Type.back}
            style={styles.camera}
            autoFocus={RNCamera.Constants.AutoFocus.on}>
          <View style={styles.button_view}>
              <Button
                onPress={console.log("Take Picture"), this._TakePicture.bind(this)}
                style = {styles.button}
                title = "Take Picture">
              </Button>
          </View>
          </RNCamera>
      );
    }
    else{
      return(
        <View style={styles.button_view}>
          <ImageBackground source={{uri: this.state.picture_uri}} style={styles.preview}/>
          <View>
                  <Button
                    onPress={() => console.log("Accept Picture"), this._formatPicture.bind(this)}
                    style = {styles.button}
                    title = "Accept Picture">
                  </Button>
            </View>            
        </View>
      );
    }
  }

    render(){
        return(
          <View style={styles.view}>
            {this._renderCamera()}
          </View>
      );
    }
}

//require('./FYP_Logo.png')
//{uri: this.state.picture_uri}

const styles = StyleSheet.create({
    view: {
      flex: 1,
      flexDirection: 'column',
      backgroundColor: 'black'
    },
    camera: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      height: Dimensions.get('window').height - 125,
      width: Dimensions.get('window').width
    },
    button_view: {
      flex: 0,
      flexDirection: 'column'
    },
    button: {
      alignSelf: 'center',
    },
    preview: {
      height: Dimensions.get('window').height - 125,
      width: Dimensions.get('window').width
    }
  });
  
AppRegistry.registerComponent('Camera', () => Camera);


/*

        _TakePicture =  async function() {
        if (this.camera) {
          
          const options = { quality: 100, base64: true, skipProcessing: true, width:400, height: 500};
          const data =  await this.camera.takePictureAsync(options)
          console.log("Raw Data", data);

          await RNFetchBlob.fs.readFile(data.uri, 'base64').then( async (value) => {
              var params = {
              Image: {
                Bytes: new Buffer.from(value, 'base64')
              }
            };

            const tessOptions = {
              whitelist: null, 
              blacklist: '1234567890\'!"#$%&/()={}[]+*-_:;<>'
            };
            

            RNTesseractOcr.recognize(params, "LANG_ENGLISH", tessOptions)
            .then((result) => {
              this.setState({ ocrResult: result });
              console.log("OCR Result: ", result);
            })
            .catch((err) => {
              console.log("OCR Error: ", err);
            })
            .done();
          });
        }
    }
*/