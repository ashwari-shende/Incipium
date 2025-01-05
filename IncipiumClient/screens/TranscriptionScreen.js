import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Button, Text, Alert, ActivityIndicator, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import axios from 'axios';
import { getDatabaseConnection, insertSentiment } from './Database'; // Adjust the import based on your folder structure

// Get the correct server address based on the platform
//const serverAddress = Platform.OS === 'ios' ? 'http://127.0.0.1:5000' : 'http://10.0.2.2:5000';
const serverAddress = 'http:35.199.178.198:5000';

function TranscriptionScreen({ route }) {
  const { userId, userName, textTranscription } = route.params;
  const navigation = useNavigation();
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);

  const analyzeSentimentBlob = async () => {
    try {
      const response = await axios.post(`${serverAddress}/analyze-sentiment-blob`, {
        textTranscription
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = response.data;
      setSentiment(data);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      Alert.alert('Error', 'Failed to analyze sentiment.');
    } finally {
      setLoading(false);
    }
  };

  const saveSentimentToSQLite = async () => {
    const timestamp = new Date().toISOString();
    const db = await getDatabaseConnection();

    try {
      await insertSentiment(
        db,
        userId,
        userName,
        textTranscription,
        sentiment.polarity,
        sentiment.subjectivity,
        sentiment.emotion,
        sentiment.sentiment_type,
        timestamp
      );
      Alert.alert('Success', 'Sentiment data saved successfully!');
    } catch (error) {
      console.error('Error saving sentiment data to SQLite:', error);
      Alert.alert('Error', 'Failed to save sentiment data.');
    }
  };

  useEffect(() => {
    analyzeSentimentBlob();
  }, []);

  useEffect(() => {
    if (sentiment) {
      saveSentimentToSQLite();
    }
  }, [sentiment]);

  return (
    <View style={styles.container}>
      {/* Transcription Section */}
      <View style={styles.section}>
        <Text style={styles.title}>Transcription</Text>
        <Text style={styles.text}>{textTranscription}</Text>
      </View>

      {/* Sentiment Results Section */}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : sentiment ? (
        <View style={styles.section}>
          <Text style={styles.title}>Sentiment Results</Text>
          
          <View style={styles.sentimentBox}>
            <Text style={styles.boxText}>Polarity: {sentiment.polarity}</Text>
          </View>
          <View style={styles.sentimentBox}>
            <Text style={styles.boxText}>Subjectivity: {sentiment.subjectivity}</Text>
          </View>
          <View style={styles.sentimentBox}>
            <Text style={styles.boxText}>Emotion: {sentiment.emotion}</Text>
          </View>
          <View style={styles.sentimentBox}>
            <Text style={styles.boxText}>Sentiment Type: {sentiment.sentiment_type}</Text>
          </View>
        </View>
      ) : (
        <Text>No sentiment data available.</Text>
      )}

      {/* See Sentiment Dashboard Button */}
      <TouchableOpacity
        style={styles.dashboardButton}
        onPress={() => navigation.navigate('Dashboard', {
          userId: userId, 
          userName: userName
        })}
      >
        <Text style={styles.buttonText}>See Sentiment Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  sentimentBox: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  boxText: {
    fontSize: 16,
  },
  dashboardButton: {
    backgroundColor: '#8B4513', // Brown button
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TranscriptionScreen;
