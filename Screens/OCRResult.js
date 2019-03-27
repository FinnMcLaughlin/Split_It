'use strict'

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View, ScrollView, Button, FlatList, TouchableOpacity, Modal, TextInput} from 'react-native';
import firebase from '@firebase/app';
import Database from './Database';

//GaryUID: u9hUFHFBMRP8JG31EqbzeO4JPc43
//RobUID: nLAgRb0DTfYsQjM3btjPhCBuqyh1

export default class OCRResult extends Component<Props>{
    static NavigationOptions = {
        title: 'Results',
    };

    constructor(props){
        super(props);

        this.DB = new Database();

        this.state = {
            billID: this.props.navigation.state.params,
            userID: firebase.auth().currentUser.uid,
            data: [{ item: "", data: {price: "", chosenBy: [""]} }],
            dataLoaded: false,
            setRemainingPriceCheck: false,

            modalVisible: false,
            modalItemName: "",
            modalItemPrice: "",
            modalItemIndex: 0,
            editItemName: false,
            editItemPrice: false,
            newItemName: "",
            newItemPrice: "",

            totalPrice: 35.99,
            calculatedTotalPrice: 0.00,
            userBillPrice: 0.00,
            remainingTotalBillPrice: 0.00,
            remainingValue_TotalValueEqual: true
        }

        let dis = this;
        firebase.database().ref(`Rooms/${this.state.billID}/content`).on('value', function(snapshot){            
            if(!dis.state.setRemainingPriceCheck){
              dis._calculateRemainingBillPrice(snapshot.val());
            }
            else{
              dis._calculateUserBillPrice(snapshot.val());
            }

            dis.setState({
              data: snapshot.val(),
              dataLoaded: true
          });
        });

        firebase.database().ref(`Rooms/${this.state.billID}/PriceValues`).on('value', function(snapshot){          
          var equal;
          
          if(dis.state.totalPrice == dis.state.calculatedTotalPrice){
            equal = true;
          }
          else{
            equal = false;
          }

          console.log("EQUAL: " + dis.state.totalPrice + " " + dis.state.calculatedTotalPrice)

          dis.setState({
            remainingTotalBillPrice: snapshot.val().remainingBillPrice.toFixed(2),
            remainingValue_TotalValueEqual: equal         
          })
        });
    }
    
    _calculateRemainingBillPrice(items){
      var totalRemainingValue = 0;

      for(var itemIndex=0; itemIndex < items.length; itemIndex++){
        var itemPrice = items[itemIndex].data.price;
        
        totalRemainingValue = totalRemainingValue + parseFloat(itemPrice.replace(/[^\d.-]/g, ''));
        console.log("Item: " + items[itemIndex].item + " Price: " + itemPrice + " Remaining Value: " + totalRemainingValue)
      }      

      this.DB._setRemainingPrice(this.state.billID, totalRemainingValue);
      
      this.setState({
        calculatedTotalPrice: totalRemainingValue
      });
    }

    _calculateUserBillPrice(items){
      var previousUserBillPrice = this.state.userBillPrice;
      var newUserBillPrice = 0;
      var rejectItem = false;
      
      for(var itemIndex=0; itemIndex < items.length; itemIndex++){
        var chosenByInfo = items[itemIndex].data.chosenBy;

        if(chosenByInfo.includes(this.state.userID)){
          var itemPrice = parseFloat(items[itemIndex].data.price.replace(/[^\d.-]/g, ''));
          
          newUserBillPrice = newUserBillPrice + ( itemPrice / items[itemIndex].data.chosenBy.length);
        }   
      }

      this.setState({
        userBillPrice: newUserBillPrice.toFixed(2),
      });

      if(previousUserBillPrice > newUserBillPrice){
        rejectItem = true;
        newUserBillPrice = previousUserBillPrice - newUserBillPrice;
      }
      else{
        newUserBillPrice = newUserBillPrice - previousUserBillPrice;
      }

      this.DB._updateRemainingPrice(this.state.billID, newUserBillPrice, rejectItem)
    }

