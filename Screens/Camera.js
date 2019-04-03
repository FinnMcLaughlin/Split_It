'use strict';

import React, { Component } from 'react';
import { AppRegistry, Platform, StyleSheet, Text, View, Button, TouchableOpacity, ImageBackground, Dimensions, Image, ImageEditor, ActivityIndicator } from 'react-native';
import { RNCamera } from 'react-native-camera';
import RNFetchBlob from 'rn-fetch-blob';
import { Buffer } from 'safe-buffer';
import firebase from '@firebase/app';
import Database from './Database';
import { relative } from 'path';


var AWS = require('aws-sdk/react-native');



const cameraWidth = Dimensions.get('screen').width;// * 0.875;
const cameraHeight = ( (Dimensions.get('screen').width * 16) / 9 ) - 80;// * 0.875;
const iconWidth = cameraWidth * 0.2;
const iconHeight = cameraHeight * 0.1;

export default class Camera extends Component<Props>{
    static NavigationOptions = {
        title: 'Camera',
    };
    
    constructor(props)
    {
      super(props);

      this.state = {
        pictureTaken: false,
        pictureAccepted: false,
        picture_uri: "",
        user_id: firebase.auth().currentUser.uid,
        
      }

      this.DB = new Database();
    }

  _cropTest(){
          // Image.getSize(data.uri, (width, height) => {console.log("Image W:H " + width + ":" + height)});
          // console.log("Camera W " + cameraWidth)
          // //console.log("Start: W:H " + cameraWidth / 8 + ":" + cameraHeight / 8);
          // //console.log("Cropped Width: " + cropWidth)

          // var cropWidth = ((cameraWidth * (4/8)) - (iconWidth / 2)) - cameraHeight / 8;
          // const cropOptions = {offset: {x: cameraWidth / 8, y: cameraHeight / 8}, size: {width: 800, height: 1100}, displaySize: {width: 8000, height: 11000}, resizeMode: 'contain'}
          // //const cropOptions = {offset: {x: cameraWidth / 8, y: cameraHeight / 8}, size: {width: cropWidth, height: cameraHeight}, displaySize: {width: cameraWidth, height: cameraHeight}}
          // ImageEditor.cropImage(data.uri, cropOptions, (success) => this.setState({
          //   picture_uri: success,
          //   pictureTaken: true
          // })
          // , () => console.log("Failed"));
  }

  _takePicture =  async function() {
      if (this.camera) {        
        const options = { quality: 0.5, base64: true, skipProcessing: false, fixOrientation: true, width: 500 };
        await this.camera.takePictureAsync(options).then((data) => {
          var cropWidth = ((cameraWidth * (4/8)) - (iconWidth / 2)) - cameraHeight / 8;

          console.log("Raw Data", data);  

          this.setState({
            picture_uri: data.uri,
            pictureTaken: true
          })
          console.log("Picture Taken");
        })
      }
  }

  _formatPicture = async function() {
    await RNFetchBlob.fs.readFile(this.state.picture_uri, 'base64').then( async (value) => {
      var params = {
        Image: {
          Bytes: new Buffer.from(value, 'base64')
        }
      };

      console.log("Formatting")
      
      var rekt = new AWS.Rekognition();
      
      let uid = this.state.user_id;
      let navigate = this.props.navigation;
      let dis = this;

      rekt.detectText(params, function(err, data) {      
        if (err) console.log(err, err.stack);
        else {          
          console.log("Data Detected")
          var content = _formatOCROutput(data)
          dis.DB._billIDGen(navigate, content);
        }
      });
    });
  }

  _renderCamera(){
    if(!this.state.pictureTaken){
      return(
          <RNCamera
            ref={ref => {this.camera = ref}}
            type={RNCamera.Constants.Type.back}
            style={styles.camera}
            autoFocus={RNCamera.Constants.AutoFocus.on}/>
      );
    }
    else{
      return(
          <ImageBackground source={{uri: this.state.picture_uri}} style={styles.camera}/>         
      );
    }
  }

