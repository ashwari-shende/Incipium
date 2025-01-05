import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import axios from 'axios';
import { View, Text, Button, FlatList, StyleSheet, Alert, TouchableOpacity, Platform, PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';

// Get the correct server address based on the platform
//const serverAddress = Platform.OS === 'ios' ? 'http://127.0.0.1:5000' : 'http://10.0.2.2:5000';
const serverAddress = 'http:35.199.178.198:5000';

// Initialize Audio recorder that will be used to record in the App
const audioRecorderPlayer = new AudioRecorderPlayer();

const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      // For Android 10 and above, we don't need storage permissions for app-specific storage
      if (Platform.Version >= 29) {
        const recordPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to record audio',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        return recordPermission === PermissionsAndroid.RESULTS.GRANTED;
      }
      // For Android 9 and below, request all permissions
      else {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        console.log('Permission results:', granted);

        return Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
      }
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  }
  return true; // iOS doesn't need these permissions
};

function RecordMemoScreen({ route }) {
  const { userId, userName } = route.params;
  const navigation = useNavigation();

  const [showTextList, setShowTextList] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedUri, setRecordedUri] = useState('');
  const [transcription, setTranscription] = useState('');

  const textList = [
    { key: '1', value: 'How are you feeling today?' },
    { key: '2', value: 'Can you tell me about something positive that happened to you this week?' },
    { key: '3', value: 'How would you rate your overall mood on a scale from 1 to 10?' },
    { key: '4', value: 'Have you felt more anxious or stressed than usual recently?' },
    { key: '5', value: 'Do you feel like you’ve been able to manage stressful things recently, how difficult has that been for you?' },
    { key: '6', value: 'Can you describe any recent changes in your sleep patterns?' },
    { key: '7', value: 'How often do you interact with other people during the week?' },
    { key: '8', value: 'Can you share an experience from this week where you felt supported or connected?' },
    { key: '9', value: 'What is the most prominent and recognizable emotion you feel right now?' }
  ];

  useEffect(() => {
    // Initialize audio recorder
    const initRecorder = async () => {
      await audioRecorderPlayer.setSubscriptionDuration(0.1); // Optional: for more frequent updates
    };
    
    initRecorder();
  
    // Cleanup
    return () => {
      const cleanup = async () => {
        if (isRecording) {
          await audioRecorderPlayer.stopRecorder();
        }
        if (isPlaying) {
          await audioRecorderPlayer.stopPlayer();
        }
        audioRecorderPlayer.removeRecordBackListener();
        audioRecorderPlayer.removePlayBackListener();
      };
      cleanup();
    };
  }, []);

  const toggleTextList = () => {
    setShowTextList(!showTextList);
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Microphone permission is required to record audio');
        return;
      }
  
      const fileName = `recording_${Date.now()}.m4a`;
      
      // Use app-specific directory instead of external storage
      const path = Platform.select({
        ios: `${RNFS.DocumentDirectoryPath}/${fileName}`,
        android: `${RNFS.CachesDirectoryPath}/${fileName}` // or RNFS.DocumentDirectoryPath
      });
  
      console.log('Recording path:', path);
  
      const uri = await audioRecorderPlayer.startRecorder(path);
      console.log('Recording started:', uri);
      
      setRecordedUri(uri);
      setIsRecording(true);
  
      audioRecorderPlayer.addRecordBackListener((e) => {
        console.log('Recording progress:', e.currentPosition);
      });
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to start recording: ' + error.message);
    }
  };  

  const stopRecording = async () => {
    try {
      await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      setTranscription(''); // Reset transcription when stopping recording
      console.log('Recording stopped, uri:', recordedUri);
    } catch (error) {
      console.error(error);
    }
  };
  

  const startPlaying = async () => {
    try {
      console.log('Starting playback with uri:', recordedUri);
      
      // Check if file exists before playing
      const exists = await RNFS.exists(recordedUri);
      console.log('File exists before playback:', exists);
  
      if (!exists) {
        Alert.alert('Error', 'Recording file not found');
        return;
      }
  
      await audioRecorderPlayer.startPlayer(recordedUri);
      
      audioRecorderPlayer.addPlayBackListener((e) => {
        if (e.currentPosition === e.duration) {
          console.log('Playback finished');
          stopPlaying();
        }
      });
      
      setIsPlaying(true);
    } catch (error) {
      console.error('Playback error:', error);
      Alert.alert('Playback Error', error.message);
    }
  };
    
  const stopPlaying = async () => {
    try {
      await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
      setIsPlaying(false);
    } catch (error) {
      console.error(error);
    }
  };

  const transcribeAudio = async () => {
    if (!recordedUri) {
      Alert.alert('No recording to transcribe');
      return;
    }

    const formData = new FormData();
    formData.append('file', {
      uri: recordedUri,
      type: 'audio/m4a',
      name: 'sound.m4a',
    });

    try {
      console.log('Transcribe:', formData);
      const response = await axios.post(`${serverAddress}/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTranscription(response.data.transcription);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      console.error('Error details:', error.toJSON());
      Alert.alert('Error', 'Failed to transcribe audio.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio Recorder</Text>

      {/* Toggle Button for dropdown */}
      <TouchableOpacity style={styles.dropdownButton} onPress={toggleTextList}>
        <Text style={styles.buttonText}>{showTextList ? 'Hide Prompt List' : 'Show Prompt List'}</Text>
      </TouchableOpacity>

      {/* Display FlatList only if showTextList is true */}
      {showTextList && (
        <FlatList
          data={textList}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <View style={styles.textItem}>
              <Text>{item.value}</Text>
            </View>
          )}
        />
      )}

      {/* Recording Buttons */}
      <TouchableOpacity
        style={isRecording ? styles.stopButton : styles.startButton}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Text>
      </TouchableOpacity>

      {/* Play Button */}
      {recordedUri ? (
        <Button
          title={isPlaying ? 'Stop Playing' : 'Play Recording'}
          onPress={isPlaying ? stopPlaying : startPlaying}
        />
      ) : (
        <Text>No recording yet</Text>
      )}

      {/* Conditionally render Transcribe OR Analyze Sentiment button */}
      {recordedUri && (
        <View style={styles.buttonRow}>
          {!transcription ? (
            <TouchableOpacity style={styles.greyButton} onPress={transcribeAudio}>
              <Text style={styles.buttonText}>Transcribe</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.greyButton}
              onPress={() =>
                navigation.navigate('Sentiment', {
                  userId: userId,
                  userName: userName,
                  textTranscription: transcription,
                })
              }
            >
              <Text style={styles.buttonText}>Analyze Sentiment</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* New Button to Navigate to Dashboard */}
      <TouchableOpacity
        style={styles.dashboardButton}
        onPress={() => navigation.navigate('Dashboard', { userId: userId, userName: userName })}
      >
        <Text style={styles.buttonText}>Go to Dashboard</Text>
      </TouchableOpacity>

      {/* Display Transcription Result */}
      {transcription ? (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionText}>{transcription}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  textItem: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  dropdownButton: {
    backgroundColor: '#392b0f', // darkish brown color for the dropdown Prompt button
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50', // Green button for start recording
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#FF6347', // Red button for stop recording
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  greyButton: {
    backgroundColor: '#5e3908', // Colors for both Transcribe and Analyze Sentiment buttons
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  dashboardButton: {
    backgroundColor: '#007BFF', // Blue button for navigating to Dashboard
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
    alignItems: 'center',
  },
  transcriptionContainer: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  transcriptionText: {
    fontSize: 16,
  },
});

export default RecordMemoScreen;
