'use strict'

import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View, ScrollView, Button, FlatList, TouchableOpacity} from 'react-native';
import firebase from '@firebase/app';
import Database from './Database';


export default class OCRResult extends Component<Props>{
    static NavigationOptions = {
        title: 'Results',
    };

    constructor(props){
        super(props);

        this.DB = new Database();

        this.state = {
            data: [{ item: "", data: {price: "", chosenBy: [""]}}],
            dataLoaded: false,
            userBillPrice: "11.40",
            remainingTotalBillPrice: "16.40"
        }

        let dis = this;
        firebase.database().ref("Rooms/ZILP/content").on('value', function(snapshot){
            dis.setState({
                data: snapshot.val(),
                dataLoaded: true
            });
        });
    }
    

    _chooseItem(itemIndex){
      this.DB._UserChooseItem("ZILP", itemIndex, firebase.auth().currentUser.uid);
    }

    _renderChosenByInfo(chosen){
      var renderString = "";
      for(var chosenIndex=0; chosenIndex < chosen.length; chosenIndex++){
        renderString = renderString + ", " + this.DB._getSpecificUserDisplayName(chosen[chosenIndex]);
      }

      return renderString.substring(2);
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
                      <Text style={styles.itemDataStyle}>Edit</Text>
                    </View>
                  </View>
                )
              }
            />
          </ScrollView>
          <View style={styles.footerStyle}>
            <Text style={styles.footerTextStyle}>Your Total: {this.state.userBillPrice}</Text>
            <Text style={styles.footerTextStyle}>Remaining: {this.state.remainingTotalBillPrice}</Text>
          </View>  
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
    }
  });

/*
<View style={{flex: 1}}>
  <ScrollView>
    <SectionList
      sections={this.state.data}
      renderSectionHeader={({section}) => 
      <View style={styles.headerStyle}>
      <Text style={styles.warningStyle}>{section.item}</Text><Button style={styles.buttonStyle} title='Log Item' 
      onPress={() => {console.log("This item: " + section.item)}}/>
      </View>
      }
      renderItem={({item}) =>
        <Text style={styles.itemDataStyle}>{item.price}{item.chosenBy}</Text>}
      keyExtractor={(item, index) => index}
      />
  </ScrollView>
  <View style={styles.footerStyle}>
    <Text style={styles.footerTextStyle}>Bill Total:</Text>
    <Text style={styles.footerTextStyle}>Your Total:</Text>
  </View>  
</View>    

      var listData = [
          { item: "Po-ta-toes", data: [{price: "€8.50"}, {chosenBy: ["Finn"]}]},
          { item: "Boil em", data: [{price: "€2.50"}, {chosenBy: ["Dimiter"]}]},
          { item: "Mash em", data: [{price: "€4.00"}, {chosenBy: ["Colm"]}]},
          { item: "Stick em in a stew", data: [{price: "€10.00"}, {chosenBy: ["Finn, Colm"]}]}
        ];
*/
AppRegistry.registerComponent('Results', () => OCRResult);