  _renderIcon(){
    if(!this.state.pictureTaken){
      return(
        <View style={{position: 'absolute'}}>
          <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
            <Image style={styles.borderTLIcon} source={require('../Resources/top_left_icon.png')}/> 
            <Image style={styles.borderTRIcon} source={require('../Resources/top_right_icon.png')}/> 
          </View>
          <View style={styles.cameraIconContainer}>
            <TouchableOpacity onPress={() => {console.log("Take Picture"), this._takePicture()}}>
              <Image style={styles.cameraIcon} source={require('../Resources/camera_icon_white.png')}/> 
            </TouchableOpacity>
          </View>
        </View>  
      );
    }
    else{
      return(
        <View style={styles.acceptButtonPos}>
          <View style={styles.acceptIconContainer}>
            <TouchableOpacity onPress={() => {console.log("Retake Picture"), this.setState({pictureTaken: false})}}>
              <Image style={styles.icon} source={require('../Resources/cross_icon.png')}/>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {console.log("Picture Accepted"), this._formatPicture()}}>
              <Image style={styles.icon} source={require('../Resources/tick_icon.png')}/>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  }

  //this.setState({pictureAccepted: true})

  render(){
      return(!this.state.pictureAccepted
        ?
        <View style={{position: 'relative'}}>
          {this._renderCamera()}
          {this._renderIcon()}               
        </View>
        
        :
        
        <View>
          <Text>Picture Formatting</Text>
          <ActivityIndicator size='large' color='red'/>
        </View>
    );
  }
}

const styles = StyleSheet.create({
  camera: {
    height: cameraHeight,
    width: cameraWidth,
  },
  cameraIconContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: (cameraHeight * (6/8)) - (iconHeight),
    paddingLeft: iconWidth / 2
  },
  cameraIcon: {
    height: iconHeight,
    width: iconWidth,
  },

  borderTLIcon: {
    marginLeft: cameraWidth / 8,
    marginTop: cameraHeight / 8
  },
  borderTRIcon: {
    marginLeft: (cameraWidth * (4/8)) - (iconWidth / 2),
    marginTop: cameraHeight / 8
  },
  borderTLContainer: {
    paddingLeft: cameraWidth / 12,
    paddingTop: cameraHeight / 12
  },
  borderTRContainer: {
    paddingLeft: (cameraWidth * 11 / 12) - iconWidth,
    paddingTop: cameraHeight / 12
  },

  acceptButtonPos: {
    position: 'absolute',
    bottom: 0,
    paddingLeft: (cameraWidth / 2) - (iconWidth) + (iconWidth / 4)
  },
  acceptIcon: {
    height: iconHeight,
    width: iconWidth
  },
  acceptIconContainer: {
    flex: 1,
    flexDirection: 'row',
  }
});

function _checkForTerm(line, list){
  var valid = true;

  for(var index=0; index < list.length; index++){
    if(line.toUpperCase().includes(list[index].toUpperCase())){
      valid = false;
      break;
    }
  }

  return valid;
}

function _reOrderLine(line, items, itemsIndex, numCheck){
  //Get Pos of price
  var price = numCheck.exec(line)[0];
  var priceIndex = numCheck.exec(line);
  
  //Check if anything follows price (price index + price length)
  //If there is, check item before or after - if line without price is empty, add to line, if not put price at the end of line
  if(!line.endsWith(price)){
    console.log("--Reordering--")
    line = line.replace(price, "")
    console.log("-- " + line)
    line = line + " " + price
    console.log("-- " + line)
    items[itemsIndex] = line
  }

  //Return items
  return items;
}

function _produceItemObject(line, numCheck){
  var priceIndex = numCheck.exec(line).index
  var itemName = line.substring(0, priceIndex-1)
  var itemPrice = line.substring(priceIndex)

  console.log("Item: " + itemName + " Price: " + itemPrice);
  console.log("----------------------")
  console.log(" ")
  return { item: itemName, data: {price: itemPrice, chosenBy: [""]}}
}

