import database from '@react-native-firebase/database';

/**
 * Firebase Service for VoterSearch App
 * Handles all Realtime Database operations
 */

class FirebaseService {
  constructor() {
    // Initialize database - the database URL is configured in google-services.json
    this.db = database();
  }

  /**
   * Test Firebase connection
   */
  async testConnection() {
    try {
      const connectedRef = database().ref('.info/connected');
      const snapshot = await connectedRef.once('value');
      const isConnected = snapshot.val() === true;
      console.log('Firebase connection status:', isConnected);
      
      // Test write permissions
      if (isConnected) {
        console.log('🔍 Testing write permissions...');
        try {
          await this.db.ref('test_connection').set({
            timestamp: Date.now(),
            message: 'Connection test'
          });
          console.log('✅ Write permission test PASSED');
          
          // Clean up test data
          await this.db.ref('test_connection').remove();
        } catch (writeError) {
          console.error('❌ Write permission test FAILED:', writeError);
          console.error('   This means your database rules are blocking writes!');
          console.error('   Error code:', writeError.code);
          console.error('   Error message:', writeError.message);
        }
      }
      
      return isConnected;
    } catch (error) {
      console.error('Firebase connection error:', error);
      return false;
    }
  }

  /**
   * Save voter status color (green/yellow/red)
   */
  async saveVoterStatus(datasetId, voterId, statusColor) {
    try {
      const path = `datasets/${datasetId}/voters/${voterId}/status`;
      console.log('🔥 Saving to Firebase:', path, '=', statusColor);
      await this.db.ref(path).set(statusColor);
      console.log('✅ Firebase save successful:', path);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving voter status:', error);
      console.error('   Path:', `datasets/${datasetId}/voters/${voterId}/status`);
      console.error('   Value:', statusColor);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get voter status color
   */
  async getVoterStatus(datasetId, voterId) {
    try {
      const snapshot = await this.db.ref(`datasets/${datasetId}/voters/${voterId}/status`).once('value');
      return snapshot.val();
    } catch (error) {
      console.error('Error getting voter status:', error);
      return null;
    }
  }

  /**
   * Save voter mobile number
   */
  async saveVoterMobile(datasetId, voterId, mobile) {
    try {
      const path = `datasets/${datasetId}/voters/${voterId}/mobile`;
      console.log('🔥 Saving mobile to Firebase:', path, '=', mobile);
      await this.db.ref(path).set(mobile);
      console.log('✅ Firebase mobile save successful:', path);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving voter mobile:', error);
      console.error('   Path:', `datasets/${datasetId}/voters/${voterId}/mobile`);
      console.error('   Value:', mobile);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get voter mobile number
   */
  async getVoterMobile(datasetId, voterId) {
    try {
      const snapshot = await this.db.ref(`datasets/${datasetId}/voters/${voterId}/mobile`).once('value');
      return snapshot.val();
    } catch (error) {
      console.error('Error getting voter mobile:', error);
      return null;
    }
  }

  /**
   * Save voter custom data (Migrant, Dead, Out Of Town)
   */
  async saveVoterCustomData(datasetId, voterId, customData) {
    try {
      const path = `datasets/${datasetId}/voters/${voterId}/custom`;
      console.log('🔥 Saving custom data to Firebase:', path, '=', JSON.stringify(customData));
      await this.db.ref(path).set(customData);
      console.log('✅ Firebase custom data save successful:', path);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving voter custom data:', error);
      console.error('   Path:', `datasets/${datasetId}/voters/${voterId}/custom`);
      console.error('   Value:', customData);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get voter custom data
   */
  async getVoterCustomData(datasetId, voterId) {
    try {
      const snapshot = await this.db.ref(`datasets/${datasetId}/voters/${voterId}/custom`).once('value');
      return snapshot.val() || { type: null, value: '' };
    } catch (error) {
      console.error('Error getting voter custom data:', error);
      return { type: null, value: '' };
    }
  }

  /**
   * Save voter found status
   */
  async saveVoterFoundStatus(datasetId, voterId, found) {
    try {
      await this.db.ref(`datasets/${datasetId}/voters/${voterId}/found`).set(found ? 'found' : null);
      return { success: true };
    } catch (error) {
      console.error('Error saving voter found status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get voter found status
   */
  async getVoterFoundStatus(datasetId, voterId) {
    try {
      const snapshot = await this.db.ref(`datasets/${datasetId}/voters/${voterId}/found`).once('value');
      return snapshot.val() === 'found';
    } catch (error) {
      console.error('Error getting voter found status:', error);
      return false;
    }
  }

  /**
   * Save voter quick blue status
   */
  async saveVoterQuickBlue(datasetId, voterId, isBlue) {
    try {
      await this.db.ref(`datasets/${datasetId}/voters/${voterId}/quickBlue`).set(isBlue ? '1' : null);
      return { success: true };
    } catch (error) {
      console.error('Error saving voter quick blue:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save voter responded status (blue button in SearchVoters)
   */
  async saveVoterResponded(datasetId, voterId, responded) {
    try {
      const path = `datasets/${datasetId}/voters/${voterId}/responded`;
      console.log('🔥 Saving responded status to Firebase:', path, '=', responded);
      await this.db.ref(path).set(responded);
      console.log('✅ Firebase responded status save successful:', path);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving voter responded status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get voter responded status
   */
  async getVoterResponded(datasetId, voterId) {
    try {
      const snapshot = await this.db.ref(`datasets/${datasetId}/voters/${voterId}/responded`).once('value');
      return snapshot.val() === true;
    } catch (error) {
      console.error('Error getting voter responded status:', error);
      return false;
    }
  }

  /**
   * Generic: Save arbitrary custom data under dataset or voter
   * - if id === 'all' it will save under datasets/<datasetId>/custom/<key>
   * - otherwise it will save under datasets/<datasetId>/voters/<id>/<key>
   */
  async saveCustomData(datasetId, id, key, value) {
    try {
      const path = id === 'all' ? `datasets/${datasetId}/custom/${key}` : `datasets/${datasetId}/voters/${id}/${key}`;
      console.log('🔥 Saving custom data to Firebase:', path);
      await this.db.ref(path).set(value);
      console.log('✅ Firebase custom data save successful:', path);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving custom data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generic: Get arbitrary custom data under dataset or voter
   */
  async getCustomData(datasetId, id, key) {
    try {
      const path = id === 'all' ? `datasets/${datasetId}/custom/${key}` : `datasets/${datasetId}/voters/${id}/${key}`;
      const snapshot = await this.db.ref(path).once('value');
      return snapshot.val();
    } catch (error) {
      console.error('Error getting custom data:', error);
      return null;
    }
  }

  /**
   * Get voter quick blue status
   */
  async getVoterQuickBlue(datasetId, voterId) {
    try {
      const snapshot = await this.db.ref(`datasets/${datasetId}/voters/${voterId}/quickBlue`).once('value');
      return snapshot.val() === '1';
    } catch (error) {
      console.error('Error getting voter quick blue:', error);
      return false;
    }
  }

  /**
   * Listen to real-time updates for a voter
   */
  listenToVoter(datasetId, voterId, callback) {
    const ref = this.db.ref(`datasets/${datasetId}/voters/${voterId}`);
    const listener = ref.on('value', (snapshot) => {
      callback(snapshot.val());
    });
    
    // Return unsubscribe function
    return () => ref.off('value', listener);
  }

  /**
   * Get all voters data for a dataset
   */
  async getAllVotersData(datasetId) {
    try {
      const snapshot = await this.db.ref(`datasets/${datasetId}/voters`).once('value');
      return snapshot.val() || {};
    } catch (error) {
      console.error('Error getting all voters data:', error);
      return {};
    }
  }

  /**
   * Batch update multiple voters
   */
  async batchUpdateVoters(datasetId, votersData) {
    try {
      const updates = {};
      Object.entries(votersData).forEach(([voterId, data]) => {
        if (data.status) updates[`datasets/${datasetId}/voters/${voterId}/status`] = data.status;
        if (data.mobile !== undefined) updates[`datasets/${datasetId}/voters/${voterId}/mobile`] = data.mobile;
        if (data.custom) updates[`datasets/${datasetId}/voters/${voterId}/custom`] = data.custom;
        if (data.found !== undefined) updates[`datasets/${datasetId}/voters/${voterId}/found`] = data.found;
        if (data.quickBlue !== undefined) updates[`datasets/${datasetId}/voters/${voterId}/quickBlue`] = data.quickBlue;
      });

      await this.db.ref().update(updates);
      return { success: true };
    } catch (error) {
      console.error('Error batch updating voters:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new FirebaseService();
