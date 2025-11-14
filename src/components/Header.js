import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform
} from 'react-native';

const Header = ({ onLogout, selectedDataset, onDatasetChange }) => {
  return (
    <SafeAreaView style={styles.header}>
      <View style={styles.headerInner}>
        <View style={styles.brandSection}>
          <Text style={styles.brandIcon}>🗳️</Text>
          <Text style={styles.titleMain}>Ward No. 8</Text>
          <View style={styles.titleUnderline} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 45,
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
    marginRight: 10,
  },
  brandIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  titleMain: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
    fontStyle: 'italic',
    transform: [{ skewX: '-3deg' }],
    textDecorationLine: 'none',
  },
  titleUnderline: {
    position: 'absolute',
    bottom: -8,
    left: 38,
    right: 0,
    height: 3,
    backgroundColor: '#FFD700',
    borderRadius: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
    transform: [{ skewX: '-2deg' }],
    opacity: 0.9,
    width: 120,
  },
});

export default Header;