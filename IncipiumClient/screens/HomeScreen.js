import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TextInput, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { getDatabaseConnection, createUsersTable, createSentimentsTable, insertUser, getUsers } from './Database';

function HomeScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [userChoice, setUserChoice] = useState(null); // 'anonymous' or 'personalized'
  const [userList, setUserList] = useState([]);
  const [db, setDb] = useState(null);

  useEffect(() => {
    const initDb = async () => {
      try {
        const dbConnection = await getDatabaseConnection();
        if (dbConnection) {
          setDb(dbConnection);
          await createUsersTable(dbConnection);
          await createSentimentsTable(dbConnection);
          const users = await getUsers(dbConnection);
          setUserList(users);
        }
      } catch (error) {
        console.error("Error initializing the database:", error);
      }
    };

    initDb();

    return () => {
      if (db) {
        db.close();
      }
    };
  }, []);

  const addNewUser = async (userChoice) => {
    let newUser;

    if (userChoice === 'anonymous') {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      newUser = `Anonymous${randomId}`;
    } else if (userChoice === 'personalized' && newUserName.trim()) {
      newUser = newUserName;
    }

    if (newUser) {
      await insertUser(db, newUser);
      const users = await getUsers(db);
      setUserList(users);
    }

    setModalVisible(false);
    setNewUserName('');
    setUserChoice(null);
  };

  const handleAnonymousCreation = () => {
    setUserChoice('anonymous');
    console.log("Inside Anonymous :", userChoice);
    addNewUser('anonymous');
  };

  const handlePersonalizedCreation = () => {
    setUserChoice('personalized');
  };

  const handleSubmitPersonalized = () => {
    if (newUserName.trim()) {
      addNewUser('personalized');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Incipium</Text>

      <FlatList
        data={userList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.userButton}>
            <Button
              title={item.userName}
              onPress={() => navigation.navigate('RecordMemo', { userId: item.id, userName: item.userName })}
            />
          </View>
        )}
      />

      <TouchableOpacity style={styles.addUserButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addUserButtonText}>Add User</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Create New User</Text>

          <View style={styles.buttonMargin}>
            <Button
              title="Create Anonymous ID"
              onPress={handleAnonymousCreation}
            />
          </View>

          <View style={styles.buttonMargin}>
            <Button
              title="Create Personalized ID"
              onPress={handlePersonalizedCreation}
            />
          </View>

          {userChoice === 'personalized' && (
            <>
              <Text>Enter a personalized name:</Text>
              <TextInput
                placeholder="Enter Name"
                value={newUserName}
                onChangeText={setNewUserName}
                style={styles.textInput}
              />
              <Button
                title="Submit"
                onPress={handleSubmitPersonalized}
              />
            </>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// Styles added below
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  addUserButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
  },
  addUserButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  textInput: {
    borderBottomWidth: 1,
    marginBottom: 20,
    width: 200,
    padding: 10,
  },
  cancelButton: {
    backgroundColor: '#FF6347',
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    width: 100,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Add margin to each user button in the FlatList
  userButton: {
    marginBottom: 10, // Space between user buttons
  },
  // Add margin to the "Create Anonymous ID" and "Create Personalized ID" buttons
  buttonMargin: {
    marginBottom: 15, // Space between the buttons in the modal
  }
});

export default HomeScreen;
