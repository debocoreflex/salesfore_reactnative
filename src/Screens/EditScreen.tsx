import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Button, FlatList } from 'react-native';
import { database } from '../database';
import { UserSchema as Users } from '../database/models/UserSchema';
import { Q } from '@nozbe/watermelondb';
import { useObservableState } from 'observable-hooks';

const EditScreen = () => {

    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [editableUserId, setEditableUserId] = useState<string | null>(null);
    const [editedDetails, setEditedDetails] = useState({ email: '', phone: '' });
    // const [wmusers, setWMusers] = React.useState<{ id: any; name: any; gender: any; mobile: any }[]>([]);

    const wmCollection = database.get<Users>('Users');
    const wmUsers$ = wmCollection.query(Q.sortBy('name')).observe();

    const liveUsers = useObservableState(wmUsers$, []);

    const wmusers = liveUsers.map((it) => ({
        id: it.id,
        name: it.name,
        gender: it.gender,
        mobile: it.mobile,
    }));




    const handleExpand = (userId: string) => {
        setExpandedUserId(expandedUserId === userId ? null : userId);
        setEditableUserId(null);
    };


    const handleEdit = async (userId: string, user: any) => {
        if (editableUserId === userId) {
            try {
                // Persist to WatermelonDB
                await database.write(async () => {
                    const userToUpdate = await database.get<Users>('Users').find(userId);
                    await userToUpdate.update((u) => {
                        u.name = editedDetails.email;
                        u.mobile = editedDetails.phone;
                    });
                });

                console.log(`User ${userId} updated`);

                // UI cleanup
                setEditableUserId(null);
            } catch (error) {
                console.error(`Failed to update user ${userId}:`, error);
            }
        } else {
            // Enable editing
            setEditedDetails({ email: user.name, phone: user.mobile });
            setEditableUserId(userId);
        }
    };

    
    const handleDelete = async (id: string, item: any): Promise<void> => {
        try {
        await database.write(async () => {
            const userToDelete = await database.get<Users>('Users').find(id);
            await userToDelete.markAsDeleted(); // Soft delete
            //await userToDelete.destroyPermanently(); // Hard delete if needed
        });

        console.log(`User ${id} deleted`);
        } catch (error) {
        console.error(`Failed to delete user ${id}:`, error);
        }
    };


    const renderUser = ({ item }: { item: any }) => {
        const isExpanded = expandedUserId === item.id;
        const isEditable = editableUserId === item.id;


        return (
            <View style={styles.userContainer}>
                <TouchableOpacity onPress={() => handleExpand(item.id)}>
                    <Text style={styles.username}>{item.name}</Text>
                </TouchableOpacity>
                {isExpanded && (
                    <View style={styles.detailsContainer}>
                        <TextInput
                            style={styles.input}
                            value={isEditable ? editedDetails.email : item.name}
                            editable={isEditable}
                            onChangeText={(text) => setEditedDetails({ ...editedDetails, email: text })}
                        />
                        <TextInput
                            style={styles.input}
                            value={isEditable ? editedDetails.phone : item.mobile}
                            editable={isEditable}
                            onChangeText={(text) => setEditedDetails({ ...editedDetails, phone: text })}
                        />
                        <Button title={isEditable ? 'Submit' : 'Edit'} onPress={() => handleEdit(item.id, item)} />
                        <Button title={'Delete'} onPress={() => handleDelete(item.id, item)} />
                    </View>
                )}
            </View>
        );
    };

    return (
        <FlatList
            data={wmusers}
            keyExtractor={(item) => item.id}
            renderItem={renderUser}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
        />
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    userContainer: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    detailsContainer: {
        marginTop: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#FF0000",
        borderRadius: 4,
        padding: 8,
        marginVertical: 4,
    },
});

export default EditScreen;