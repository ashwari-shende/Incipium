// Database.js
import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = "Incipium.db"; 
const database_version = "1.0"; 
const database_displayname = "SQLite Incipium Database";
const database_size = 200000;

export const getDatabaseConnection = async () => {
  return SQLite.openDatabase({
    name: database_name,
    location: 'default',
  });
};

// Create Users Table
export const createUsersTable = async (db) => {
  await db.transaction((tx) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userName TEXT
        );`,
      [],
      () => console.log('Users table created successfully'),
      (error) => console.log('Error creating Users table: ', error)
    );
  });
};

// Insert User
export const insertUser = async (db, userName) => {
  return db.transaction((tx) => {
    tx.executeSql(
      'INSERT INTO Users (userName) VALUES (?);',
      [userName],
      (tx, results) => console.log('User added successfully'),
      (error) => console.log('Error inserting user: ', error)
    );
  });
};



// Get Users
export const getUsers = async (db) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM Users;',
        [],
        (tx, results) => {
          let len = results.rows.length;
          let users = [];
          for (let i = 0; i < len; i++) {
            let row = results.rows.item(i);
            users.push(row);
          }
          resolve(users);
        },
        (error) => reject(error)
      );
    });
  });
};

// Create Sentiments Table
export const createSentimentsTable = async (db) => {
  await db.transaction((tx) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Sentiments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          userName TEXT,
          textTranscription TEXT,
          polarity REAL,
          subjectivity REAL,
          emotion TEXT,
          sentimentType TEXT,
          timestamp TEXT,
          FOREIGN KEY(userId) REFERENCES Users(id)
        );`,
      [],
      () => console.log('Sentiments table created successfully'),
      (error) => console.log('Error creating Sentiments table: ', error)
    );
  });
};

// Insert Sentiment Data
export const insertSentiment = async (db, userId, userName, textTranscription, polarity, subjectivity, emotion, sentimentType, timestamp) => {
  return db.transaction((tx) => {
    tx.executeSql(
      `INSERT INTO Sentiments (userId, userName, textTranscription, polarity, subjectivity, emotion, sentimentType, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [userId, userName, textTranscription, polarity, subjectivity, emotion, sentimentType, timestamp],
      (tx, results) => console.log('Sentiment data added successfully'),
      (error) => console.log('Error inserting sentiment data: ', error)
    );
  });
};

// Get Sentiments for a specific user
export const getSentimentsForUser = async (db, userName) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM Sentiments WHERE userName = ?;',  // Adjust the query for user filtering
        [userName],  // Pass the userId as the query parameter
        (tx, results) => {
          let len = results.rows.length;
          let sentiments = [];
          for (let i = 0; i < len; i++) {
            let row = results.rows.item(i);
            sentiments.push(row);
          }
          resolve(sentiments);
        },
        (error) => reject(error)
      );
    });
  });
};
