import React, { useEffect } from 'react';
import { FlatList, View, Text, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { smartstore } from 'react-native-force';
import { database } from '../database';
import { UserSchema as Users } from '../database/models/UserSchema';

const dummyAdd = [{ "dob": "1998-30-06", "experience": "2", "gender": "Female", "maritalStatus": "Married", "mobile": "8240643961", "name": "smartstoredb" }]
import { Q } from '@nozbe/watermelondb';
import { useObservableState } from 'observable-hooks';



const UserList = () => {
    const [users, setUsers] = React.useState<{ id: any; name: any; gender: any; mobile: any }[]>([]);
    const [wmusers, setWMusers] = React.useState<{ id: any; name: any; gender: any; mobile: any }[]>([]);

    React.useEffect(() => {
        const fetchUsers = async () => {
            try {
                const querySpec = smartstore.buildAllQuerySpec('id', 'ascending', 1000);
                smartstore.querySoup(true, 'Users', querySpec, (cursor) => {
                    const userList = cursor.currentPageOrderedEntries.map((entry: any) => ({
                        id: entry.id,
                        name: entry.name,
                        gender: entry.gender,
                        mobile: entry.mobile,
                    }));
                    setUsers(userList);
                    smartstore.closeCursor(
                        true,
                        cursor,
                        () => console.log('Cursor closed'),
                        (err) => console.error('Error closing cursor:', err)
                    );
                }, (error) => {
                    console.error('Error querying soup:', error);
                });
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

     

        fetchUsers();
      
    }, []);

    useEffect(() => {
        const fetchWMUsers = async () => {
            const allUsers = await database.get<Users>('Users').query().fetch();
            setWMusers(allUsers);


            const wmCollection = database.get<Users>('Users');
            const wmUsers$ = wmCollection.query(Q.sortBy('name')).observe();
            
            const wmuserss = useObservableState(wmUsers$, []);
            setWMusers(wmuserss)
          };

          fetchWMUsers();
    },[wmusers])

    const renderItem = ({ item }: { item: typeof users[0] }) => (
        <View key={item.id} style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.gender}>{item.gender}</Text>
            <Text style={styles.mobile}>{item.mobile}</Text>
        </View>
    );
    const handleAdd = () => {
        // Logic to add a new user to the database

        const newUser = {
            name: dummyAdd[0]?.name,
            dob: dummyAdd[0]?.dob,
            gender: dummyAdd[0]?.gender,
            maritalStatus: dummyAdd[0]?.maritalStatus,
            experience: dummyAdd[0]?.experience,
            mobile: dummyAdd[0]?.mobile,
        };
        createUser();

        const querySpec = smartstore.buildExactQuerySpec('mobile', newUser.mobile, 10, 'ascending');

        smartstore.querySoup(
            true,
            "Users",
            querySpec,
            (cursor) => {
                if (cursor.currentPageOrderedEntries.length === 0) {
                    // No existing user with this mobile number — insert
                    smartstore.upsertSoupEntries(
                        true,
                        'Users',
                        [newUser],
                        (result) => console.log('User registered:', result),
                        (err) => console.error('Upsert error:', err)
                    );
                } else {
                    console.log('User with this mobile number already exists!');
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

    }
    const createUser = async () => {
        try {
            await database.write(async () => {
                await database.get<Users>('Users').create(user => {
                    user.name = "watermelon";
                    user.dob = "1998-30-06";
                    user.maritalStatus = "Single";
                    user.mobile = "8240643967";
                    user.experience =" 8";
                    user.gender = "Female";
                });
            });


            console.log('User saved successfully');
        } catch (error) {
            console.error('Failed to save user:', error);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <TouchableOpacity
                onPress={handleAdd}
                style={{
                maxWidth: '50%',
                width: '100%',
                padding: 10,
                backgroundColor: '#007BFF',
                borderRadius: 8,
                alignItems: 'center',
                }}
            >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Add to DB</Text>
            </TouchableOpacity>
            </View>

            <View style={{ flex: 1, flexDirection: 'row' }}>
            <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={[styles.container, { flex: 1 }]}
            />
            <FlatList
                data={wmusers}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={[styles.container, { flex: 1 }]}
            />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        backgroundColor: '#f9f9f9',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        marginBottom: 10,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    name: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    gender: {
        flex: 1,
        fontSize: 14,
        textAlign: 'center',
        color: '#555',
    },
    mobile: {
        flex: 1,
        fontSize: 14,
        textAlign: 'right',
        color: '#777',
    },
});

export default UserList;