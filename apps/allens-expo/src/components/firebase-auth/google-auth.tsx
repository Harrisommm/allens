import {Dimensions, StyleSheet, View} from 'react-native';
import React from 'react';

import {GoogleSigninButton} from '@react-native-google-signin/google-signin';

const GoogleAuth = () => {
    return(
        <View 
            style={{
                width:Dimensions.get('screen').width,
                height:Dimensions.get('screen').height,
                justifyContent:'center',
                alignItems:'center'
            }}
        >
            <GoogleSigninButton
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
                onPress={() => {
                    alert(1);
                    //initiate Google Sign-In process
                }}
                //disabled={isInProgress}
            />
        </View>
    );
};

export default GoogleAuth;

const styles = StyleSheet.create({});