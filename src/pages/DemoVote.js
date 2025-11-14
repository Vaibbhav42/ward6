import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { VOTER_DATASETS } from '../data/voters';
import BackToDashboard from '../components/BackToDashboard';
import firebaseService from '../services/firebaseService';

// Initialize global storage for families
if (!global.memoryStorage) {
  global.memoryStorage = {};
}

const DemoVote = ({ navigation, selectedDataset = 101 }) => {
  const VOTERS = VOTER_DATASETS[selectedDataset] || VOTER_DATASETS[101];
  
  const [familyMembers, setFamilyMembers] = useState([null]); // Start with one empty slot
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMemberIndex, setCurrentMemberIndex] = useState(null);
  const [savedFamilies, setSavedFamilies] = useState([]);
  const [editingFamilyId, setEditingFamilyId] = useState(null);

  // Load saved families on mount
  useEffect(() => {
    loadSavedFamilies();
  }, [selectedDataset]);

  const loadSavedFamilies = async () => {
    const familiesKey = `families_${selectedDataset}`;
    
    // Try to load from Firebase first
    try {
      const firebaseFamilies = await firebaseService.getCustomData(selectedDataset, 'all', 'families');
      if (firebaseFamilies && Array.isArray(firebaseFamilies)) {
        global.memoryStorage[familiesKey] = firebaseFamilies;
        setSavedFamilies(firebaseFamilies);
        console.log('✅ Loaded families from Firebase');
        return;
      }
    } catch (error) {
      console.log('⚠️ Could not load from Firebase, using local storage');
    }
    
    // Fallback to memory storage
    const families = global.memoryStorage[familiesKey] || [];
    setSavedFamilies(families);
  };

  const handleMemberSelect = (index) => {
    setCurrentMemberIndex(index);
    setModalVisible(true);
    setSearchQuery('');
  };

  const selectVoter = (voter) => {
    const updatedMembers = [...familyMembers];
    updatedMembers[currentMemberIndex] = voter;
    setFamilyMembers(updatedMembers);
    setModalVisible(false);
    setSearchQuery('');
  };

  const addMemberSlot = () => {
    setFamilyMembers([...familyMembers, null]);
  };

  const removeMemberSlot = (index) => {
    if (familyMembers.length > 1) {
      const updatedMembers = familyMembers.filter((_, i) => i !== index);
      setFamilyMembers(updatedMembers);
    }
  };

  const saveFamily = async () => {
    // Filter out null/empty slots
    const validMembers = familyMembers.filter(member => member !== null);
    
    if (validMembers.length === 0) {
      Alert.alert('Error', 'Please select at least one family member');
      return;
    }

    const familiesKey = `families_${selectedDataset}`;
    const existingFamilies = global.memoryStorage[familiesKey] || [];
    
    let updatedFamilies;
    
    if (editingFamilyId) {
      // Update existing family
      updatedFamilies = existingFamilies.map(family => 
        family.id === editingFamilyId 
          ? { ...family, members: validMembers, updatedAt: new Date().toISOString() }
          : family
      );
    } else {
      // Create new family
      const familyData = {
        id: Date.now().toString(),
        members: validMembers,
        createdAt: new Date().toISOString(),
      };
      updatedFamilies = [...existingFamilies, familyData];
    }
    
    // Save to memory storage
    global.memoryStorage[familiesKey] = updatedFamilies;

    // Save to Firebase
    try {
      const result = await firebaseService.saveCustomData(
        selectedDataset,
        'all',
        'families',
        updatedFamilies
      );
      
      if (result.success) {
        console.log('✅ Family saved to Firebase');
        Alert.alert('Success', editingFamilyId ? 'Family updated successfully!' : 'Family saved successfully!');
      } else {
        console.log('⚠️ Firebase save failed:', result.error);
        Alert.alert('Saved Locally', 'Family saved to device (Firebase sync failed)');
      }
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      Alert.alert('Saved Locally', 'Family saved to device only');
    }
    
    // Reset form
    setFamilyMembers([null]);
    setEditingFamilyId(null);
    loadSavedFamilies();
  };

  const deleteFamily = (familyId) => {
    Alert.alert(
      'Delete Family',
      'Are you sure you want to delete this family?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const familiesKey = `families_${selectedDataset}`;
            const updatedFamilies = savedFamilies.filter(f => f.id !== familyId);
            global.memoryStorage[familiesKey] = updatedFamilies;
            
            // Update Firebase
            try {
              await firebaseService.saveCustomData(
                selectedDataset,
                'all',
                'families',
                updatedFamilies
              );
              console.log('✅ Family deleted from Firebase');
            } catch (error) {
              console.error('Error deleting from Firebase:', error);
            }
            
            loadSavedFamilies();
          },
        },
      ]
    );
  };

  const editFamily = (family) => {
    setEditingFamilyId(family.id);
    setFamilyMembers(family.members);
    // Scroll to top to show the edit form
    Alert.alert('Edit Mode', 'You can now edit the family members. Click "Save Family" when done.');
  };

  const cancelEdit = () => {
    setEditingFamilyId(null);
    setFamilyMembers([null]);
  };

  // Filter voters based on search query
  const filteredVoters = VOTERS.filter(voter => {
    const query = searchQuery.toLowerCase();
    return (
      voter.voter_full_name?.toLowerCase().includes(query) ||
      voter.voter_id_number?.toLowerCase().includes(query) ||
      voter.voter_reference_number?.toLowerCase().includes(query) ||
      voter.house_number_address?.toString().toLowerCase().includes(query)
    );
  });


  return (
    <ScrollView style={styles.container}>
      <BackToDashboard navigation={navigation} />
      
      <View style={styles.header}>
        <Text style={styles.title}>👨‍👩‍👧‍👦 Family Management</Text>
        <Text style={styles.subtitle}>Create and manage voter families</Text>
      </View>

      {/* Add Family Members Section */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View>
            <Text style={styles.sectionTitle}>
              {editingFamilyId ? '✏️ Edit Family' : 'Add Family Members'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              Total Voters: {VOTERS.length.toLocaleString()}
            </Text>
          </View>
          {editingFamilyId && (
            <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
              <Text style={styles.cancelButtonText}>✕ Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {familyMembers.map((member, index) => (
          <View key={index} style={styles.memberRow}>
            <TouchableOpacity
              style={styles.memberInput}
              onPress={() => handleMemberSelect(index)}
            >
              <View style={styles.memberInputContent}>
                <Text style={member ? styles.selectedMemberText : styles.placeholderText}>
                  {member ? `${member.voter_full_name} - ${member.voter_id_number}` : '🔍 Search and select voter'}
                </Text>
                {!member && (
                  <Text style={styles.searchIcon}>→</Text>
                )}
              </View>
            </TouchableOpacity>
            
            {familyMembers.length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeMemberSlot(index)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addMemberSlot}>
          <Text style={styles.addButtonText}>+ Add Member</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={saveFamily}>
          <Text style={styles.saveButtonText}>
            {editingFamilyId ? '💾 Update Family' : '💾 Save Family'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Saved Families Section */}
      {savedFamilies.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Families ({savedFamilies.length})</Text>
          
          {savedFamilies.map((family, familyIndex) => (
            <View key={family.id} style={styles.familyCard}>
              <View style={styles.familyHeader}>
                <Text style={styles.familyTitle}>
                  Family {familyIndex + 1}
                  {editingFamilyId === family.id && (
                    <Text style={styles.editingBadge}> (Editing)</Text>
                  )}
                </Text>
                <View style={styles.familyActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => editFamily(family)}
                  >
                    <Text style={styles.editButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteFamily(family.id)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.familyMembers}>
                {family.members.map((member, memberIndex) => (
                  <View key={memberIndex} style={styles.memberCard}>
                    <Text style={styles.memberName}>{member.voter_full_name}</Text>
                    <Text style={styles.memberDetails}>
                      Voter ID: {member.voter_id_number}
                    </Text>
                    <Text style={styles.memberDetails}>
                      Reference: {member.voter_reference_number}
                    </Text>
                    <Text style={styles.memberDetails}>
                      Address: {member.house_number_address}
                    </Text>
                    <Text style={styles.memberDetails}>
                      Age: {member.voter_age} | Gender: {member.voter_gender}
                    </Text>
                  </View>
                ))}
              </View>
              
              <Text style={styles.familyDate}>
                Created: {new Date(family.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Voter Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Voter</Text>
                <Text style={styles.modalSubtitle}>
                  {filteredVoters.length} of {VOTERS.length} voters
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Text style={styles.searchIconText}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, voter ID, part sequence, mobile..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                placeholderTextColor="#999"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredVoters}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.voterItem}
                  onPress={() => selectVoter(item)}
                >
                  <View style={styles.voterInfo}>
                    <Text style={styles.voterName}>{item.voter_full_name}</Text>
                    <Text style={styles.voterDetails}>
                      ID: {item.voter_id_number} | Ref: {item.voter_reference_number}
                    </Text>
                    <Text style={styles.voterDetails}>
                      Address: {item.house_number_address} | Age: {item.voter_age} | {item.voter_gender}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.voterList}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No voters found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
  },
  memberInputContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: 'bold',
  },
  placeholderText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  selectedMemberText: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    width: 40,
    height: 40,
    backgroundColor: '#ef4444',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#10b981',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  familyCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  familyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  familyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  editingBadge: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: 'normal',
  },
  familyActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    padding: 5,
  },
  editButtonText: {
    fontSize: 22,
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 24,
  },
  familyMembers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  memberCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    minWidth: '48%',
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  memberDetails: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  familyDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 10,
    textAlign: 'right',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 15,
    backgroundColor: '#667eea',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#e0e7ff',
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    margin: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  searchIconText: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    padding: 15,
    fontSize: 15,
    color: '#1e293b',
  },
  clearButton: {
    padding: 5,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#94a3b8',
  },
  voterList: {
    maxHeight: 400,
  },
  voterItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  voterInfo: {
    flex: 1,
  },
  voterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  voterDetails: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
  },
});

export default DemoVote;