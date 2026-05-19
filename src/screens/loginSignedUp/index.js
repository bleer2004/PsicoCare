import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { styles } from './styles';
import { API_URL } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginSignedUp = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Erro', data.error || 'E-mail ou senha incorretos.');
        return;
      }

      const tokenToSave = data.token || String(data.user.id);
      
      await AsyncStorage.setItem('token', tokenToSave);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      console.log('Login realizado com sucesso:', data.user);
      navigation.replace('VisaoGeral');
      
    } catch (err) {
      console.error("Erro na requisição de login:", err);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('Cadastro');
  };
  
  const handleForgotPassword = () => {
    navigation.navigate('RecuperarSenha');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Efeito de fundo blur */}
          <View style={styles.blurBackground}>
            <View style={styles.blurCircle} />
          </View>

          {/* Header com ícone */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <View style={styles.iconWrapper}>
                <View style={styles.iconPlaceholder} />
              </View>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>PsicoCare</Text>
            </View>
            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>
                Plataforma clínica de saúde mental.
              </Text>
            </View>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Login Title Section */}
            <View style={styles.loginHeader}>
              <View style={styles.loginTitleContainer}>
                <Text style={styles.loginTitle}>Login</Text>
              </View>
              <View style={styles.loginDescriptionContainer}>
                <Text style={styles.loginDescription}>
                  Acesse sua conta para gerenciar seus atendimentos e prontuários.
                </Text>
              </View>
            </View>

            {/* Input Fields Section */}
            <View style={styles.inputsSection}>
              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputLabelContainer}>
                  <Text style={styles.inputLabel}>E-mail profissional</Text>
                </View>
                <View style={styles.inputFieldContainer}>
                  <View style={styles.inputField}>
                    <TextInput
                      style={styles.input}
                      placeholder="exemplo@clinica.com.br"
                      placeholderTextColor="#94A3B8"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.inputIconEmail} />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputLabelContainer}>
                  <Text style={styles.inputLabel}>Senha</Text>
                </View>
                <View style={styles.inputFieldContainer}>
                  <View style={styles.inputFieldPassword}>
                    <TextInput
                      style={styles.input}
                      placeholder="Digite sua senha"
                      placeholderTextColor="#94A3B8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>
                  <View style={styles.inputIconLock} />
                  <View style={styles.inputIconEye} />
                </View>
              </View>

              {/* Forgot Password */}
              <View style={styles.forgotPasswordWrapper}>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <View style={styles.loginButtonWrapper}>
                <TouchableOpacity 
                  style={styles.loginButton} 
                  onPress={handleLogin} 
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <View style={styles.loginButtonShadow} />
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Entrar</Text>
                      <View style={styles.loginButtonArrow} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer Section */}
            <View style={styles.footerSection}>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Não possui cadastro?</Text>
                <View style={styles.dividerLine} />
              </View>
              
              <TouchableOpacity 
                style={styles.signUpButton} 
                onPress={handleSignUp}
                activeOpacity={0.7}
              >
                <Text style={styles.signUpText}>Cadastre-se já!</Text>
              </TouchableOpacity>
              
              <View style={styles.securityContainer}>
                <View style={styles.securityIcon} />
                <Text style={styles.securityText}>
                  Ambiente Seguro & Criptografado
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginSignedUp;