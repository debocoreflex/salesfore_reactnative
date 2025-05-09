import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { database } from './database';
import { smartstore } from 'react-native-force';

const HelloScreen = () => {
    const navigation = useNavigation();

    const navigateToMainPage = () => {
        navigation.navigate("UserForm"); // Replace 'MainPage' with your actual route name
    };

    useEffect(() => {
        database.adapter.unsafeResetDatabase().then(() => {
          console.log('Database reset complete.');
        });

        smartstore.removeSoup(
            true,
            'Users', // Replace with your soup name
            () => console.log('Soup deleted successfully'),
            (err) => console.error('Failed to delete soup:', err)
          );
      }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Welcome, this app is created by Deb</Text>
            <View style={styles.buttonContainer}>
                <Button title="Go to Main Page" onPress={navigateToMainPage} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    buttonContainer: {
        marginTop: 10,
    },
});

export default HelloScreen;