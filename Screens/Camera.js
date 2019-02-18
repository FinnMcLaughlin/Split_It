'use strict';

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View, Button, TouchableOpacity} from 'react-native';
import {RNCamera} from 'react-native-camera';
import RNFetchBlob from 'rn-fetch-blob';
import { Buffer } from 'safe-buffer';

import RNTesseractOcr from 'react-native-tesseract-ocr';

import navigate from './App';
import firebase from '@firebase/app';


var AWS = require('aws-sdk/react-native');

AWS.config.region = 'eu-west-1';
AWS.config.accessKeyId = 'AKIAJPUHL5EV23SAPEEA';
AWS.config.secretAccessKey = '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';

export default class Camera extends Component<Props>{
    static NavigationOptions = {
        title: 'Camera',
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

            const tessOptions = {
              whitelist: null, 
              blacklist: '1234567890\'!"#$%&/()={}[]+*-_:;<>'
            };
            

            RNTesseractOcr.recognize(value, "LANG_ENGLISH", tessOptions)
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

            rekt.detectText(params, function(err, data) {      
              if (err) console.log(err, err.stack);
              else firebase.database().ref("Rooms").child(newRoom).set({
                data
              })
            });
            
            this.props.navigation.navigate("Results");
          });
        }
    }



*/