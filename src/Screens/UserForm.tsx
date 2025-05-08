import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { indexSpecs, soupName } from '../utils/dummies';
import { smartstore } from 'react-native-force';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

const UserForm: React.FC = () => {
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [maritalStatus, setMaritalStatus] = useState('');
    const [experience, setExperience] = useState('');
    const [gender, setGender] = useState('');
    const [mobile, setMobile] = useState('');
    const navigation = useNavigation();

    const handleSubmit = () => {
        console.log({ name, dob, maritalStatus, experience, gender, mobile });
        const newUser = {
            name,
            dob,
            gender,
            maritalStatus,
            experience,
            mobile
        };



        const querySpec = smartstore.buildExactQuerySpec('mobile', mobile, 10, 'ascending');

        smartstore.querySoup(
            true,
            soupName,
            querySpec,
            (cursor) => {
                if (cursor.currentPageOrderedEntries.length === 0) {
                    // No existing user with this mobile number — insert
                    smartstore.upsertSoupEntries(
                        true,
                        soupName,
                        [newUser],
                        (result) => console.log('User registered:', result),
                        (err) => console.error('Upsert error:', err)
                    );
                } else {
                    console.log('User with this mobile number already exists!');
                   getAllUsers();
                   
                }

                smartstore.closeCursor(
                    true,
                    cursor,
                    () => console.log('Cursor closed successfully'),
                    (err) => console.error('Error closing cursor:', err)
                );
            },
            (err) => console.error('Query error:', err)
        );

    };

    const handleNext = () => {
     
         navigation.navigate('UserList');
    };
    const getAllUsers = () => {
        const soupName = 'Users';
    
        // Query all users sorted by name, adjust page size as needed
        const querySpec = smartstore.buildAllQuerySpec('mobile', 'ascending', 100);
    
        smartstore.querySoup(
            true, // Global store
            soupName,
            querySpec,
            (cursor) => {
                const records = cursor.currentPageOrderedEntries;
                console.log('All users:', records);
    
                // Optional: update state if using React hooks
                // setUsers(records);
    
                // Close the cursor
                smartstore.closeCursor(
                    true,
                    cursor,
                    () => console.log('Cursor closed after full list fetch'),
                    (err) => console.error('Error closing cursor:', err)
                );
            },
            (err) => console.error('Error fetching all users:', err)
        );
    };
  
    

    useEffect(() => {
        smartstore.registerSoup(
            true,
            soupName,
            indexSpecs,
            () => console.log('Soup registered with mobile number'),
            (err) => console.error('Error registering soup:', err)
        );
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Name</Text>
            <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            />

            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
            style={styles.input}
            value={dob}
            onChangeText={setDob}
            placeholder="YYYY-MM-DD"
            />

            <Text style={styles.label}>Marital Status</Text>
            <Picker
            selectedValue={maritalStatus}
            style={styles.input}
            onValueChange={(itemValue) => setMaritalStatus(itemValue)}
            >
            <Picker.Item label="Select" value="" />
            <Picker.Item label="Single" value="Single" />
            <Picker.Item label="Married" value="Married" />
            </Picker>

            <Text style={styles.label}>Total Experience (in years)</Text>
            <TextInput
            style={styles.input}
            value={experience}
            onChangeText={setExperience}
            placeholder="Enter your experience"
            keyboardType="numeric"
            />

            <Text style={styles.label}>Gender</Text>
            <Picker
            selectedValue={gender}
            style={styles.input}
            onValueChange={(itemValue) => setGender(itemValue)}
            >
            <Picker.Item label="Select" value="" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
            </Picker>

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
            style={styles.input}
            value={mobile}
            onChangeText={setMobile}
            placeholder="Enter your mobile number"
            keyboardType="numeric"
            />

            <Button title="Submit" onPress={handleSubmit} />

            <View style={{ marginTop: 10 }}>
            <Button title="Next Page" onPress={handleNext} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
    },
});

export default UserForm;