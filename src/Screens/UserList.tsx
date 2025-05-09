import React, { useCallback, useEffect } from 'react';
import { FlatList, View, Text, StyleSheet, Button, TouchableOpacity, ScrollView } from 'react-native';
import { smartstore } from 'react-native-force';
import { database } from '../database';
import { UserSchema as Users } from '../database/models/UserSchema';

// const dummyAdd = [{ "dob": "1998-30-06", "experience": "2", "gender": "Female", "maritalStatus": "Married", "mobile": "8240643961", "name": "smartstoredb" }]
const dummyAdd = Array.from({ length: 100 }, (_, i) => ({
    name: `User ${i + 1}`,
    dob: "1998-06-30",
    experience: `${(i % 10) + 1}`,
    gender: i % 2 === 0 ? "Female" : "Male",
    maritalStatus: i % 3 === 0 ? "Married" : "Single",
    mobile: `82406439${String(60 + i).padStart(2, '0')}`,
}));

import { Q } from '@nozbe/watermelondb';




const UserList = () => {
    const [users, setUsers] = React.useState<{ id: any; name: any; gender: any; mobile: any }[]>([]);
    const [wmusers, setWMusers] = React.useState<{ id: any; name: any; gender: any; mobile: any }[]>([]);

    React.useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = useCallback(() => {
        const querySpec = smartstore.buildAllQuerySpec('id', 'ascending', 1000);
        smartstore.querySoup(true, 'Users', querySpec, (cursor) => {
            const userList = cursor.currentPageOrderedEntries.map((entry: any) => ({
                id: entry.id,
                name: entry.name,
                gender: entry.gender,
                mobile: entry.mobile,
            }));
            setUsers(userList);
            smartstore.closeCursor(true, cursor, () => { }, console.error);
        }, console.error);
    }, []);


    useEffect(() => {
        const wmCollection = database.get<Users>('Users');
        const wmUsers$ = wmCollection.query(Q.sortBy('name')).observe();
        const subscription = wmUsers$.subscribe(setWMusers);

        return () => subscription.unsubscribe(); // Cleanup on unmount
    }, []);


    const renderItem = ({ item }: { item: typeof users[0] }) => (
        <View key={item.id} style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.gender}>{item.gender}</Text>
            <Text style={styles.mobile}>{item.mobile}</Text>
        </View>
    );
 
    const handleAdd = () => {
        let insertCount = 0;
        dummyAdd.forEach((user, index) => {
            createUser(user); // WatermelonDB insert

            const querySpec = smartstore.buildExactQuerySpec('mobile', user.mobile, 1, 'ascending');
            smartstore.querySoup(true, "Users", querySpec, (cursor) => {
                if (cursor.currentPageOrderedEntries.length === 0) {
                    smartstore.upsertSoupEntries(true, 'Users', [user], () => {
                        insertCount++;
                        if (insertCount === dummyAdd.length) {
                            fetchUsers(); // Refresh SmartStore list only once after last insert
                        }
                    }, console.error);
                }

                smartstore.closeCursor(
                    true,
                    cursor,
                    () => console.log('Cursor closed successfully'),
                    (err) => console.error('Error closing cursor:', err)
                );
            }, console.error);
        });
    };


    // const createUser = async () => {
    //     try {
    //         await database.write(async () => {
    //             await database.get<Users>('Users').create(user => {
    //                 user.name = "watermelon";
    //                 user.dob = "1998-30-06";
    //                 user.maritalStatus = "Single";
    //                 user.mobile = "8240643967";
    //                 user.experience =" 8";
    //                 user.gender = "Female";
    //             });
    //         });


    //         console.log('User saved successfully');
    //     } catch (error) {
    //         console.error('Failed to save user:', error);
    //     }
    // };
    const createUser = async (user: {
        name: string;
        dob: string;
        maritalStatus: string;
        mobile: string;
        experience: string;
        gender: string;
    }) => {
        try {
            await database.write(async () => {
                await database.get<Users>('Users').create(newUser => {
                    newUser.name = user.name;
                    newUser.dob = user.dob;
                    newUser.maritalStatus = user.maritalStatus;
                    newUser.mobile = user.mobile;
                    newUser.experience = user.experience;
                    newUser.gender = user.gender;
                });
            });

            console.log(`WatermelonDB: Saved user ${user.name}`);
        } catch (error) {
            console.error(`Failed to save user ${user.name}:`, error);
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
            <View style={{ flexDirection: 'row', paddingHorizontal: 10 }}>
                <Text style={{ flex: 1, fontWeight: 'bold' }}>SmartStore</Text>
                <Text style={{ flex: 1, fontWeight: 'bold' }}>WatermelonDB</Text>
            </View>

            <View style={{ flex: 1, flexDirection: 'row' }}>
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.container}
                    />
                </View>

                <View style={{ flex: 1 }}>
                    <FlatList
                        data={wmusers}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.container}
                    />
                </View>
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