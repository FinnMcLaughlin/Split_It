'use strict';

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View, Button, TouchableOpacity} from 'react-native';
import {RNCamera} from 'react-native-camera';
import RNFetchBlob from 'rn-fetch-blob';
import { Buffer } from 'safe-buffer';

import RNTesseractOcr from 'react-native-tesseract-ocr';

import navigate from './App';
import firebase from '@firebase/app';
import symbolicateStackTrace from 'react-native/Libraries/Core/Devtools/symbolicateStackTrace';


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
    }

    _TakePicture =  async function() {
      if (this.camera) {
        
        const options = { quality: 0.5, base64: true, skipProcessing: true };
        const data =  await this.camera.takePictureAsync(options)
        console.log("Raw Data", data);
        
        await RNFetchBlob.fs.readFile(data.uri, 'base64').then( async (value) => {
            var params = {
            Image: {
              Bytes: new Buffer.from(value, 'base64')
            }
          };
          
          var rekt = new AWS.Rekognition();
          
          var newRoom = "T3ST";

          // rekt.detectText(params, function(err, data) {      
          //   if (err) console.log(err, err.stack);
          //   else firebase.database().ref("Rooms").child(newRoom).set({
          //     data
          //   })
          // });        

          rekt.detectText(params, function(err, data) {      
            if (err) console.log(err, err.stack);
            else {
              var content = formatOCROutput(data)
              firebase.database().ref("Rooms").child(newRoom).set({
                content
              });
            }
          });

          this.props.navigation.navigate("Results");
        });
      }
  }

    render(){
        return(
          <View style={styles.view}>
            <RNCamera
            ref={ref => {this.camera = ref;}}
            type={RNCamera.Constants.Type.back}
            style={styles.camera}
            autoFocus={RNCamera.Constants.AutoFocus.on}/>
            <View style={styles.button_view}>
                <Button
                  onPress={console.log("Take Picture"), this._TakePicture.bind(this)}
                  style = {styles.button}
                  title = "Take Picture">
                </Button>
              </View>
          </View>
      )
    }
}

const styles = StyleSheet.create({
    view: {
      flex: 1,
      flexDirection: 'column',
      backgroundColor: 'black'
    },
    camera: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center'
    },
    button_view: {
      flex: 0,
      flexDirection: 'row'
    },
    button: {
      alignSelf: 'center'
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