import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';

export default function BackToDashboard({ navigation, children = 'Back to Dashboard' }) {
  const handlePress = () => {
    if (navigation) {
      navigation.navigate('Dashboard');
    }
  };

  return (
    <TouchableOpacity style={styles.backButton} onPress={handlePress}>
      <View style={styles.backContent}>
        <Text style={styles.backEmoji}>🏠</Text>
        <Text style={styles.backText}>{children}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  backContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  backText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
