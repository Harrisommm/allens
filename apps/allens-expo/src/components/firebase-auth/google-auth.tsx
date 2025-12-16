import {Dimensions, StyleSheet, View, Pressable, Text} from 'react-native';
import React from 'react';
import { GoogleAuthProvider, getAuth, signInWithCredential } from '@react-native-firebase/auth';

import {
    GoogleSignin,
    GoogleSigninButton,
    isErrorWithCode,
    isSuccessResponse,
    statusCodes,    
} from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
    webClientId: 
    "785759755772-1ccmpgd44r06nq5qt7bhjua091clfbel.apps.googleusercontent.com"
});

const GoogleAuth = () => {
    async function signIn() {
        let idToken;
        //check if your device supports Google Play
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        //get the users ID token
        const signInResult = await GoogleSignin.signIn();

        //try the new style of Google signin result
        idToken = signInResult.data?.idToken;
        if (!idToken) {
            //if you are using older versions of google signin, try old style result
            idToken = signInResult.idToken;
        }
        if (!idToken) {
            throw new Error("Failed to get ID token from Google Sign-In");            
        }

        //create a google credential with the token
        const googleCredential = GoogleAuthProvider.credential(
            signInResult.data.idToken
        );
            
        //Sign-in the user with the credential
        return signInWithCredential(getAuth(), googleCredential);
    }
    
    const signOut = async () => {
        GoogleSignin.signOut();
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
            <Pressable onPress={signOut} style={{marginTop:20, padding:10, backgroundColor:'lightgrey'}}>
                <Text>
                    SignOut
                </Text>
            </Pressable>
        </View>
    );
};

export default GoogleAuth;

const styles = StyleSheet.create({});