function _formatOCROutput(data){
  console.log("Formatting Output");
  let TD = data.TextDetections;
  var numCheck = /(?:\d+)?\.\d+/; //Checks for Floating Number
  var quantityCheck = /\d+([x]|[X]) | \d+\s\b | \b([T])\b | \b([I])\b/; //Checks for a quantity value i.e. '1 , 2x, 3X' 
  var itemList = [];
  var itemIndex = 0;
  var invalidKeyChars = ['.', '#', '$', '/', '[', ']', '<', '>'];
  var blacklistTerms = ['Total', 'Subtotal', 'Visa', 'Debit', 'GST']

  // console.log(TD)
  // console.log("---------------Last Result: ")
  // console.log(TD[TD.length - 1]);

  // var test = false;
  // var index = TD.length - 1;
  // var wordCount = 0;

  // console.log("---------------Specific Result: ")


  // while(!test){
  //   if(TD[index].Type == 'LINE'){
  //     console.log(TD[index])
  //     console.log("Word Count: " + wordCount)
  //     test = true;
  //   }
  //   else{
  //     wordCount = wordCount + 1;
  //   }

  //   index = index - 1;
  // }


  for(var TD_Index=0; TD_Index < TD.length; TD_Index++){
    if(TD[TD_Index].Type == "LINE"){     
      var curLine = TD[TD_Index].Geometry.BoundingBox.Top + TD[TD_Index].Geometry.BoundingBox.Height;
      var nextLine = TD[TD_Index+1].Geometry.BoundingBox.Top;

      if(TD[TD_Index+1].Type == "LINE" && curLine > nextLine)
      {
        if(!numCheck.test(TD[TD_Index].DetectedText) || !numCheck.test(TD[TD_Index+1].DetectedText)){   //Checks if there is a floating point missing from either line
          if(numCheck.test(TD[TD_Index])){   //Checks which line contains the float, arranges line appropriately
            TD[TD_Index+1].DetectedText = TD[TD_Index+1].DetectedText + " " + TD[TD_Index].DetectedText;
            TD[TD_Index].DetectedText = "N/A";
          }
          else{
            TD[TD_Index+1].DetectedText = TD[TD_Index].DetectedText + " " + TD[TD_Index + 1].DetectedText;
            TD[TD_Index].DetectedText = "N/A";
          }
        }
      }

      if(TD[TD_Index].DetectedText != "N/A"){
        itemList[itemIndex] = TD[TD_Index].DetectedText;
        itemIndex += 1;
      }
    }
  }

  console.log(itemList)

  for(var itemIndex=0; itemIndex < itemList.length; itemIndex++){
    var currItem = itemList[itemIndex];

    if(!_checkForTerm(currItem, blacklistTerms)){
      itemList.splice(itemIndex, (itemList.length - itemIndex))
      console.log("Breaking At: " + itemIndex)
      break;
    }

    if(!numCheck.test(currItem)){
      itemList.splice(itemIndex, 1)
      itemIndex--;
    }
    else{
      itemList = _reOrderLine(currItem, itemList, itemIndex, numCheck)
      currItem = itemList[itemIndex]
      itemList[itemIndex] = _produceItemObject(currItem, numCheck)

      // var quantityValue = 0;

      // if(quantityCheck.test(currItem)){
      //   quantityValue = quantityCheck.exec(currItem)

      //   console.log("Quantity: " + quantityValue + " at index: " + itemIndex);        
      // }

      //console.log(numCheck.exec(currItem))
      // console.log("-----------------------------------")
    }

    //currItem = { item: itemName, data: {price: itemPrice, chosenBy: [""]}}

  }

  console.log(itemList)

  // for(var itemIndex=0; itemIndex < itemList.length; itemIndex++){
  //   if(numCheck.exec(itemList[itemIndex])){
  //     var splitIndex = numCheck.exec(itemList[itemIndex]).index;
  //     var itemName = itemList[itemIndex].substring(0, splitIndex-1);
  //     var itemPrice = itemList[itemIndex].substring(splitIndex);

  //     for(var invalidKeyCharsIndex=0; invalidKeyCharsIndex < invalidKeyChars.length; invalidKeyCharsIndex++){
  //       var invalidChar = invalidKeyChars[invalidKeyCharsIndex];

  //       if(itemName.includes(invalidChar)){
  //         itemName = itemName.replace(invalidChar, " ");
  //       }
  //     }
      
  //     if(itemName.length < 1){
  //       itemName = "Invalid";
  //     }

  //     // itemList[itemIndex] = {[itemName]: {
  //     //   "Price": itemPrice,
  //     //   "Chosen By": [""]
  //     //   }
  //     // }

  //     //{ item: "Potatoes", data: {price: "€8.50", chosenBy: ["Finn"]}}

  //     itemList[itemIndex] = { item: itemName, data: {price: itemPrice, chosenBy: [""]}}
  //   }
  // } 
  
  //console.log(itemList)   
  return itemList
}
  
AppRegistry.registerComponent('Camera', () => Camera);