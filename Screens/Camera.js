'use strict';

import React, { Component } from 'react';
import { AppRegistry, Platform, StyleSheet, Text, View, Button, TouchableOpacity, ImageBackground, Dimensions, Image, ToastAndroid, ActivityIndicator } from 'react-native';
import { RNCamera } from 'react-native-camera';
import RNFetchBlob from 'rn-fetch-blob';
import { Buffer } from 'safe-buffer';
import firebase from '@firebase/app';
import Database from './Database';
import { relative } from 'path';


var AWS = require('aws-sdk/react-native');

const cameraWidth = 
Dimensions.get('screen').width;

const cameraHeight = 
( (Dimensions.get('screen').width * 16) / 9 ) - 80;


const iconWidth = cameraWidth * 0.2;
const iconHeight = cameraHeight * 0.1;

export default class Camera extends Component<Props>{
  static navigationOptions = {
    headerStyle: {
        backgroundColor: 'rgb(221, 193, 54)',
    },
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

  _takePicture =  async function() {
      if (this.camera) {        
        const options = { quality: 0.5, base64: true, skipProcessing: false, fixOrientation: true };
        await this.camera.takePictureAsync(options).then((data) => {

          this.setState({
            picture_uri: data.uri,
            pictureTaken: true
          });
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
      
      
      let uid = this.state.user_id;
      let navigate = this.props.navigation;
      
      var rekt = new AWS.Rekognition();
      let dis = this;

      rekt.detectText(params, function(error, data) {      
        if (error){
          console.log(error)
        }
        else {                    
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

            <TouchableOpacity onPress={() => {console.log("Picture Accepted"), this._formatPicture(), this.setState({pictureAccepted: true})}}>
              <Image style={styles.icon} source={require('../Resources/tick_icon.png')}/>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  }


  render(){
      return(!this.state.pictureAccepted
        ?
        <View style={{position: 'relative'}}>
          {this._renderCamera()}
          {this._renderIcon()}       
          {ToastAndroid.show("Line first bill item within the boundry for the best result", ToastAndroid.LONG)}     
        </View>
        
        :
        
        <View style={styles.authentication_view}>
          <Text style={styles.authentication_style}>Picture Formatting</Text>
          <ActivityIndicator size='large' color='rgb(221, 193, 54)'/>
        </View>
    );
  }
}

const styles = StyleSheet.create({
  authentication_view: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(80, 120, 192)'
    
  },
  authentication_style: {
      fontSize: 30,
      fontFamily: 'Rocco',
      color: 'rgb(251, 113, 5)'
  },

  camera: {
    height: cameraHeight,
    width: cameraWidth,
  },

  cameraIconContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: (cameraHeight * (6/8)),
    paddingLeft: iconWidth / 2
  },
  cameraIcon: {
    height: iconHeight,
    width: iconWidth,
  },

  borderTLIcon: {
    marginLeft: cameraWidth / 20,
  },
  borderTRIcon: {
    marginLeft: (cameraWidth * (18 / 20)) - (iconWidth / 2),
  },
  borderTLContainer: {
    paddingLeft: cameraWidth / 20,
  },
  borderTRContainer: {
    paddingLeft: (cameraWidth * 18 / 20) - iconWidth,
  },

  acceptButtonPos: {
    position: 'absolute',
    bottom: 0,
    paddingLeft: (cameraWidth / 2) - (iconWidth) + (iconWidth / 4),
    paddingBottom: iconHeight / 4
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

  console.log("Checking Term in Line: ")
  console.log(line)

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
  
  //Check if anything follows price (price index + price length)
  //If there is, check item before or after - if line without price is empty, add to line, if not put price at the end of line
  if(!line.endsWith(price)){
    line = line.replace(price, "")
    line = line + " " + price
    items[itemsIndex] = line
  }

  //Return items
  return items;
}

function _checkForQuantity(line, numCheck){
  var regularQuantityCheck = /\d+\b|\d+([x]|[X])\b/ //Checks for a quantity value i.e. '1 , 2x, 3X'
  var irregularQuantityCheck = /\b([T])\b|\b([I])\b|\b([l])\b/
  var no_price_line = line.replace(numCheck.exec(line)[0], "")

  var quantity = [{found: null}, {value: 0}]

  if(regularQuantityCheck.test(no_price_line)){
    quantity[0] = {found: regularQuantityCheck.exec(no_price_line)[0]}
    quantity[1] = {value: parseInt(regularQuantityCheck.exec(no_price_line)[0])}
  }
  else if(irregularQuantityCheck.test(no_price_line)){
    quantity[0] = {found: irregularQuantityCheck.exec(no_price_line)[0]}
    quantity[1] = {value: 1}
  }
  
  return quantity
}

function _produceItemObject(line, numCheck, quantity){
  var priceIndex = numCheck.exec(line).index
  var itemName = line.substring(0, priceIndex-1)
  var itemPrice = line.substring(priceIndex) / quantity;

  console.log("Item: " + itemName + " Price: " + itemPrice);
  if(itemName[0] == " "){
    itemName = itemName.substring(1)
  }
  // console.log("----------------------")
  // console.log(" ")
  return { item: itemName, data: {price: itemPrice.toFixed(2), chosenBy: [""]}}
}

function _formatOCROutput(data){
  console.log("Formatting Output");
  let TD = data.TextDetections;
  var numCheck = /(?:\d+)?\.\d+/; //Checks for Floating Number
  
  var itemList = [];
  var itemIndex = 0;
  var invalidKeyChars = ['.', '#', '$', '/', '[', ']', '<', '>'];
  var blacklistTerms = ['Total', 'Subtotal', 'Visa', 'Debit', 'GST']

  console.log(TD)

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
      console.log("Item Doesn't Contain Price: " + currItem)
      itemList.splice(itemIndex, 1)
      itemIndex--;
    }
    else{
      itemList = _reOrderLine(currItem, itemList, itemIndex, numCheck)
      currItem = itemList[itemIndex]

      console.log("Reorder Line: " + currItem)

      var itemQuantityInfo = _checkForQuantity(currItem, numCheck);
      var itemQuantityValue = itemQuantityInfo[1].value

      console.log("ItemQuantity Info: ")
      console.log(itemQuantityInfo)

      if(itemQuantityValue > 0){
        var itemQuantityFound = itemQuantityInfo[0].found
        currItem = currItem.replace(itemQuantityFound, "")
        console.log("Line Fixed: " + currItem)
        
        itemList[itemIndex] = _produceItemObject(currItem, numCheck, itemQuantityValue)

        for(var index=1; index < itemQuantityValue; index++){
          itemList.splice(itemIndex + index, 0, _produceItemObject(currItem, numCheck, itemQuantityValue))
          itemIndex++
        }
      }
      else{
        itemList[itemIndex] = _produceItemObject(currItem, numCheck, 1)
      }
    }
  }
 
  console.log(itemList)   
  return itemList
}
  
AppRegistry.registerComponent('Camera', () => Camera);