import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, ScrollView, Alert } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getDatabaseConnection, getSentimentsForUser } from './Database';

function DashboardScreen({ route, navigation }) {
  const { userId, userName } = route.params;
  const [sentiments, setSentiments] = useState([]);
  const [loading, setLoading] = useState(true);
  let dbConnection = null;

  useEffect(() => {
    const initDb = async () => {
      try {
        dbConnection = await getDatabaseConnection();
        if (dbConnection) {
          const retrievedSentiments = await getSentimentsForUser(dbConnection, userName);
          console.log(retrievedSentiments); // Log the retrieved sentiments for debugging
          setSentiments(retrievedSentiments);
          checkNegativeTrend(retrievedSentiments); // Check for negative trend after loading sentiments
        }
      } catch (error) {
        console.error('Error initializing the database:', error);
      } finally {
        setLoading(false);
      }
    };

    initDb();

    return () => {
      if (dbConnection) {
        dbConnection.close();
      }
    };
  }, [userName]);

  // Function to check for a negative trend
  const checkNegativeTrend = (sentiments) => {
    let negativeStreak = 0;
    for (let i = sentiments.length - 1; i >= 0; i--) {
      if (sentiments[i].sentimentType === 'Negative') {
        negativeStreak++;
      } else {
        negativeStreak = 0; // Reset the streak if a non-negative sentiment is found
      }
      if (negativeStreak >= 5) {
        Alert.alert(
          'Warning',
          'There is a negative trend in your emotional state.',
          [
            {
              text: 'Get Help',
              onPress: () => navigation.navigate('Help'), // Navigate to HelpScreen
            },
            { text: 'OK' }
          ]
        );
        break;
      }
    }
};


  const sentimentTypeToValue = (sentimentType) => {
    if (sentimentType === 'Negative') return 0; // Negative
    if (sentimentType === 'Neutral') return 1; // Neutral
    if (sentimentType === 'Positive') return 2; // Positive
    return null;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-based
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
  };

  const renderSentimentItem = ({ item }) => (
    <View style={styles.sentimentContainer}>
      <Text style={styles.sentimentLabel}>Emotion:</Text>
      <Text style={styles.sentimentValue}>{item.emotion || 'No emotion found'}</Text>

      <Text style={styles.sentimentLabel}>Sentiment Type:</Text>
      <Text style={styles.sentimentValue}>{item.sentimentType || 'No sentiment type found'}</Text>

      <Text style={styles.sentimentLabel}>Polarity:</Text>
      <Text style={styles.sentimentValue}>{item.polarity !== undefined ? item.polarity : 'No polarity found'}</Text>

      <Text style={styles.sentimentLabel}>Subjectivity:</Text>
      <Text style={styles.sentimentValue}>{item.subjectivity !== undefined ? item.subjectivity : 'No subjectivity found'}</Text>

      <Text style={styles.sentimentLabel}>Date:</Text>
      <Text style={styles.sentimentValue}>{item.timestamp || 'No date available'}</Text>
    </View>
  );

  // Extract sentiment types and formatted timestamps to be plotted
  const sentimentsY = sentiments.map(sentiment => sentimentTypeToValue(sentiment.sentimentType));
  const timestamps = sentiments.map(sentiment => 
    sentiment.timestamp ? formatDate(sentiment.timestamp) : ''
  );

  // Calculate the width dynamically based on the number of timestamps
  const chartWidth = Math.max(Dimensions.get('window').width, timestamps.length * 60);

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>
        Welcome {userName}, to your comprehensive sentiment dashboard!
      </Text>

      {loading ? (
        <Text style={styles.loadingText}>Loading sentiments...</Text>
      ) : sentiments.length > 0 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <ScrollView horizontal={true}>
            <LineChart
              data={{
                labels: timestamps, // Use formatted timestamps (MM/DD)
                datasets: [
                  {
                    data: sentimentsY, // Plot sentiment types on the Y-axis
                  },
                ],
              }}
              width={chartWidth} // Make the chart width dynamic
              height={300} // Increase the height for better visibility
              yAxisLabel=""
              yAxisSuffix=""
              yAxisInterval={1} // Ensure only 1-step increments between points
              chartConfig={{
                backgroundColor: '#c7a17a', // Light brown color for the background
                backgroundGradientFrom: '#d1b290', // Lighter gradient start
                backgroundGradientTo: '#c8a582', // Darker gradient end
                decimalPlaces: 0, // No decimals for sentiment types
                color: (opacity = 1) => `rgba(102, 51, 0, ${opacity})`, // Dark brown line color
                labelColor: (opacity = 1) => `rgba(51, 25, 0, ${opacity})`, // Darker label color
                style: {
                  borderRadius: 16,
                  paddingVertical: 10, // Add vertical padding to ensure full view of the graph
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#a37551', // Light brown stroke for the dots
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              fromZero={true} // Start Y-axis from zero
              withInnerLines={false} // Remove additional Y-axis lines
              withHorizontalLabels={true} // Show horizontal Y-axis labels
              verticalLabelRotation={45} // Rotate X-axis labels for readability
              formatYLabel={(value) => {
                // Format Y-label to show 'Negative', 'Neutral', 'Positive'
                if (value == 0) return 'Negative';
                if (value == 1) return 'Neutral';
                if (value == 2) return 'Positive';
                return ''; // Don't show other labels
              }}
              yLabelsOffset={-5} // Adjust Y-labels position
              yAxisLabelInterval={1} // Set interval for Y-axis labels
              yAxisLabelFormat={(value) => {
                // Only display labels for specific values
                if (value === 0) return 'Negative';
                if (value === 1) return 'Neutral';
                if (value === 2) return 'Positive';
                return ''; // Don't display other labels
              }}
            />
          </ScrollView>

          <FlatList
            data={sentiments}
            renderItem={renderSentimentItem}
            keyExtractor={(item, index) => index.toString()}
          />
        </ScrollView>
      ) : (
        <Text style={styles.noDataText}>No sentiments found for {userName}.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sentimentContainer: {
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sentimentLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sentimentValue: {
    fontSize: 16,
    marginBottom: 5,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  noDataText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
});

export default DashboardScreen;
