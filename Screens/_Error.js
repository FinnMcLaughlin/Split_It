import React, {Component} from 'react';
import {AppRegistry, Platform, StyleSheet, Text, View} from 'react-native';

export default class _Error extends Component<Props>{

    constructor(props){
        super(props);

        this.state = {
            err_message: ""
        }

        if(typeof this.props.navigation.state.params.err_message != undefined){
            this.state.err_message = this.props.navigation.state.params.err_message;
        }
    }

    render(){
        return(
            <View>
                <Text>{this.state.err_message}</Text>
            </View>
        );
    }
}
AppRegistry.registerComponent('_Error', () => _Error);