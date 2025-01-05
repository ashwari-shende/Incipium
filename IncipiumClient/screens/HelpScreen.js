// HelpScreen.js
import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';

const HelpScreen = () => {
  const links = [
    {
      title: 'National Suicide Prevention Lifeline',
      url: 'https://suicidepreventionlifeline.org/',
    },
    {
      title: 'Crisis Text Line',
      url: 'https://www.crisistextline.org/',
    },
    {
      title: 'Teen Line',
      url: 'https://www.teenline.org/',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Get Help</Text>
      <Text style={styles.description}>If you're feeling distressed or in crisis, reach out for support:</Text>
      {links.map((link, index) => (
        <TouchableOpacity 
          key={index} 
          onPress={() => Linking.openURL(link.url)}
          style={styles.button} // Apply button styles
        >
          <Text style={styles.buttonText}>{link.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#5e3908', // Light brown background color
    padding: 15,
    borderRadius: 8, // Rounded corners
    marginBottom: 10,
    alignItems: 'center', // Center the text
  },
  buttonText: {
    fontSize: 16,
    color: '#fff', // White text color
  },
});

export default HelpScreen;
