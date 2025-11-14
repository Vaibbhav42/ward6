import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { VOTER_DATASETS } from '../data/voters';
import BackToDashboard from '../components/BackToDashboard';
import firebaseService from '../services/firebaseService';

const { width: screenWidth } = Dimensions.get('window');

const ListPage = ({ selectedDataset = 101, navigation }) => {
  const VOTERS = VOTER_DATASETS[selectedDataset] || VOTER_DATASETS[101];
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseData, setFirebaseData] = useState({});
  const [animatedValues] = useState(VOTERS.map(() => new Animated.Value(0)));

  // Load data from Firebase on mount
  useEffect(() => {
    loadFirebaseData();

    // Refresh when screen is focused to pick up any recent saves
    const unsubscribe = navigation.addListener('focus', () => {
      loadFirebaseData();
    });
    return unsubscribe;
  }, [selectedDataset, navigation]);

  // Animate cards on load
  useEffect(() => {
    if (!isLoading) {
      Animated.stagger(80, 
        animatedValues.map(anim => 
          Animated.spring(anim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          })
        )
      ).start();
    }
  }, [isLoading]);

  const loadFirebaseData = async () => {
    setIsLoading(true);
    try {
      // Fetch all voters data in one call (much faster than per-voter calls)
      const allData = await firebaseService.getAllVotersData(selectedDataset);

      // Normalize shape: ensure we only store the fields we need
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
      console.log('✅ Loaded Firebase data for', Object.keys(data).length, 'voters (batched)');
    } catch (error) {
      console.error('Error loading Firebase dataset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    await loadFirebaseData();
  };

  // --- Helper Functions using Firebase data ---
  const getVoterStatusColor = (id) => {
    // Try Firebase first (support both semantic keys and hex strings)
    const status = firebaseData[id]?.status;
    if (status) {
      if (status === 'green' || status === '#28a745') return '#28a745';
      if (status === 'yellow' || status === '#ffc107') return '#ffc107';
      if (status === 'red' || status === '#dc3545') return '#dc3545';
      if (typeof status === 'string' && status.startsWith('#')) return status;
    }

    // Fallback to memory storage
    const key = `voterStatusColor_${selectedDataset}_${id}`;
    return global.memoryStorage?.[key] || null;
  };

  const getCustomData = (id) => {
    // Try Firebase first
    const custom = firebaseData[id]?.custom;
    if (custom && custom.type) {
      return custom;
    }
    
    // Fallback to memory storage
    const key = `voterCustomData_${selectedDataset}_${id}`;
    const data = global.memoryStorage?.[key];
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return { type: null, value: '' };
      }
    }
    return { type: null, value: '' };
  };

  // --- Counting Logic ---
  const computeAllCounts = (voters) => {
    let counts = {
      'happy': 0,
      'green': 0,
      'yellow': 0,
      'red': 0,
      'dead': 0,
      'migrant': 0,
      'out-of-town': 0,
    };

    voters.forEach(voter => {
      // responded => happy
      const resp = firebaseData[voter.id]?.responded || !!global.memoryStorage?.[`responded_${selectedDataset}_${voter.id}`];
      if (resp) counts['happy']++;
      // Color status
      const statusColor = getVoterStatusColor(voter.id);
      if (statusColor === '#28a745') counts['green']++;
      else if (statusColor === '#ffc107') counts['yellow']++;
      else if (statusColor === '#dc3545') counts['red']++;

      // Custom data
      const customData = getCustomData(voter.id);
      if (customData.type === 'Dead') counts['dead']++;
      if (customData.type === 'Migrant') counts['migrant']++;
      if (customData.type === 'Out Of Town') counts['out-of-town']++;
    });

    return counts;
  };

  // Recompute counts when voters or firebase data change
  const allCounts = useMemo(() => computeAllCounts(VOTERS), [VOTERS, firebaseData]);

  const cards = [
    { 
      title: 'Happy',
      key: 'happy',
      icon: '😊',
      color: '#ff7b00',
      count: allCounts.happy || 0,
      description: 'Recently responded / happy voters'
    },
    { 
      title: 'Favorite', 
      key: 'green', 
      icon: '💚', 
      color: "#28a745", 
      count: allCounts.green,
      description: "Favorable voters"
    },
    { 
      title: 'Doubtful', 
      key: 'yellow', 
      icon: '⚠️', 
      color: "#ffc107", 
      count: allCounts.yellow,
      description: "Undecided voters"
    },
    { 
      title: 'Opposite', 
      key: 'red', 
      icon: '⛔', 
      color: "#dc3545", 
      count: allCounts.red,
      description: "Opposition voters"
    },
    { 
      title: 'Dead', 
      key: 'dead', 
      icon: '☠️', 
      color: "#000000", 
      count: allCounts.dead || 0,
      description: "Deceased voters"
    },
    { 
      title: 'Migrant', 
      key: 'migrant', 
      icon: '🚚', 
      color: "#6f42c1", 
      count: allCounts.migrant,
      description: "Migrant voters"
    },
    { 
      title: 'Out Of Town', 
      key: 'out-of-town', 
      icon: '🏘️', 
      color: "#343a40", 
      count: allCounts['out-of-town'],
      description: "Out of town voters"
    },
  ];

  const handleCardPress = (cardKey) => {
    navigation.navigate('ListBox', { box: cardKey, selectedDataset });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar backgroundColor="#667eea" barStyle="light-content" />
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading voter data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />
      
      {/* Modern Gradient Header */}
      <View style={styles.gradientHeader}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Data Lists</Text>
            <Text style={styles.headerSubtitle}>View categorized voter data</Text>
          </View>
          <BackToDashboard navigation={navigation} />
        </View>
      </View>
      
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          // Simple pull-to-refresh
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={["#667eea"]} />
        }
      >
        {/* Feature Cards */}
        <View style={styles.cardsSection}>
          <View style={styles.cardGrid}>
            {cards.map((card, index) => {
              const animatedStyle = {
                opacity: animatedValues[index],
                transform: [{
                  translateY: animatedValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              };

              return (
                <Animated.View key={card.key} style={animatedStyle}>
                  <TouchableOpacity
                    style={[styles.modernCard]}
                    onPress={() => handleCardPress(card.key)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.cardHeader, { backgroundColor: card.color + '15' }]}>
                      <View style={[styles.iconContainer, { backgroundColor: card.color }]}>
                        <Text style={styles.cardIcon}>{card.icon}</Text>
                      </View>
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={styles.modernCardTitle}>{card.title}</Text>
                      <Text style={styles.modernCardDescription}>{card.description}</Text>
                      <View style={styles.countContainer}>
                        <Text style={[styles.cardCount, { color: card.color }]}>{card.count}</Text>
                        <Text style={styles.countLabel}>voters</Text>
                      </View>
                    </View>

                    {/* Decorative gradient overlay */}
                    <View style={[styles.cardGradientOverlay, {
                      backgroundColor: card.color
                    }]} />
                    
                    {/* Arrow indicator */}
                    <View style={styles.arrowIndicator}>
                      <Text style={styles.arrowText}>→</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  gradientHeader: {
    backgroundColor: '#667eea',
    paddingTop: 40,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e6efff',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  cardsSection: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modernCard: {
    width: (screenWidth - 60) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  cardHeader: {
    paddingTop: 25,
    paddingHorizontal: 20,
    paddingBottom: 15,
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardIcon: {
    fontSize: 30,
    color: '#ffffff',
  },
  cardBody: {
    padding: 20,
    paddingTop: 15,
    paddingBottom: 25,
    alignItems: 'center',
  },
  modernCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 6,
    textAlign: 'center',
  },
  modernCardDescription: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 5,
  },
  cardCount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 5,
  },
  countLabel: {
    fontSize: 14,
    color: '#a0aec0',
    fontWeight: '500',
  },
  cardGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 5,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    opacity: 0.9,
  },
  arrowIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default ListPage;