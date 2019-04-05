'use strict'

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, ImageEditor, Text, View, ScrollView, Button, FlatList, TouchableOpacity, Modal, TextInput} from 'react-native';
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
            billID: this.props.navigation.state.params.ID,
            userID: firebase.auth().currentUser.uid,
            err_message: "",
            
            userInit: false,
            isHost: false,
            hostPaypal: "",
            hostPaypalInit: false,
            
            data: "",
            dataLoaded: false,

            editModalVisible: false,
            editModalClosing: true,
            modalItemName: "",
            modalItemPrice: "",
            modalItemIndex: 0,
            editItemName: false,
            editItemPrice: false,
            newItemName: "",
            newItemPrice: "",

            reviewModalVisible: false,
            remainingUsers: [],

            totalPrice: 0.00,
            setTotalPrice: false,

            calculatedTotalPrice: 0.00,
            setCTP: false,

            remainingTotalBillPrice: 0.00,
            RTP_equal_TP: false,

            userBillPrice: 0.00,   
            userFinalBillPrice: 0.00
        }

        let dis = this;

        
        firebase.database().ref(`Rooms/${this.state.billID}/host`).on('value', function(hostInfo){
          if(hostInfo.val() != null){
            var hostInfo = hostInfo.val();

            if(hostInfo.hostID == dis.state.userID){
              dis.state.isHost = true;
            }

            dis.DB._initUserBillData(dis.state.billID, dis.state.userID); 
    
            if(dis.state.isHost){
              dis.DB._getHostPaypalAccount(dis.state.billID, dis.state.userID);
              dis.state.hostPaypalInit = true;
            }
            else{
              if(hostInfo.hostPayPalEmail != null){
                dis.state.hostPaypal = hostInfo.hostPayPalEmail;
                dis.state.hostPaypalInit = true;
              }
            }
          }
        });
           
        
        firebase.database().ref(`Rooms/${this.state.billID}/content`).on('value', function(itemInfo){  
          var itemInfo = itemInfo.val();

          if(!dis.state.setCTP){
            dis._calculateRemainingBillPrice(itemInfo);
          }

          if(dis.state.RTP_equal_TP){
            dis._calculateUserBillPrice(itemInfo);
          }

          if(itemInfo != null){
            dis.state.data = itemInfo;
            dis.state.dataLoaded = true;
          }
        }); //

        firebase.database().ref(`Rooms/${this.state.billID}/priceValues`).on('value', function(priceValues){   
          var prices = priceValues.val();

          if(prices.billTotal != ""){
            console.log("Setting Total Price")
            dis.setState({totalPrice: prices.billTotal.value, setTotalPrice: true});
          
            if(prices.calculatedTotal != ""){
              console.log("This.SetState.CalculatedPrice")
              dis.setState({calculatedTotalPrice: prices.calculatedTotal.value})     
            }

            if(prices.remainingBillPrice != ""){
              dis.setState({remainingTotalBillPrice: prices.remainingBillPrice.value})
            }

            if(!dis.state.RTP_equal_TP){
                var equal;
                
                if(prices.billTotal.value == prices.calculatedTotal.value){
                  equal = true;
                }
                else{
                  equal = false;
                }
              
                dis.setState({RTP_equal_TP: equal});
            }          
          }
        }); //

        firebase.database().ref(`Rooms/${this.state.billID}/users`).on('value', function(userInfo){
          if(userInfo.val() != null){
            var values = userInfo.val();
            var currentUser = dis.state.userID;
            var no_users = 0;
            var no_finished_users = 0;
            var remaining_users = [];
           
            if(values[currentUser].itemsChosenTotal != null){
              var chosenItemsTotal = values[currentUser].itemsChosenTotal;
              var calculatedTax = (( chosenItemsTotal / 100) * 5.4 ) + 0.2;
              var finalTotal = Math.round((chosenItemsTotal + calculatedTax) * 100) / 100;

              dis.setState({
                userBillPrice: values[currentUser].itemsChosenTotal.toFixed(2),
                userFinalBillPrice: finalTotal
              });
            }

            Object.keys(values).forEach(user =>{
              
              no_users += 1;

              if(values[user].finishedChoosing){
                no_finished_users += 1;
              }
              else{
                remaining_users.push(user)
              }
            });

            dis.state.remainingUsers = remaining_users;

            if(no_users == no_finished_users && dis.state.hostPaypalInit){
              dis.setState({reviewModalVisible: false});
              dis.props.navigation.navigate("Payment", {finalTotal: dis.state.userFinalBillPrice, hostAccount: dis.state.hostPaypal});
            }
          }
        }); //
    } //
    
    _calculateRemainingBillPrice(items){
      console.log(items)
      
      if(items != null){
        var totalRemainingValue = 0;

        for(var itemIndex=0; itemIndex < items.length; itemIndex++){
          var itemPrice = parseFloat(items[itemIndex].data.price.replace(/[^\d.-]/g, ''));
          //var itemPrice = items[itemIndex].data.price
          totalRemainingValue = totalRemainingValue + itemPrice
        }

        console.log(totalRemainingValue)
  
        this.DB._setRemainingTotal(this.state.billID, totalRemainingValue);

        if(!this.state.RTP_equal_TP){
          console.log("Setting Calculated Total Price")
          this.DB._setCaclulateTotalPrice(this.state.billID, totalRemainingValue);
        }
        else{
          this.setState({setCTP: true})
        }
      }
    } //

    _calculateUserBillPrice(items){
      var newUserBillPrice = 0;
      
      for(var itemIndex=0; itemIndex < items.length; itemIndex++){
        var chosenByInfo = items[itemIndex].data.chosenBy;

        if(chosenByInfo.includes(this.state.userID)){
          var itemPrice = parseFloat(items[itemIndex].data.price.replace(/[^\d.-]/g, ''));
          
          newUserBillPrice = newUserBillPrice + ( itemPrice / items[itemIndex].data.chosenBy.length);
        }   
      }

      this.DB._updateUserBillData(this.state.billID, this.state.userID, "itemsChosenTotal", parseFloat(newUserBillPrice.toFixed(2)));
      this.DB._updateRemainingTotal(this.state.billID, items)
    } //

    _chooseItem(itemIndex){
      if(itemIndex != null){
        this.DB._userChooseItem(this.state.billID, itemIndex, this.state.userID);
      }
    } //

    _renderChosenByInfo(chosenBy){
      var renderString = "";

      for(var chosenIndex=0; chosenIndex < chosenBy.length; chosenIndex++){
        renderString = renderString + ", " + this.DB._getSpecificUserDisplayName(chosenBy[chosenIndex]);
      }
      
      return renderString.substring(2);
    } // 

    _renderWaitingForUsers(){
      var remaining_users = this.state.remainingUsers;
      var renderString = "";

      for(var usersIndex = 0; usersIndex < remaining_users.length; usersIndex++){
        renderString = renderString + ", " + this.DB._getSpecificUserDisplayName(remaining_users[usersIndex]);
      }

      return renderString.substring(2);

    } //

    _renderHostOrJoinOptions(item, index){
      if(this.state.isHost){
        return(
          <View>
            <TouchableOpacity  onPress={() => {this._chooseItem(index)}}><Text style={styles.itemDataStyle}>Choose</Text></TouchableOpacity>
            <TouchableOpacity  onPress={() => {console.log("Modal Visible"), this.setState({ editModalVisible: true, modalItemName: item.item, 
              modalItemPrice: item.data.price, modalItemIndex: index })}}>
                <Text style={styles.itemDataStyle}>Edit</Text>
            </TouchableOpacity>
          </View>
        );
      }
      else{
        return(
          <View>
            <TouchableOpacity  onPress={() => {this._chooseItem(index)}}><Text style={styles.itemDataStyle}>Choose</Text></TouchableOpacity>
          </View>
        );
      }
    } //

    _renderItemList(){
      return(
        <ScrollView>
          <FlatList data={this.state.data}
            renderItem={({item, index}) => (
                <View style={styles.headerStyle}>
                  <View>
                    <Text style={styles.warningStyle}>{item.item}</Text>
                    <Text style={styles.itemDataStyle}>{item.data.price}</Text>
                    <Text style={styles.itemDataStyle}>{this._renderChosenByInfo(item.data.chosenBy)}</Text>                     
                  </View>
                  {this._renderHostOrJoinOptions(item, index)}
                </View>
              )
            }
          />
        </ScrollView>
      );
    } //

    _renderItemEditModal(){
      var editNameVal = this.state.editItemName;
      var editPriceVal = this.state.editItemPrice;
      var setTotalPrice = this.state.setTotalPrice;
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
                  <TouchableOpacity onPress={() => {console.log("Modal Exit"), this.setState({newItemName: "", newItemPrice: "", editModalVisible: false, editModalClosing: true})}}><Text>Exit</Text></TouchableOpacity>
                </View>
                <View style={{marginRight: 15}}>
                  <TouchableOpacity  onPress={() => {console.log("Change Item Name"), this.setState({editItemName: true})}}><Text style={styles.itemDataStyle}>Edit</Text></TouchableOpacity>
                  <TouchableOpacity  onPress={() => {console.log("Change Item Price"), this.setState({editItemPrice: true})}}><Text style={styles.itemDataStyle}>Edit</Text></TouchableOpacity>
                </View>
              </View>
            );
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
                  <TouchableOpacity  onPress={() => {this.state.newItemName.length > 1 ? ( this.DB._updateItemInfo(this.state.billID, itemIndex, "item", this.state.newItemName), 
                    this.setState({modalItemName: this.state.newItemName, editItemName: false}), console.log("Accept Item Name Update: " + this.state.newItemName) ) : alert("Not Long Enough")}}>
                    <Text style={{fontSize: 20, justifyContent: "space-between", color: 'rgb(0, 0, 255)'}}>Accept</Text>
                  </TouchableOpacity>
                  <Text style={styles.itemDataStyle}>{itemPrice}</Text>
                </View>
                <View style={{marginRight: 15}}>
                  <TouchableOpacity  onPress={() => {console.log("Change Item Name")}}><Text style={styles.itemDataStyle}>Edit</Text></TouchableOpacity>
                </View>
              </View>
            );
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
                  <TouchableOpacity  onPress={() => {this.state.newItemPrice.length > 1 ? ( this.DB._updateItemInfo(this.state.billID, itemIndex, "price", this.state.newItemPrice), 
                    this.setState({modalItemPrice: this.state.newItemPrice, editItemPrice: false}), console.log("Accept Item Price Update") ) : alert("Not Long Enough")}}>
                    <Text style={{fontSize: 20, justifyContent: "space-between", color: 'rgb(0, 0, 255)'}}>Accept</Text>
                  </TouchableOpacity>                                  
                </View>
                <View style={{marginRight: 15}}>
                  <TouchableOpacity  onPress={() => {console.log("Change Item Name")}}><Text style={styles.itemDataStyle}>Edit</Text></TouchableOpacity>
                </View>
              </View>
            );
      }
    } //

    _renderReviewModal(){
      var billID = this.state.billID;
      var userID = this.state.userID;

      return(
        <View style={styles.modalStyle}>
          <View>
            <Text style={styles.footerStyle}>Your Total: {this.state.userBillPrice}</Text>
            <Text>Waiting For: {this._renderWaitingForUsers()}</Text>
            <TouchableOpacity onPress={() => {this.DB._updateUserBillData(billID, userID, "finishedChoosing", true)}}>
              <Text style={styles.footerTextStyle}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {this.DB._updateUserBillData(billID, userID, "finishedChoosing", false), this.setState({reviewModalVisible: false})}}>
              <Text style={styles.footerTextStyle}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    _renderFooter(){
      if(this.state.RTP_equal_TP){
        if(this.state.remainingTotalBillPrice == 0){
          return(
            <View style={styles.footerStyle}>
                <Text style={styles.footerTextStyle}>Your Total: {this.state.userBillPrice}</Text>
                <TouchableOpacity onPress={() => {this.setState({reviewModalVisible: true})}}>
                  <Text style={styles.footerTextStyle}>Finished</Text>
                </TouchableOpacity>
            </View>); 
        }
        else{
          return(
            <View style={styles.footerStyle}>
              <Text style={styles.footerTextStyle}>Your Total: {this.state.userBillPrice}</Text>
              <Text style={styles.footerTextStyle}>Remaining: {this.state.remainingTotalBillPrice}</Text>
            </View>); 
        }
      }
      else{
        if(!this.state.isHost && this.state.setCTP && this.state.editModalClosing){
          alert("Bill Total: " + this.state.totalPrice + " and Calculated Total: " + this.state.calculatedTotalPrice
          + " does not match.\nReview the item list and edit any necessary items to match the bill");
          this.setState({editModalClosing: false});
        }

        return(
          <View style={styles.footerStyle}>
              <Text style={styles.footerTextStyle}>Bill Total: {this.state.totalPrice}</Text>
              <Text style={styles.footerTextStyle}>Calculated Total: {this.state.calculatedTotalPrice}</Text>
          </View>);
      }
    } //

    render(){
      const priceCheck = /(?:\d+)?\.\d+/;

      return(
        !this.state.setTotalPrice && this.state.isHost 
        ?
          <View style={styles.enterPriceStyle}>
            <Text>Enter Bill Total</Text>
            <TextInput style={styles.textInputBox}  value={this.state.totalPrice == 0.00 ? "" : this.state.totalPrice.toString()} onChangeText={(billTotal) => this.setState({totalPrice: billTotal})}/>
            <TouchableOpacity  onPress={() => priceCheck.exec(this.state.totalPrice) ? ( this.setState({setTotalPrice: true, err_message: ""}), this.DB._setTotalPrice(this.state.billID, parseFloat(this.state.totalPrice.trim())) ) : this.setState({err_message: "Invalid Price"})}> 
                <Text style={{color: "red"}}>{this.state.err_message}</Text>
                <Text style={{fontSize:20}}>Join</Text>
            </TouchableOpacity>
          </View>
        
        :
        
        (
          !this.state.dataLoaded 
          ?
          <View>
            <Text>Loading Results..</Text>
          </View>
          
          :
          
          <View style={{flex: 1}}>
            {this._renderItemList()}

            {this._renderFooter()}
          
            <Modal transparent={false} visible={this.state.editModalVisible} animationType="slide" onRequestClose={() => console.log("Modal Closed")}>
              {this._renderItemEditModal()}
            </Modal>

            <Modal transparent={false} visible={this.state.reviewModalVisible} animationType="slide" onRequestClose={() => console.log("Modal Closed")}>
              {this._renderReviewModal()}
            </Modal>
          </View>    
        )
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
    },
    enterPriceStyle: {
      justifyContent: "space-between",
      marginTop: 200,
      alignItems: "center"
    }
});

AppRegistry.registerComponent('Results', () => OCRResult);
