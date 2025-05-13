import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, InteractionManager } from 'react-native';
import { smartstore } from 'react-native-force';
import { database } from '../database';
import { UserSchema as Users } from '../database/models/UserSchema';
import { Q } from '@nozbe/watermelondb';
import { SmartStoreObserver } from '../smartstore/SmartStoreObserver';

const PAGE_SIZE = 20;

interface UserInput {
  name: string;
  dob: string;
  maritalStatus: string;
  mobile: string;
  experience: string;
  gender: string;
}

const dummyAdd: UserInput[] = Array.from({ length: 10000 }, (_, i) => ({
  name: `User ${i + 1}`,
  dob: '1998-06-30',
  experience: `${(i % 10) + 1}`,
  gender: i % 2 === 0 ? 'Female' : 'Male',
  maritalStatus: i % 3 === 0 ? 'Married' : 'Single',
  mobile: `82406439${String(60 + i).padStart(4, '0')}`,
}));

const UserList: React.FC = () => {
  const [users, setUsers] = useState<{ id: string; name: string; gender: string; mobile: string }[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const renderTimers = useRef(new Map<string, number>());

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
      smartstore.closeCursor(true, cursor, () => {}, console.error);
    }, console.error);
  }, []);

  useEffect(() => {
    fetchUsers();
    const unsubscribe = SmartStoreObserver.subscribe(fetchUsers);
    return unsubscribe;
  }, [fetchUsers]);

  const renderItem = useCallback(
    ({ item }: { item: typeof users[0] }) => (
      <View key={item.id} style={styles.row}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.gender}>{item.gender}</Text>
        <Text style={styles.mobile}>{item.mobile}</Text>
      </View>
    ),
    []
  );

  const handleEndReached = () => {
    if (visibleCount < users.length) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, users.length));
    }
  };

//   const handleAdd = () => {
//     InteractionManager.runAfterInteractions(() => {
//       insertInChunks(dummyAdd);
//     });
//   };
  const handleAdd = () => {
  InteractionManager.runAfterInteractions(async () => {
    const startTime = performance.now();
    console.log('Insertion started...');

    await insertInChunks(dummyAdd);

    const endTime = performance.now();
    const totalTime = (endTime - startTime) / 1000; // in seconds

    console.log(`✅ Insertion completed in ${totalTime.toFixed(2)} seconds`);
  });
};


  const createUsersBatch = async (usersBatch: UserInput[]) => {
    try {
      await database.write(async () => {
        const userCollection = database.get<Users>('Users');
        for (const user of usersBatch) {
          await userCollection.create((newUser) => {
            newUser.name = user.name;
            newUser.dob = user.dob;
            newUser.maritalStatus = user.maritalStatus;
            newUser.mobile = user.mobile;
            newUser.experience = user.experience;
            newUser.gender = user.gender;
          });
        }
      });
    } catch (e) {
      console.error('Batch insert error:', e);
    }
  };

  const batchUpsertToSmartStore = (usersBatch: UserInput[]) => {
    const soupEntriesToInsert: UserInput[] = [];
    let pending = usersBatch.length;

    usersBatch.forEach((user) => {
      const querySpec = smartstore.buildExactQuerySpec('mobile', user.mobile, 1, 'ascending');
      smartstore.querySoup(true, 'Users', querySpec, (cursor) => {
        if (cursor.currentPageOrderedEntries.length === 0) {
          soupEntriesToInsert.push(user);
        }
        smartstore.closeCursor(true, cursor, () => {}, console.error);
        if (--pending === 0 && soupEntriesToInsert.length > 0) {
          SmartStoreObserver.upsert(soupEntriesToInsert);
        }
      }, console.error);
    });
  };

  const insertInChunks = async (allUsers: UserInput[]) => {
    const chunkSize = 100;
    for (let i = 0; i < allUsers.length; i += chunkSize) {
      const chunk = allUsers.slice(i, i + chunkSize);
      renderTimers.current.set(chunk[0].name, performance.now());
      await createUsersBatch(chunk);
      batchUpsertToSmartStore(chunk);
      await new Promise((res) => setTimeout(res, 100));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ alignItems: 'center', marginBottom: 10 }}>
        <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add to DB</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={users.slice(0, visibleCount)}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.container}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={5}
        ListFooterComponent={
          visibleCount < users.length ? (
            <Text style={styles.loadingText}>Loading more...</Text>
          ) : null
        }
      />
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
  addButton: {
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    width: '50%',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    padding: 10,
    color: '#666',
  },
});

export default UserList;
