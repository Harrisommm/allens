import {Dimensions, StyleSheet, View} from 'react-native';
import React from 'react';

import {
    GoogleSignin,
    GoogleSigninButton,
    isErrorWithCode,
    isSuccessResponse,
    statusCodes,    
} from '@react-native-google-signin/google-signin';

GoogleSignin.configure();

const GoogleAuth = () => {
    const signIn = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();
            if (isSuccessResponse(response)) {
                setState({userInfo: response.data});
            } else {
                //sing-in was cancelled
            }
        } catch (error) {
            if (isErrorWithCode(error)) {
                switch (error.code) {
                    case statusCodes.IN_PROGRESS:
                        // operation (e.g. sign in) is in progress already
                        break;
                    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                        // Android only, play services not available or outdated
                        break;
                    default:
                        // some other error happened
                }
            } else {
                // error not related to Google Signin
            }  
        }
    };

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
                    signIn();
                    //initiate Google Sign-In process
                }}
                //disabled={isInProgress}
            />
        </View>
    );
};

export default GoogleAuth;

const styles = StyleSheet.create({});