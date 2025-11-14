import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import firebaseService from '../services/firebaseService';

/**
 * Firebase Test Component
 * Use this to test if Firebase is properly configured
 */
const FirebaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  const testFirebaseConnection = async () => {
    try {
      const isConnected = await firebaseService.testConnection();
      setConnectionStatus(isConnected ? '✅ Connected' : '❌ Not Connected');
      addTestResult('Connection Test', isConnected ? 'PASSED' : 'FAILED');
    } catch (error) {
      setConnectionStatus('❌ Error: ' + error.message);
      addTestResult('Connection Test', 'FAILED: ' + error.message);
    }
  };

  const addTestResult = (testName, result) => {
    setTestResults(prev => [...prev, { testName, result, timestamp: new Date().toLocaleTimeString() }]);
  };

  const testWriteData = async () => {
    try {
      const testDatasetId = 101;
      const testVoterId = 'test123';
      const result = await firebaseService.saveVoterStatus(testDatasetId, testVoterId, '#28a745');
      
      if (result.success) {
        addTestResult('Write Data', 'PASSED');
        Alert.alert('Success', 'Data written to Firebase successfully!');
      } else {
        addTestResult('Write Data', 'FAILED: ' + result.error);
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      addTestResult('Write Data', 'FAILED: ' + error.message);
      Alert.alert('Error', error.message);
    }
  };

  const testReadData = async () => {
    try {
      const testDatasetId = 101;
      const testVoterId = 'test123';
      const data = await firebaseService.getVoterStatus(testDatasetId, testVoterId);
      
      if (data) {
        addTestResult('Read Data', 'PASSED - Value: ' + data);
        Alert.alert('Success', 'Data read from Firebase: ' + data);
      } else {
        addTestResult('Read Data', 'No data found (this is OK if no test data exists)');
        Alert.alert('Info', 'No test data found');
      }
    } catch (error) {
      addTestResult('Read Data', 'FAILED: ' + error.message);
      Alert.alert('Error', error.message);
    }
  };

  const testBatchWrite = async () => {
    try {
      const testDatasetId = 101;
      const votersData = {
        'test1': { status: '#28a745', mobile: '9876543210' },
        'test2': { status: '#ffc107', mobile: '9876543211' },
        'test3': { status: '#dc3545', mobile: '9876543212' },
      };
      
      const result = await firebaseService.batchUpdateVoters(testDatasetId, votersData);
      
      if (result.success) {
        addTestResult('Batch Write', 'PASSED - 3 records');
        Alert.alert('Success', 'Batch data written successfully!');
      } else {
        addTestResult('Batch Write', 'FAILED: ' + result.error);
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      addTestResult('Batch Write', 'FAILED: ' + error.message);
      Alert.alert('Error', error.message);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Firebase Test Panel</Text>
      
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Connection Status:</Text>
        <Text style={styles.statusText}>{connectionStatus}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testFirebaseConnection}>
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testWriteData}>
          <Text style={styles.buttonText}>Test Write</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testReadData}>
          <Text style={styles.buttonText}>Test Read</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testBatchWrite}>
          <Text style={styles.buttonText}>Test Batch Write</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearTestResults}>
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>No tests run yet</Text>
        ) : (
          testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <Text style={styles.resultTime}>{result.timestamp}</Text>
              <Text style={styles.resultName}>{result.testName}</Text>
              <Text style={[
                styles.resultStatus,
                result.result.includes('PASSED') ? styles.passed : styles.failed
              ]}>
                {result.result}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noResults: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  resultItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 5,
  },
  resultStatus: {
    fontSize: 14,
  },
  passed: {
    color: '#28a745',
  },
  failed: {
    color: '#dc3545',
  },
});

export default FirebaseTest;