    _chooseItem(itemIndex){
      this.DB._UserChooseItem(this.state.billID, itemIndex, this.state.userID);
    }

    _renderChosenByInfo(chosen){
      var renderString = "";

      for(var chosenIndex=0; chosenIndex < chosen.length; chosenIndex++){
        renderString = renderString + ", " + this.DB._getSpecificUserDisplayName(chosen[chosenIndex]);
      }

      return renderString.substring(2);
    }

    _renderModal(){
      var editNameVal = this.state.editItemName;
      var editPriceVal = this.state.editItemPrice;
      var itemIndex = this.state.modalItemIndex;
      var itemName = this.state.modalItemName;
      var itemPrice = this.state.modalItemPrice;
      var newItemName = this.state.newItemName;
      var newItemPrice = this.state.newItemPrice;

      if(!editNameVal && !editPriceVal){
        return(
              <View style={styles.modalStyle}>
                <View>
                <Text style={styles.itemDataStyle}>{itemName}</Text>
                <Text style={styles.itemDataStyle}>{itemPrice}</Text>
                <TouchableOpacity onPress={() => {console.log("Modal Exit"), this.setState({newItemName: "", newItemPrice: "", modalVisible: false})}}><Text>Exit</Text></TouchableOpacity>
                </View>
                <View style={{marginRight: 15}}>
                  <TouchableOpacity  onPress={() => {console.log("Change Item Name"), this.setState({editItemName: true})}}><Text style={styles.itemDataStyle}>Edit</Text></TouchableOpacity>
                  <TouchableOpacity  onPress={() => {console.log("Change Item Price"), this.setState({editItemPrice: true})}}><Text style={styles.itemDataStyle}>Edit</Text></TouchableOpacity>
                </View>
              </View>);
      }
      else if(editNameVal && !editPriceVal){
        return(
              <View style={styles.modalStyle}>
                
                <View>
                  <Text style={styles.itemDataStyle}>{itemName}</Text>
                  
                  <TextInput style={styles.textInputBox} value={newItemName}
                   onChangeText={(newItemName) => this.setState({newItemName: newItemName})}/>
                  
                  <TouchableOpacity  onPress={() => {console.log("Cancel Item Name Update"), this.setState({editItemName: false})}}>
                    <Text style={{fontSize: 20, justifyContent: "space-between", color: 'rgb(255, 0, 0)'}}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity  onPress={() => {console.log("Accept Item Name Update: " + this.state.newItemName), 
                  this.state.newItemName.length > 1 ? (this.DB._updateItemInfo(this.state.billID, itemIndex, "item", this.state.newItemName), this.setState({modalItemName: this.state.newItemName, editItemName: false})) : alert("Not Long Enough")}}>
                    <Text style={{fontSize: 20, justifyContent: "space-between", color: 'rgb(0, 0, 255)'}}>Accept</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.itemDataStyle}>{itemPrice}</Text>

                </View>
                <View style={{marginRight: 15}}>
                  <TouchableOpacity  onPress={() => {console.log("Change Item Name")}}><Text style={styles.itemDataStyle}>Edit</Text></TouchableOpacity>
                </View>
              </View>);
      }    
      else if(!editNameVal && editPriceVal){
        return(
              <View style={styles.modalStyle}>
                <View>
                  <Text style={styles.itemDataStyle}>{itemName}</Text>

                  <Text style={styles.itemDataStyle}>{itemPrice}</Text>

                  <TextInput style={styles.textInputBox} value={newItemPrice}
                  onChangeText={(newItemPrice) => this.setState({newItemPrice: newItemPrice})}/>
                  
                  <TouchableOpacity  onPress={() => {console.log("Cancel Item Price Update"), this.setState({editItemPrice: false})}}>
                    <Text style={{fontSize: 20, justifyContent: "space-between", color: 'rgb(255, 0, 0)'}}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity  onPress={() => {console.log("Accept Item Price Update"), 
                    this.state.newItemPrice.length > 1 ? (this.DB._updateItemInfo(this.state.billID, itemIndex, "price", this.state.newItemPrice), this.setState({modalItemPrice: this.state.newItemPrice, editItemPrice: false})) : alert("Not Long Enough")}}>
                    <Text style={{fontSize: 20, justifyContent: "space-between", color: 'rgb(0, 0, 255)'}}>Accept</Text>
                  </TouchableOpacity>
                                  
                </View>
                <View style={{marginRight: 15}}>
                  <TouchableOpacity  onPress={() => {console.log("Change Item Name")}}><Text style={styles.itemDataStyle}>Edit</Text></TouchableOpacity>
                </View>
              </View>);
      }
    }

    _renderFooter(){
      if(this.state.remainingValue_TotalValueEqual){
        return(
        <View style={styles.footerStyle}>
            <Text style={styles.footerTextStyle}>Your Total: {this.state.userBillPrice}</Text>
            <Text style={styles.footerTextStyle}>Remaining: {this.state.remainingTotalBillPrice}</Text>
        </View>); 
      }
      else{
        if(this.state.setRemainingPriceCheck && !this.state.modalVisible){
          alert("Bill Total: " + this.state.totalPrice + " and Calculated Total: " + this.state.calculatedTotalPrice
          + " does not match.\nReview the item list and edit any necessary items to match the bill");
        }

        return(
          <View style={styles.footerStyle}>
              <Text style={styles.footerTextStyle}>Bill Total: {this.state.totalPrice}</Text>
              <Text style={styles.footerTextStyle}>Remaining: {this.state.calculatedTotalPrice}</Text>
          </View>);
      }
    }

    render(){
      var listData = [
        { item: "Po-ta-toes", data: {price: "€8.50", chosenBy: ["Finn"]}}
      ];

      return(!this.state.dataLoaded ?
        <View>
        <Text>Loading Results..</Text>
        </View>
        :
        <View style={{flex: 1}}>
          <ScrollView>

            <FlatList data={this.state.data}
              renderItem={({item, index}) => (
                  <View style={styles.headerStyle}>
                    <View>
                      <Text style={styles.warningStyle}>{item.item}</Text>
                      <Text style={styles.itemDataStyle}>{item.data.price}</Text>
                      <Text style={styles.itemDataStyle}>{this._renderChosenByInfo(item.data.chosenBy)}</Text>                     
                    </View>
                    <View>
                      <TouchableOpacity  onPress={() => {console.log("This item: " + item), this._chooseItem(index)}}><Text style={styles.itemDataStyle}>Choose</Text></TouchableOpacity>
                      <TouchableOpacity  onPress={() => {console.log("Modal Visible"), this.setState({ modalVisible: true, modalItemName: item.item, modalItemPrice: item.data.price, modalItemIndex: index })}}><Text style={styles.itemDataStyle}>Edit</Text></TouchableOpacity>
                    </View>
                  </View>
                )
              }
            />
          
          </ScrollView>
          
          {this._renderFooter()}
        
          <Modal transparent={false} visible={this.state.modalVisible} animationType="slide" onRequestClose={() => console.log("Modal Closed")}>
            {this._renderModal()}
          </Modal>

        </View>    
      )
    }
}

const styles = StyleSheet.create({
    warningStyle: {
      color: "red",      
      justifyContent: "flex-start",
      fontSize: 25
    },
    itemDataStyle: {
      fontSize: 20,
      justifyContent: "space-between",
    },
    headerStyle: {
      flexDirection: "row",
      flex:2,
      margin: 10,
      justifyContent: "space-between"
    },
    footerStyle: {
      flexDirection: "row",
      height: "10%",
      backgroundColor: "white",
      justifyContent: "space-between",
      alignItems: "center"
    },
    footerTextStyle: {
      fontSize: 20,
      fontWeight: "bold"
    },
    modalStyle: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 200,
      marginBottom: 150,
      backgroundColor:'rgb(255, 255, 255)'
    },
    textInputBox: {
      height: 40,
      width: 250,
      padding: 5,
      borderWidth: 1,
      borderColor: 'blue',
    }
  });

AppRegistry.registerComponent('Results', () => OCRResult);
