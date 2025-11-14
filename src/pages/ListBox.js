import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Linking,
  FlatList,
  Modal,
  Animated,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { VOTER_DATASETS } from '../data/voters';
import Icon from 'react-native-vector-icons/FontAwesome';
import firebaseService from '../services/firebaseService';

export default function ListBox({ selectedDataset: propSelectedDataset = 101 }) {
  const route = useRoute();
  const navigation = useNavigation();
  const { box, selectedDataset: routeSelectedDataset } = route.params || {};
  
  // Use selectedDataset from route params if available, otherwise use prop
  const selectedDataset = routeSelectedDataset || propSelectedDataset;
  const VOTERS = VOTER_DATASETS[selectedDataset] || VOTER_DATASETS[101];

  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState(null); // 'share'
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseData, setFirebaseData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Load Firebase data on mount
  useEffect(() => {
    loadFirebaseData();

    // Reload when screen gains focus so saved changes (from VoterDetail) appear immediately
    const unsubscribe = navigation.addListener('focus', () => {
      loadFirebaseData();
    });
    return unsubscribe;
  }, [selectedDataset, navigation]);
  const loadFirebaseData = async () => {
    setIsLoading(true);
    try {
      const allData = await firebaseService.getAllVotersData(selectedDataset);
      const data = {};
      if (allData && typeof allData === 'object') {
        Object.entries(allData).forEach(([voterId, vdata]) => {
          data[voterId] = {
            status: vdata?.status ?? null,
            custom: vdata?.custom ?? { type: null, value: '' },
            mobile: vdata?.mobile ?? null,
            responded: vdata?.responded ?? false,
          };
        });
      }
      setFirebaseData(data);
    } catch (error) {
      console.error('Error loading Firebase dataset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    await loadFirebaseData();
  };

  // --- Helpers using Firebase data first, then fallback to memoryStorage ---
  function getVoterStatusColor(id) {
    // Try Firebase first
    const fbStatus = firebaseData[id]?.status;
    // Support both semantic keys ('green'|'yellow'|'red') and hex colors ('#28a745', '#ffc107', '#dc3545')
    if (!fbStatus) {
      // fallback to memory
      try {
        return global.memoryStorage?.[`voterStatusColor_${selectedDataset}_${id}`] || null;
      } catch (e) {
        return null;
      }
    }
    if (fbStatus === 'green' || fbStatus === '#28a745') return '#28a745';
    if (fbStatus === 'yellow' || fbStatus === '#ffc107') return '#ffc107';
    if (fbStatus === 'red' || fbStatus === '#dc3545') return '#dc3545';
    // If it's a hex color, return as-is
    if (typeof fbStatus === 'string' && fbStatus.startsWith('#')) return fbStatus;
    
    return null;
  }

  function getQuickBlue(id) {
    try {
      return global.memoryStorage?.[`voterQuickBlue_${selectedDataset}_${id}`] === '1';
    } catch (e) {
      return false;
    }
  }

  function getCustomData(id) {
    // Try Firebase first
    const fbCustom = firebaseData[id]?.custom;
    if (fbCustom && fbCustom.type) return fbCustom;
    
    // Fallback to memory
    try {
      const raw = global.memoryStorage?.[`voterCustomData_${selectedDataset}_${id}`];
      return raw ? JSON.parse(raw) : { type: null, value: '' };
    } catch (e) {
      return { type: null, value: '' };
    }
  }

  function getResponded(id) {
    try {
      const fb = firebaseData[id]?.responded;
      if (fb !== undefined && fb !== null) return !!fb;
      return !!global.memoryStorage?.[`responded_${selectedDataset}_${id}`];
    } catch (e) {
      return false;
    }
  }

  function getFoundStatus(id) {
    try {
      return global.memoryStorage?.[`voterFoundStatus_${selectedDataset}_${id}`] === 'found';
    } catch (e) {
      return false;
    }
  }

  function getVoterMobile(id) {
    // Try Firebase first
    const fbMobile = firebaseData[id]?.mobile;
    if (fbMobile) return fbMobile;
    
    // Fallback to memory
    try {
      return global.memoryStorage?.[`voterMobile_${selectedDataset}_${id}`];
    } catch (e) {
      return null;
    }
  }

  function getStatusText(id) {
    const status = getVoterStatusColor(id);
    if (status === '#28a745') return 'Favorite';
    if (status === '#ffc107') return 'Doubtful';
    if (status === '#dc3545') return 'Opposite';
    if (getQuickBlue(id)) return 'Blue';
    return '-';
  }

  // --- Counting Logic ---
  function computeAllCounts(voters) {
    let counts = {
      'happy': 0,
      'find': 0,
      'not-find': 0,
      'green': 0,
      'yellow': 0,
      'red': 0,
      'blue': 0,
      'migrant': 0,
      'out-of-town': 0,
      'dead': 0,
    };

    for (const v of voters) {
      // count happy/responded
      const resp = firebaseData[v.id]?.responded || !!global.memoryStorage?.[`responded_${selectedDataset}_${v.id}`];
      if (resp) counts['happy'] += 1;
      const hasMobile = !!v.mobile && v.mobile.trim() !== '';
      const savedMobile = getVoterMobile(v.id);
      const hasSavedMobile = savedMobile !== undefined && savedMobile.trim() !== '';
      const isFound = getFoundStatus(v.id);
      
      if (hasMobile || hasSavedMobile || isFound) {
        counts['find'] += 1;
      }

      const status = getVoterStatusColor(v.id);
      const isBlue = getQuickBlue(v.id);
      if (status === '#28a745') counts['green'] += 1;
      else if (status === '#ffc107') counts['yellow'] += 1;
      else if (status === '#dc3545') counts['red'] += 1;
      if (isBlue) counts['blue'] += 1;

      const custom = getCustomData(v.id);
      if (custom.type === 'Migrant') counts['migrant'] += 1;
      else if (custom.type === 'Out Of Town') counts['out-of-town'] += 1;
      else if (custom.type === 'Dead') counts['dead'] += 1;
    }

    counts['not-find'] = voters.length - counts['find'];
    return counts;
  }

  const allCounts = useMemo(() => computeAllCounts(VOTERS), [VOTERS]);

  const BOXES = [
    { key: 'happy', title: 'Happy', count: allCounts.happy },
    { key: 'find', title: 'Find', count: allCounts.find },
    { key: 'not-find', title: 'Not Find', count: allCounts['not-find'] },
    { key: 'green', title: 'Favorite', count: allCounts.green },
    { key: 'yellow', title: 'Doubtful', count: allCounts.yellow },
    { key: 'red', title: 'Opposite', count: allCounts.red },
    { key: 'blue', title: 'Blue', count: allCounts.blue },
    { key: 'migrant', title: 'Migrant', count: allCounts.migrant },
    { key: 'out-of-town', title: 'Out-Of-Town', count: allCounts['out-of-town'] },
    { key: 'dead', title: 'Dead', count: allCounts.dead },
  ];

  // --- Filtered Voters ---
  const filtered = useMemo(() => {
    switch (box) {
      case 'happy':
        return VOTERS.filter((v) => getResponded(v.id));
      case 'find':
        return VOTERS.filter((v) => {
          const hasMobile = !!v.mobile && v.mobile.trim() !== '';
          const savedMobile = getVoterMobile(v.id);
          const hasSavedMobile = savedMobile !== undefined && savedMobile.trim() !== '';
          const isFound = getFoundStatus(v.id);
          return hasMobile || hasSavedMobile || isFound;
        });
      case 'not-find':
        return VOTERS.filter((v) => {
          const hasMobile = !!v.mobile && v.mobile.trim() !== '';
          const savedMobile = getVoterMobile(v.id);
          const hasSavedMobile = savedMobile !== undefined && savedMobile.trim() !== '';
          const isFound = getFoundStatus(v.id);
          return !hasMobile && !hasSavedMobile && !isFound;
        });
      case 'green':
        return VOTERS.filter((v) => getVoterStatusColor(v.id) === '#28a745');
      case 'yellow':
        return VOTERS.filter((v) => getVoterStatusColor(v.id) === '#ffc107');
      case 'red':
        return VOTERS.filter((v) => getVoterStatusColor(v.id) === '#dc3545');
      case 'blue':
        return VOTERS.filter((v) => getQuickBlue(v.id));
      case 'migrant':
        return VOTERS.filter((v) => getCustomData(v.id).type === 'Migrant');
      case 'out-of-town':
        return VOTERS.filter((v) => getCustomData(v.id).type === 'Out Of Town');
      case 'dead':
        return VOTERS.filter((v) => getCustomData(v.id).type === 'Dead');
      default:
        return VOTERS;
    }
  }, [box, VOTERS, firebaseData]);

  // Apply search on top of filtered set
  const searched = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') return filtered;
    const q = searchQuery.toLowerCase().trim();
    return filtered.filter(v => {
      const mobile = (getVoterMobile(v.id) || '').toString();
      const name = (v.voter_full_name || v.voter_full_name_translated || v.name || '').toLowerCase();
      const vid = (v.voter_id_number || v.voterId || '').toString().toLowerCase();
      return name.includes(q) || vid.includes(q) || mobile.includes(q) || (v.id && v.id.toString().includes(q));
    });
  }, [filtered, searchQuery, firebaseData]);

  const currentBox = BOXES.find((b) => b.key === box);
  const title = currentBox?.title || 'List';
  const titleCount = currentBox?.count !== undefined ? currentBox.count : filtered.length;

  // --- Action Handlers ---
  const openActionModal = (type) => {
    setActionType(type);
    setActionModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeActionModal = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setActionModalVisible(false);
      setActionType(null);
    });
  };

  // --- Export Functions ---
  // NOTE: download/export removed per product request (keep sharing only)

  const shareWhatsApp = async () => {
    try {
      const names = filtered.slice(0, 50).map((v) => v.name).join(', ');
      const text = `List: ${title} (${filtered.length})\n${names}`;
      const url = `whatsapp://send?text=${encodeURIComponent(text)}`;

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed');
      }
      closeActionModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to share via WhatsApp');
    }
  };

  const shareEmail = async () => {
    try {
      const subject = `${title} (${filtered.length})`;
      const body = filtered.map((v) => `${v.voter_full_name || v.voter_full_name_translated || v.name || ''} - ${v.voter_id_number || v.voterId || ''} - ${v.mobile || ''}`).join('\n');
      const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No email app installed');
      }
      closeActionModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to share via email');
    }
  };

  // --- Render Item for FlatList ---
  const renderVoterItem = ({ item: v }) => {
    const status = getVoterStatusColor(v.id);
    const blue = getQuickBlue(v.id);
    const custom = getCustomData(v.id);
    const savedMobile = getVoterMobile(v.id);

    let statusText = '-';
    let statusIcon = '';
    let statusBgColor = '#f0f0f0';
    let textColor = '#333';
    
    if (status === '#28a745') { 
      statusText = 'Favorite'; 
      statusIcon = '💚';
      statusBgColor = '#d4edda';
      textColor = '#28a745'; 
    }
    else if (status === '#ffc107') { 
      statusText = 'Doubtful'; 
      statusIcon = '⚠️';
      statusBgColor = '#fff3cd';
      textColor = '#ffc107'; 
    }
    else if (status === '#dc3545') { 
      statusText = 'Opposite'; 
      statusIcon = '⛔';
      statusBgColor = '#f8d7da';
      textColor = '#dc3545'; 
    }
    else if (blue) { 
      statusText = 'Blue'; 
      statusIcon = '🔵';
      statusBgColor = '#cfe2ff';
      textColor = '#007bff'; 
    }

    // Use saved mobile if available, otherwise use original
    const displayMobile = savedMobile !== undefined ? savedMobile : v.mobile;

    // Show loading indicator if Firebase data is still loading
    const isDataLoading = isLoading && Object.keys(firebaseData).length === 0;
    
  // For custom data categories, show different information
  const isCustomCategory = ['migrant', 'out-of-town'].includes(box);
    const isStatusCategory = ['green', 'yellow', 'red'].includes(box);
  const isDead = box === 'dead';
    
    return (
      <TouchableOpacity
        style={styles.voterRow}
        onPress={() => navigation.navigate('VoterDetail', { 
          id: v.id, 
          voter: v, 
          selectedDataset 
        })}
      >
        <View style={styles.voterCell}>
          <Text style={styles.voterText}>{v.voter_full_name || v.voter_full_name_translated || v.name}</Text>
        </View>
        <View style={styles.voterCell}>
          <Text style={styles.voterText}>{v.voter_id_number || v.voterId}</Text>
        </View>
        { (box === 'migrant' || box === 'out-of-town') ? (
          // For Migrant and Out Of Town - show location/value
          <View style={[styles.voterCell, { flex: 2 }]}>
            <Text style={styles.voterText}>
              {custom.type && custom.value ? custom.value : '-'}
            </Text>
          </View>
        ) : isStatusCategory ? (
          // For Favorite, Doubtful, Opposite - show mobile and status only
          <>
            <View style={styles.voterCell}>
              <Text style={styles.voterText}>{displayMobile || '-'}</Text>
            </View>
            <View style={styles.voterCell}>
              {statusText !== '-' && (
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: status }
                    ]}
                  />
                  <Text style={[styles.statusText, { color: textColor }]}>
                    {statusText}
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : box === 'dead' ? (
          // Dead - show mobile and static 'Dead' status
          <>
            <View style={styles.voterCell}>
              <Text style={styles.voterText}>{displayMobile || '-'}</Text>
            </View>
            <View style={styles.voterCell}>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: '#000' }]} />
                <Text style={[styles.statusText, { color: '#000' }]}>Dead</Text>
              </View>
            </View>
          </>
        ) : (
          // For other categories - show mobile, status, and custom
          <>
            <View style={styles.voterCell}>
              <Text style={styles.voterText}>{displayMobile || '-'}</Text>
            </View>
            <View style={styles.voterCell}>
              {statusText !== '-' && (
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: blue ? '#007bff' : status }
                    ]}
                  />
                  <Text style={[styles.statusText, { color: textColor }]}>
                    {statusText}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.voterCell}>
              <Text style={styles.voterText}>
                {custom.type ? `${custom.type}: ${custom.value}` : '-'}
              </Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  // Render a card-style item for the 'happy' box
  const renderHappyItem = ({ item: v }) => {
    const savedMobile = getVoterMobile(v.id) || '-';
    return (
      <View style={styles.happyCard} key={v.id}>
        <View style={styles.happyRowTop}>
          <Text style={styles.happyName}>{v.voter_full_name || v.voter_full_name_translated || v.name}</Text>
          <Text style={styles.happyId}>#{v.id}</Text>
        </View>
        <View style={styles.happyRowBottom}>
          <Text style={styles.happyMobile}>📱 {savedMobile}</Text>
          <TouchableOpacity
            style={styles.happyDetailButton}
            onPress={() => navigation.navigate('VoterDetail', { id: v.id, voter: v, selectedDataset })}
          >
            <Text style={styles.happyDetailText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const modalTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  // Show loading state while fetching Firebase data
  if (isLoading && Object.keys(firebaseData).length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {title} <Text style={styles.count}>({titleCount})</Text>
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading voter data from Firebase...</Text>
          <Text style={styles.loadingSubtext}>🔥 Fetching latest information</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {title} <Text style={styles.count}>({titleCount})</Text>
        </Text>
        {/* ...existing code... */}
      </View>

      {/* Voter Table */}
      <View style={styles.tableContainer}>
        {searched.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No voters in this category.</Text>
          </View>
        ) : (
          <>
            {/* Search Box */}
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInputBox}
                placeholder={`Search ${title} by name, id or mobile...`}
                placeholderTextColor="#9aa4b2"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity style={styles.searchClearButton} onPress={() => setSearchQuery('')}>
                  <Text style={{ color: '#fff' }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.headerText}>Name</Text>
              <Text style={styles.headerText}>Voter ID</Text>
              { (box === 'migrant' || box === 'out-of-town') ? (
                <Text style={[styles.headerText, { flex: 2 }]}> 
                  Location
                </Text>
              ) : box === 'dead' ? (
                <Text style={[styles.headerText]}> 
                  Status
                </Text>
              ) : ['green', 'yellow', 'red'].includes(box) ? (
                <>
                  <Text style={styles.headerText}>Mobile</Text>
                  <Text style={styles.headerText}>Status</Text>
                </>
              ) : (
                <>
                  <Text style={styles.headerText}>Mobile</Text>
                  <Text style={styles.headerText}>Status</Text>
                  <Text style={styles.headerText}>Custom</Text>
                </>
              )}
            </View>

            {/* Voter List */}
            {box === 'happy' ? (
              <FlatList
                data={searched}
                renderItem={renderHappyItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.voterList}
                showsVerticalScrollIndicator={false}
                refreshing={isLoading}
                onRefresh={onRefresh}
              />
            ) : (
              <FlatList
                data={searched}
                renderItem={renderVoterItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.voterList}
                showsVerticalScrollIndicator={false}
                refreshing={isLoading}
                onRefresh={onRefresh}
              />
            )}
          </>
        )}
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
      
        <Text style={styles.backButtonText}>⬅️ Back to Data Sheets</Text>
      </TouchableOpacity>

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeActionModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeActionModal}
        >
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: modalTranslateY }] }
            ]}
          >
            {/* download option removed */}

            {actionType === 'share' && (
              <>
                <TouchableOpacity style={styles.modalOption} onPress={shareWhatsApp}>
                  <View style={styles.modalOptionWithIcon}>
                    <Icon name="whatsapp" size={20} color="#25D366" />
                    <Text style={styles.modalOptionText}>WhatsApp</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.modalSeparator} />
                <TouchableOpacity style={styles.modalOption} onPress={shareEmail}>
                  <View style={styles.modalOptionWithIcon}>
                    <Icon name="envelope" size={20} color="#EA4335" />
                    <Text style={styles.modalOptionText}>Email</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.modalSeparator} />
                <TouchableOpacity style={styles.modalOption} onPress={closeActionModal}>
                  <Text style={[styles.modalOptionText, styles.cancelText]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  count: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'normal',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    justifyContent: 'center',
    minWidth: 90,
  },
  downloadButton: {
    backgroundColor: '#28a745',
    borderWidth: 0,
  },
  shareButton: {
    backgroundColor: '#007bff',
    borderWidth: 0,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 13,
  },
  downloadButtonText: {
    color: '#fff',
  },
  shareButtonText: {
    color: '#fff',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 4,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
  },
  voterList: {
    flex: 1,
  },
  voterRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
    paddingVertical: 8,
  },
  voterCell: {
    flex: 1,
    justifyContent: 'center',
  },
  voterText: {
    fontSize: 14,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
    marginTop: 20,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalOption: {
    paddingVertical: 16,
  },
  modalOptionWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalOptionText: {
    fontSize: 18,
    color: '#007bff',
  },
  cancelText: {
    color: '#dc3545',
    textAlign: 'center',
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInputBox: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    fontSize: 14,
    color: '#111827',
  },
  searchClearButton: {
    marginLeft: 8,
    backgroundColor: '#667eea',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  happyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  happyRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  happyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  happyId: {
    fontSize: 12,
    color: '#6b7280',
  },
  happyRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  happyMobile: {
    fontSize: 14,
    color: '#374151',
  },
  happyDetailButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  happyDetailText: {
    color: '#fff',
    fontWeight: '600',
  },
});