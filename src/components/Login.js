import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  // Image, // Image is imported but not used, safe to keep or remove
} from 'react-native';

const { width, height } = Dimensions.get('window');

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('⚠️ Missing Information', 'Please fill in all fields to continue');
      return;
    }

    // Simple validation for demo purposes
    if (email.length < 3 || password.length < 6) {
      Alert.alert('🚫 Invalid Credentials', 'Please enter valid credentials (min 3 chars for username, 6 for password)');
      return;
    }

    setIsLoading(true);

    // Hardcoded credentials for demo: hupari8 / Ward@8
    if (email.toLowerCase() === 'hupari8' && password === 'Ward@8') {
      setIsLoading(false);
      // Direct navigation to dashboard
      onLogin(true);
    } else {
      setIsLoading(false);
      Alert.alert('🚫 Login Failed', 'Invalid username or password.');
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.loginContainer}>
          {/* Background Decoration */}
          <View style={styles.backgroundDecoration}>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.circle3} />
          </View>

          {/* Header Section */}
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              {/* Corrected: The profileEmoji style definition was outside the StyleSheet.create block */}
              <Text style={styles.profileEmoji}>🏛️</Text>
              <Text style={styles.title}>Ward 8</Text>
              {/* <Text style={styles.subtitle}>श्री अनिल बाळू पवार</Text>
              <View style={styles.titleUnderline} /> */}
            </View>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>👤 UserName</Text>
              <TextInput
                style={[styles.input, email.length > 0 && styles.inputFocused]}
                placeholder="Enter your username"
                placeholderTextColor="#AAB7C4"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>🔐 Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, password.length > 0 && styles.inputFocused]}
                  placeholder="Enter your password"
                  placeholderTextColor="#AAB7C4"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={togglePasswordVisibility}
                  disabled={isLoading}
                >
                  <Text style={styles.eyeIcon}>
                    {isPasswordVisible ? '👁️' : '🙈'}
                  </Text>
                </TouchableOpacity>
              </View>
              {!isPasswordVisible && password.length > 0 && (
                <Text style={styles.secureText}>
                  🔒 Password is secured and hidden
                </Text>
              )}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? '🔄 Logging in...' : '🚀 Login'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>🤔 Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A90E2',
  },
  keyboardContainer: {
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    position: 'relative',
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  circle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: '10%',
    right: '15%',
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: '20%',
    left: '10%',
  },
  circle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: '60%',
    right: '20%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 35,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 25,
    paddingVertical: 28,
    paddingHorizontal: 36,
    // backdropFilter is a web property, may not work in standard RN
    // backdropFilter: 'blur(10px)', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  // Corrected: Moved profileEmoji style property into the StyleSheet.create block
  profileEmoji: {
    fontSize: 70,
    marginBottom: 14,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    elevation: 8
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 14,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Zapfino' : 'serif',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    marginBottom: 8,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: '#FFD700',
    borderRadius: 2,
    marginTop: 6,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
    zIndex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    marginBottom: 8,
    color: '#2C3E50',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E8F0FE',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 15,
    backgroundColor: '#F8FBFF',
    color: '#2C3E50',
    fontWeight: '500',
    // transition is a web property, not standard RN
    // transition: 'all 0.3s ease', 
  },
  inputFocused: {
    borderColor: '#4A90E2',
    backgroundColor: '#F0F8FF',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8F0FE',
    borderRadius: 12,
    backgroundColor: '#F8FBFF',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2C3E50',
    fontWeight: '500',
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  eyeIcon: {
    fontSize: 20,
  },
  secureText: {
    fontSize: 11,
    color: '#27AE60',
    marginTop: 5,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#AAB7C4',
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  forgotPassword: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default Login;