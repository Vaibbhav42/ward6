import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { VOTER_DATASETS } from '../data/voters';
import BackToDashboard from '../components/BackToDashboard';

const { width } = Dimensions.get('window');

// Access global memory storage
const memoryStorage = global.memoryStorage || {};

const ResponseList = ({ selectedDataset, navigation }) => {
  const [respondedVoters, setRespondedVoters] = useState([]);
  const [filteredVoters, setFilteredVoters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRespondedVoters();
  }, [selectedDataset]);

  const loadRespondedVoters = () => {
    setIsLoading(true);
    setTimeout(() => {
      const responded = [];
      
      // Check all datasets
      Object.entries(VOTER_DATASETS).forEach(([datasetKey, dataset]) => {
        dataset.forEach(voter => {
          const key = `responded_${datasetKey}_${voter.id}`;
          if (memoryStorage[key]) {
            responded.push({
              ...voter,
              datasetKey
            });
          }
        });
      });
      
      setRespondedVoters(responded);
      setFilteredVoters(responded);
      setIsLoading(false);
    }, 300);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    
    if (!text.trim()) {
      setFilteredVoters(respondedVoters);
      return;
    }
    
    const query = text.toLowerCase().trim();
    const filtered = respondedVoters.filter(voter => 
      (voter.name && voter.name.toLowerCase().includes(query)) ||
      (voter.voterId && voter.voterId.toLowerCase().includes(query)) ||
      (voter.Assembly_Part_Sequence && voter.Assembly_Part_Sequence.toLowerCase().includes(query)) ||
      (voter.mobile && voter.mobile.includes(query))
    );
    
    setFilteredVoters(filtered);
  };

  const handleDeleteResponse = (voter, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    const key = `responded_${voter.datasetKey}_${voter.id}`;
    delete memoryStorage[key];
    
    // Remove from lists
    const updated = respondedVoters.filter(v => !(v.id === voter.id && v.datasetKey === voter.datasetKey));
    setRespondedVoters(updated);
    
    // Update filtered list
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      setFilteredVoters(updated);
    }
  };

  const viewVoterDetails = (voter) => {
    navigation.navigate('VoterDetail', { id: voter.id, voter: voter });
  };

  const renderVoterItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.voterCard} 
        onPress={() => viewVoterDetails(item)}
        activeOpacity={0.7}
      >
        <View style={styles.voterInfo}>
          <View style={styles.nameRow}>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={(e) => handleDeleteResponse(item, e)}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
            <View style={styles.responseIndicator} />
            <Text style={styles.voterName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Voter ID:</Text>
              <Text style={styles.detailValue}>{item.voterId}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Part Seq:</Text>
              <Text style={styles.detailValue}>{item.Assembly_Part_Sequence}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      
      {/* Gradient Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGradient} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.titleSection}>
         
              <View style={styles.voterCountBadge}>
                <Text style={styles.voterCountText}>{respondedVoters.length} responded</Text>
              </View>
            </View>
            <View style={styles.backButtonContainer}>
              <BackToDashboard navigation={navigation} />
            </View>
          </View>
        </View>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <View style={styles.searchIconContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID, mobile, part seq..."
            placeholderTextColor="#AAB7C4"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={() => handleSearch('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading responded voters...</Text>
        </View>
      ) : (
        <View style={styles.resultsContainer}>
          {filteredVoters.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>{searchQuery.trim() ? 'No Results Found' : 'No Responses Yet'}</Text>
              <Text style={styles.emptyDescription}>
                {searchQuery.trim() 
                  ? 'Try adjusting your search query'
                  : 'Start marking voters as responded by clicking the radio button next to their names'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredVoters}
              renderItem={renderVoterItem}
              keyExtractor={(item, index) => `${item.datasetKey}_${item.id}_${index}`}
              contentContainerStyle={styles.listContainer}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },

  // Header Styles
  headerContainer: {
    position: 'relative',
    paddingBottom: 20,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: '#4A90E2',
  },
  headerContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  titleSection: {
    flex: 1,
    marginRight: 15,
  },
  voterCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  voterCountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  backButtonContainer: {
    marginTop: 5,
  },

  // Search Section
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F7F9FC',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8F4FD',
  },
  searchIconContainer: {
    marginRight: 10,
  },
  searchIcon: {
    fontSize: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    paddingVertical: 12,
  },
  clearButton: {
    padding: 8,
    marginLeft: 5,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#7F8C8D',
    fontWeight: 'bold',
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Results Container
  resultsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 5,
  },

  // List Styles
  listContainer: {
    paddingVertical: 10,
  },
  itemSeparator: {
    height: 12,
  },
  voterCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8F4FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  // Voter Info
  voterInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  deleteIcon: {
    fontSize: 16,
  },
  responseIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A90E2',
    marginRight: 12,
  },
  voterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginLeft: 54,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
});

export default ResponseList;
