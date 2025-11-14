import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { VOTER_DATASETS } from '../data/voters';
import firebaseService from '../services/firebaseService';

const Dashboard = ({ navigation, onLogout }) => {
  const [happyCount, setHappyCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const loadHappyCount = async () => {
      try {
        const allData = await firebaseService.getAllVotersData(101);
        let count = 0;
        if (allData && typeof allData === 'object') {
          Object.values(allData).forEach(v => {
            if (v && v.responded) count += 1;
          });
        }
        if (mounted) setHappyCount(count);
      } catch (e) {
        // ignore: leave count as 0
      }
    };

    loadHappyCount();

    const unsubscribe = navigation.addListener('focus', () => {
      loadHappyCount();
    });

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [navigation]);
  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  // Calculate total voters across all datasets
  const getTotalVoters = () => {
    return Object.values(VOTER_DATASETS).reduce((total, dataset) => {
      return total + dataset.length;
    }, 0);
  };

  const totalVoters = getTotalVoters();

  const menuItems = [
    {
      title: "Voter List",
      icon: "📋",
      path: "SearchVoters",
      description: "Browse and search voter lists",
      color: '#4c51bf'
    },
    {
      title: "Data Lists",
      icon: "🗂️",
      path: "ListPage",
      description: "View data sheets and reports",
      color: '#2f855a'
    },
    {
      title: "Happy Voters",
      icon: "",
      path: "ListBox",
      description: "Recently responded voters",
      color: '#ff7b00',
      params: { box: 'happy' }
    },
     {
      title: "Family Management",
      icon: "👨‍👩‍👧‍",
      path: "DemoVote",
      description: "Create and manage families",
      color: '#2d3748'
    },
  ];

  const handleLogout = () => {
    // Call the logout function passed from App.js
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <View style={styles.container}>
  <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Feature Cards */}
        <View style={styles.cardsSection}>

          <View style={styles.cardGrid}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.modernCard]}
                onPress={() => navigation.navigate(item.path, item.params || {})}
                activeOpacity={0.85}
              >
                <View style={[styles.cardHeader, { backgroundColor: item.color + '20' }]}>
                  <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                    <Text style={styles.cardIcon}>{item.icon}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.modernCardTitle}>{item.title}</Text>
                  <Text style={styles.modernCardDescription}>{item.description}</Text>
                </View>

                {/* Decorative gradient overlay */}
                <View style={[styles.cardGradientOverlay, {
                  backgroundColor: item.color + '15'
                }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statHeader, { backgroundColor: '#4c51bf' + '20' }]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#4c51bf' }]}>
                  <Text style={styles.statIcon}>👥</Text>
                </View>
              </View>
              <View style={styles.statBody}>
                <Text style={styles.statNumber}>{totalVoters.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Voters</Text>
              </View>
              <View style={[styles.statGradientOverlay, {
                backgroundColor: '#4c51bf' + '15'
              }]} />
            </View>

            {/* <View style={styles.statCard}>
              <View style={[styles.statHeader, { backgroundColor: '#ff7b00' + '20' }]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#ff7b00' }]}>
                  <Text style={styles.statIcon}>😊</Text>
                </View>
              </View>
              <View style={styles.statBody}>
                <Text style={styles.statNumber}>{happyCount.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Happy Voters</Text>
              </View>
              <View style={[styles.statGradientOverlay, {
                backgroundColor: '#ff7b00' + '15'
              }]} />
            </View> */}
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.modernLogoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={styles.logoutContent}>
              <View style={styles.logoutIconContainer}>
                <Text style={styles.logoutEmoji}>👋</Text>
              </View>
              <View style={styles.logoutTextContainer}>
                <Text style={styles.modernLogoutText}>Sign Out</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#f8fafc',
  },

  // Cards Section
  cardsSection: {
    marginBottom: 25,
  },

  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 5,
    gap: 12,
  },

  // Modern Cards
  modernCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '48%',
    minHeight: 180,
    marginBottom: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  cardHeader: {
    padding: 18,
    paddingBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    position: 'relative',
  },
  cardIcon: {
    fontSize: 26,
    textAlign: 'center',
  },
  cardBody: {
    paddingHorizontal: 10,
    paddingBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modernCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1a202c',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 6,
    letterSpacing: 0.2,
    paddingHorizontal: 2,
  },
  modernCardDescription: {
    fontSize: 10.5,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '500',
    paddingHorizontal: 4,
  },

  // Card gradient overlay
  cardGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
    borderRadius: 24,
  },

  // Shine effect
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: '-50%',
    width: '200%',
    height: '50%',
    background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
    transform: [{ rotate: '45deg' }],
  },

  // Border glow effect
  borderGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },

  // Stats Section
  statsSection: {
    marginBottom: 30,
    paddingHorizontal: 5,
    backgroundColor: 'transparent',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '48%',
    minHeight: 180,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  statHeader: {
    padding: 18,
    paddingBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    position: 'relative',
  },
  statIcon: {
    fontSize: 26,
    textAlign: 'center',
  },
  statBody: {
    paddingHorizontal: 10,
    paddingBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a202c',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  statLabel: {
    fontSize: 10.5,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '500',
    paddingHorizontal: 4,
  },
  statGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
    borderRadius: 24,
  },

  // Logout Section
  logoutSection: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 5,
  },
  modernLogoutButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 10,
    borderWidth: 0.5,
    borderColor: '#fed7d7',
    minWidth: 180,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIconContainer: {
    marginRight: 12,
  },
  logoutEmoji: {
    fontSize: 22,
  },
  logoutTextContainer: {
    alignItems: 'center',
  },
  modernLogoutText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e53e3e',
    letterSpacing: 0.3,
  },
});

export default Dashboard;
