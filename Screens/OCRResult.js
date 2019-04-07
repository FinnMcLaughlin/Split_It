'use strict'

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, ImageEditor, Text, View, ScrollView, Button, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator} from 'react-native';
import firebase from '@firebase/app';
import Database from './Database';

//GaryUID: u9hUFHFBMRP8JG31EqbzeO4JPc43
//RobUID: nLAgRb0DTfYsQjM3btjPhCBuqyh1

export default class OCRResult extends Component<Props>{
    static navigationOptions = ({navigation}) => {
      return{
        title: navigation.getParam('billID', ''),
        headerTitleStyle: {
          fontSize: 25,
          fontFamily: 'Rocco',
          color: 'rgb(251, 113, 5)',
          marginLeft: 50
        },
        headerStyle: {
          backgroundColor: 'rgb(221, 193, 54)',
        }
      }
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
              dis.state.hostPaypal = hostInfo.hostPayPalEmail;
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

            console.log("Host PayPal: " + dis.state.hostPaypal)
            if(no_users == no_finished_users && dis.state.hostPaypal != ""){
              dis.setState({reviewModalVisible: false});
              dis.props.navigation.navigate("Payment", {finalTotal: dis.state.userFinalBillPrice, hostAccount: dis.state.hostPaypal});
            }
          }
        }); //
    } //
    
    _calculateRemainingBillPrice(items){
      //console.log(items)
      
      if(items != null){
        var totalRemainingValue = 0;

        for(var itemIndex=0; itemIndex < items.length; itemIndex++){
          var itemPrice = parseFloat(items[itemIndex].data.price.replace(/[^\d.-]/g, ''));
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
          this.props.navigation.setParams({billID: "Bill ID: " + this.state.billID})
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
          <View style={styles.choice_view}>
            <TouchableOpacity  onPress={() => {this._chooseItem(index)}}><Text style={styles.choice_text}>Choose</Text></TouchableOpacity>
            <TouchableOpacity  onPress={() => {console.log("Modal Visible"), this.setState({ editModalVisible: true, modalItemName: item.item, 
              modalItemPrice: item.data.price, modalItemIndex: index })}}>
                <Text style={styles.host_text}>Edit</Text>
            </TouchableOpacity>
          </View>
        );
      }
      else{
        return(
          <View style={styles.choice_view}>
            <TouchableOpacity  onPress={() => {this._chooseItem(index)}}><Text style={styles.choice_text}>Choose</Text></TouchableOpacity>
          </View>
        );
      }
    } //

    _renderItemList(){
      return(
        <ScrollView style={{backgroundColor: 'rgb(221, 193, 54)'}}>
          <FlatList data={this.state.data}
            renderItem={({item, index}) => (
                <View style={styles.row_view}>
                  <View style={styles.item_view}>
                    <Text style={styles.item_style}>{item.item}</Text>
                    <Text style={styles.price_style}>{item.data.price}</Text>
                    <Text style={styles.chosen_style}>{this._renderChosenByInfo(item.data.chosenBy)}</Text>                     
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
              <View style={styles.edit_modal_view}>
                <View>
                  <Text style={styles.edit_text_style}>{itemName}</Text>
                  <Text style={styles.edit_text_style}>{itemPrice}</Text>
                  <TouchableOpacity onPress={() => {console.log("Modal Exit"), this.setState({newItemName: "", newItemPrice: "", editModalVisible: false, editModalClosing: true})}}><Text style={styles.edit_text_style}>Exit</Text></TouchableOpacity>
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
              <View style={styles.edit_modal_view}>
                <View>
                  <Text style={styles.edit_text_style}>{itemName}</Text>
                  <TextInput style={styles.input_box} value={newItemName}
                    onChangeText={(newItemName) => this.setState({newItemName: newItemName})}/>
                  
                  <View style={styles.edit_button_view}>
                    <TouchableOpacity  onPress={() => {console.log("Cancel Item Name Update"), this.setState({editItemName: false})}}>
                      <Text style={styles.edit_cancel_style}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity  onPress={() => {this.state.newItemName.length > 1 ? ( this.DB._updateItemInfo(this.state.billID, itemIndex, "item", this.state.newItemName), 
                      this.setState({modalItemName: this.state.newItemName, editItemName: false}), console.log("Accept Item Name Update: " + this.state.newItemName) ) : alert("Not Long Enough")}}>
                      <Text style={styles.edit_accept_style}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.edit_text_price_style}>{itemPrice}</Text>
                </View>
                <View style={{marginRight: 15}}>
                  <TouchableOpacity  onPress={() => {console.log("Change Item Name")}}><Text style={styles.itemDataStyle}>Edit</Text></TouchableOpacity>
                </View>
              </View>
            );
      }    
      else if(!editNameVal && editPriceVal){
        return(
              <View style={styles.edit_modal_view}>
                <View>
                  <Text style={styles.edit_text_style}>{itemName}</Text>
                  <Text style={styles.edit_text_style}>{itemPrice}</Text>
                  <TextInput style={styles.input_box} value={newItemPrice}
                    onChangeText={(newItemPrice) => this.setState({newItemPrice: newItemPrice})}/>                 
                  
                  <View style={styles.edit_button_view}>
                    <TouchableOpacity  onPress={() => {console.log("Cancel Item Price Update"), this.setState({editItemPrice: false})}}>
                      <Text style={styles.edit_cancel_style}>Cancel</Text>
                    </TouchableOpacity>   

                    <TouchableOpacity  onPress={() => {this.state.newItemPrice.length > 1 ? ( this.DB._updateItemInfo(this.state.billID, itemIndex, "price", this.state.newItemPrice), 
                      this.setState({modalItemPrice: this.state.newItemPrice, editItemPrice: false}), console.log("Accept Item Price Update") ) : alert("Not Long Enough")}}>
                      <Text style={styles.edit_accept_style}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                        

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
        <View style={styles.review_modal_view}>
            <Text style={styles.review_text_style}>Your Total: {this.state.userBillPrice}</Text>
            <Text style={styles.review_text_style}>Waiting For: {this._renderWaitingForUsers()}</Text>
            <View style={{alignItems: 'center'}}>
              <TouchableOpacity onPress={() => {this.DB._updateUserBillData(billID, userID, "finishedChoosing", true)}}>
                <Text style={styles.review_text_style}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {this.DB._updateUserBillData(billID, userID, "finishedChoosing", false), this.setState({reviewModalVisible: false})}}>
                <Text style={styles.review_text_style}>Exit</Text>
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
            </View>
          ); 
        }
      }
      else{
        if(this.state.isHost && !this.state.setCTP && this.state.editModalClosing){
          alert("Bill Total: " + this.state.totalPrice + " and Calculated Total: " + this.state.calculatedTotalPrice
          + " does not match.\nReview the item list and edit any necessary items to match the bill");
          this.setState({editModalClosing: false});
        }

        return(
          <View style={styles.footerStyle}>
              <Text style={styles.footerTextStyle}>Bill Total: {this.state.totalPrice}</Text>
              <Text style={styles.calc_footer_style}>Calculated Total: {this.state.calculatedTotalPrice}</Text>
          </View>);
      }
    } //

    render(){
      const priceCheck = /(?:\d+)?\.\d+/;

      return(
        !this.state.setTotalPrice && this.state.isHost 
        ?
          <View style={styles.enter_price_view}>
            <Text style={styles.header_style}>Enter Bill Total</Text>
            <TextInput style={styles.textInputBox}  value={this.state.totalPrice == 0.00 ? "" : this.state.totalPrice.toString()} onChangeText={(billTotal) => this.setState({totalPrice: billTotal})}/>
            <TouchableOpacity  onPress={() => priceCheck.exec(this.state.totalPrice) ? ( this.setState({setTotalPrice: true, err_message: ""}), this.DB._setTotalPrice(this.state.billID, parseFloat(this.state.totalPrice.trim())) ) : this.setState({err_message: "Invalid Price"})}> 
                <View style={{justifyContent: 'center', alignItems: 'center'}}>
                  <Text style={styles.error_text}>{this.state.err_message}</Text>
                  <Text style={styles.choice_text}>Join</Text>
                </View>
            </TouchableOpacity>
          </View>
        
        :
        
        (
          !this.state.dataLoaded 
          ?
          <View style={styles.authentication_view}>
            <Text style={styles.authentication_style}>Loading Results..</Text>
            <ActivityIndicator size='large' color='rgb(221, 193, 54)'/>
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
  enter_price_view: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgb(58, 102, 185)',
    paddingTop: 100
  },
  textInput_style: {
      marginBottom: 15,
      alignItems: 'center'
  },
  textInputBox: {
      height: 40,
      width: 250,
      borderWidth: 3,
      borderColor: 'rgb(221, 193, 54)',
      paddingLeft: 10,
      color: 'rgb(251, 113, 5)',
      fontFamily: 'Rocco',
      fontSize: 20
  },
  header_style: {
    fontSize: 40,
    alignItems: "center",
    fontFamily: 'Rocco',
    color: 'rgb(251, 113, 5)',
    marginTop: 100
  },
  error_text: { 
    fontSize: 15,
    fontFamily: 'Rocco',
    color: 'rgb(251, 50, 5)',
    paddingTop: 5
  },

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


  row_view: {
    flexDirection: 'row',
    flex:1,
    marginTop: 10,
    justifyContent: 'space-between',
    backgroundColor: 'rgb(80, 120, 192)'
  },
  item_view: {
    flex:1,
    justifyContent: 'space-around',
  },
  choice_view: {
    flex:1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginRight: 10,
    marginLeft: 30,
  },
  choice_text: {
    fontSize: 25,
    fontFamily: 'Rocco',
    color: 'rgb(251, 113, 5)',
  },
  host_text: {
    fontSize: 25,
    fontFamily: 'Rocco',
    color: 'rgb(251, 113, 5)',
    paddingTop: 10
  },
  item_style: {
      fontSize: 25,
      fontFamily: 'Rocco',
      color: 'rgb(251, 113, 5)',
      paddingTop: 10,
      marginLeft: 10,
  },
  price_style: {
    fontSize: 20,
    fontFamily: 'Rocco',
    color: 'rgb(251, 113, 5)',
    marginLeft: 10,
  },
  chosen_style: {
    fontSize: 20,
    fontFamily: 'Rocco',
    color: 'rgb(221, 193, 54)',
    marginLeft: 10,
    marginBottom: 10
  },
  itemDataStyle: {
    fontSize: 25,
    fontFamily: 'Rocco',
    color: 'rgb(251, 113, 5)',
  },

  
  footerStyle: {
    flexDirection: "row",
    height: "10%",
    backgroundColor: 'rgb(221, 193, 54)',
    justifyContent: "space-between",
    alignItems: "center"
  },
  footerTextStyle: {
    fontSize: 25,
    fontFamily: 'Rocco',
    color: 'rgb(251, 113, 5)',
  },
  calc_footer_style: {
    fontSize: 20,
    fontFamily: 'Rocco',
    color: 'rgb(251, 113, 5)',
  },

  edit_modal_view: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 200,
    paddingBottom: 150,
    paddingLeft: 15,
    backgroundColor: 'rgb(80, 120, 192)'
  },
  edit_text_style: {
    fontSize: 25,
    fontFamily: 'Rocco',
    color: 'rgb(251, 113, 5)',
  },
  edit_text_price_style: {
    fontSize: 25,
    fontFamily: 'Rocco',
    color: 'rgb(251, 113, 5)',
    paddingTop: 15
  },
  input_box: {
    height: 40,
    width: 250,
    borderWidth: 3,
    borderColor: 'rgb(221, 193, 54)',
    paddingLeft: 10,
    color: 'rgb(251, 113, 5)',
    fontFamily: 'Rocco',
    fontSize: 20
  },
  edit_button_view: {
    flexDirection: 'row', 
    justifyContent: 'space-between'
  },
  edit_accept_style: {
    fontSize: 25,
    fontFamily: 'Rocco',
    color: 'rgb(0, 180, 0)',
  },
  edit_cancel_style: {
    fontSize: 25,
    fontFamily: 'Rocco',
    color: 'rgb(180, 0, 0)',
  },


  review_modal_view: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(80, 120, 192)'
  },
  review_text_style: {
    fontSize: 25,
    fontFamily: 'Rocco',
    color: 'rgb(251, 113, 5)',
  },
});

AppRegistry.registerComponent('Results', () => OCRResult);
