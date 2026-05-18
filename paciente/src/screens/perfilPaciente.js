import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../../src/services/api';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const PerfilPaciente = ({ navigation }) => {
  const [paciente, setPaciente] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      setPaciente(user);

      const response = await fetch(`${API_URL}/patients/${user.id}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setDocumentos(data.documents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => {
        await AsyncStorage.clear();
        navigation.replace('LoginPaciente');
      }}
    ]);
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      Alert.alert('Sincronização completa', 'Seus dados foram sincronizados com sucesso!');
    }, 2000);
  };

  const handleVerResumo = () => {
    Alert.alert('Resumo médico', 'Funcionalidade em desenvolvimento');
  };

  const getDocIcon = (tipo) => {
    if (!tipo) return { icon: 'file', color: '#6366F1', bg: '#EEF2FF' };
    const t = tipo.toUpperCase();
    if (t === 'PDF') return { icon: 'file-text', color: '#EF4444', bg: '#FEF2F2' };
    if (t === 'DOCX') return { icon: 'file', color: '#3B82F6', bg: '#EFF6FF' };
    return { icon: 'image', color: '#F59E0B', bg: '#FFFBEB' };
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color="#334155" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meus dados</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Icon name="log-out" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#B367D4" style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Documentos Compartilhados */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="folder" size={20} color="#B367D4" />
                <Text style={styles.sectionTitle}>Documentos Compartilhados</Text>
              </View>

              {documentos.length === 0 ? (
                <View style={styles.emptyDocs}>
                  <Icon name="folder" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyDocsText}>Nenhum documento compartilhado</Text>
                </View>
              ) : (
                documentos.map((doc) => {
                  const docStyle = getDocIcon(doc.tipo);
                  return (
                    <TouchableOpacity key={doc.id} style={styles.documentCard}>
                      <View style={[styles.documentIcon, { backgroundColor: docStyle.bg }]}>
                        <Icon name={docStyle.icon} size={20} color={docStyle.color} />
                      </View>
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentName}>{doc.nome}</Text>
                        <Text style={styles.documentMeta}>{doc.tipo} • {doc.tamanho}</Text>
                      </View>
                      <Icon name="download" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Smartwatch Connection */}
            <View style={styles.smartwatchSection}>
              <View style={styles.smartwatchCard}>
                <View style={styles.smartwatchGradient} />
                <View style={styles.smartwatchIcon}>
                  <Icon name="watch" size={42} color="#B367D4" />
                </View>
                <View style={styles.smartwatchBadge}>
                  <Text style={styles.smartwatchBadgeText}>Conectado com smartwatch Galaxy 5</Text>
                </View>
              </View>
            </View>

            {/* Última Sincronização */}
            <View style={styles.syncSection}>
              <View style={styles.syncCard}>
                <View>
                  <Text style={styles.syncLabel}>Última sincronização</Text>
                  <Text style={styles.syncValue}>Hoje, 10:30</Text>
                </View>
                <View style={styles.syncStatusIcon}>
                  <Icon name="check-circle" size={24} color="#16A34A" />
                </View>
              </View>
            </View>

            {/* Resumo Médico */}
            <View style={styles.section}>
              <Text style={styles.resumoTitle}>Resumo médico</Text>

              <TouchableOpacity style={styles.healthCard} onPress={handleVerResumo}>
                <View style={styles.healthHeader}>
                  <View style={[styles.healthIcon, { backgroundColor: '#FEF2F2' }]}>
                    <Icon name="heart" size={18} color="#EF4444" />
                  </View>
                  <View>
                    <Text style={styles.healthTitle}>Saúde cardíaca</Text>
                    <Text style={styles.healthSubtitle}>Seus batimentos estão estáveis</Text>
                  </View>
                </View>
                <View style={styles.healthValueRow}>
                  <Text style={styles.healthValue}>72</Text>
                  <Text style={styles.healthUnit}>BPM</Text>
                </View>
                <View style={styles.healthProgressBar}>
                  <View style={[styles.healthProgressFill, { width: '60%', backgroundColor: '#EF4444' }]} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.healthCard} onPress={handleVerResumo}>
                <View style={styles.healthHeader}>
                  <View style={[styles.healthIcon, { backgroundColor: '#EEF2FF' }]}>
                    <Icon name="moon" size={18} color="#6366F1" />
                  </View>
                  <View>
                    <Text style={styles.healthTitle}>Qualidade do sono</Text>
                    <Text style={styles.healthSubtitle}>Você possui um sono pesado</Text>
                  </View>
                </View>
                <View style={styles.sleepRow}>
                  <View style={styles.sleepValueRow}>
                    <Text style={styles.healthValue}>8.5</Text>
                    <Text style={styles.healthUnit}>Hours</Text>
                  </View>
                  <View style={styles.excellentBadge}>
                    <Text style={styles.excellentText}>Excellent</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Botão Sync */}
            <TouchableOpacity style={styles.syncButton} onPress={handleSync} disabled={syncing}>
              <Icon name="refresh-cw" size={18} color="#FFFFFF" style={styles.syncIcon} />
              <Text style={styles.syncButtonText}>{syncing ? 'Sincronizando...' : 'Sync Now'}</Text>
            </TouchableOpacity>

            {/* Sobre minha conta */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sobre minha conta</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Icon name="user" size={16} color="#B367D4" />
                  <Text style={styles.infoLabel}>Nome</Text>
                  <Text style={styles.infoValue}>{paciente?.name || '-'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="mail" size={16} color="#B367D4" />
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{paciente?.email || '-'}</Text>
                </View>
              </View>
            </View>

            {/* Botão Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Icon name="log-out" size={18} color="#FFFFFF" />
              <Text style={styles.logoutButtonText}>Sair da conta</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomePaciente')}>
          <Icon name="home" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('DiarioPaciente')}>
          <Icon name="book-open" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Diário</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MetasPaciente')}>
          <Icon name="target" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Metas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="user" size={20} color="#B367D4" />
          <Text style={[styles.navText, styles.navTextActive]}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F8' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 80 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Manrope', fontWeight: '700', color: '#0F172A', lineHeight: 28 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Manrope', fontWeight: '700', color: '#191B23', lineHeight: 22.5 },
  emptyDocs: { alignItems: 'center', paddingVertical: 32 },
  emptyDocsText: { fontSize: 14, color: '#9CA3AF', marginTop: 12 },
  documentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  documentIcon: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  documentInfo: { flex: 1 },
  documentName: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', color: '#0F172A', lineHeight: 20 },
  documentMeta: { fontSize: 10, fontFamily: 'Manrope', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', lineHeight: 15, letterSpacing: 0.5 },
  smartwatchSection: { paddingHorizontal: 16, marginTop: 16 },
  smartwatchCard: { backgroundColor: '#EEF2FF', borderRadius: 12, paddingVertical: 40, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(43, 108, 238, 0.10)', position: 'relative', overflow: 'hidden' },
  smartwatchGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 },
  smartwatchIcon: { marginBottom: 20 },
  smartwatchBadge: { backgroundColor: 'rgba(255, 255, 255, 0.80)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(43, 108, 238, 0.20)' },
  smartwatchBadgeText: { fontSize: 12, fontFamily: 'Manrope', fontWeight: '600', color: '#B367D4', lineHeight: 16 },
  syncSection: { paddingHorizontal: 16, marginTop: 16 },
  syncCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  syncLabel: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '500', color: '#64748B', lineHeight: 20 },
  syncValue: { fontSize: 20, fontFamily: 'Manrope', fontWeight: '700', color: '#0F172A', lineHeight: 28, marginTop: 4 },
  syncStatusIcon: { width: 48, height: 48, backgroundColor: '#DCFCE7', borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  resumoTitle: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', lineHeight: 20, letterSpacing: 1.4, marginBottom: 16 },
  healthCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  healthHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  healthIcon: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  healthTitle: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '700', color: '#0F172A', lineHeight: 24 },
  healthSubtitle: { fontSize: 12, fontFamily: 'Manrope', fontWeight: '400', color: '#64748B', lineHeight: 16 },
  healthValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 12 },
  healthValue: { fontSize: 30, fontFamily: 'Manrope', fontWeight: '700', color: '#0F172A', lineHeight: 36 },
  healthUnit: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '500', color: '#64748B', lineHeight: 24 },
  healthProgressBar: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 10, overflow: 'hidden' },
  healthProgressFill: { height: '100%', borderRadius: 10 },
  sleepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sleepValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  excellentBadge: { backgroundColor: '#E0E7FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  excellentText: { fontSize: 12, fontFamily: 'Manrope', fontWeight: '700', color: '#4338CA', lineHeight: 16 },
  syncButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#B367D4', borderRadius: 12, marginHorizontal: 16, marginTop: 24, marginBottom: 16, paddingVertical: 16, elevation: 4 },
  syncIcon: { marginRight: 8 },
  syncButtonText: { fontSize: 18, fontFamily: 'Manrope', fontWeight: '700', color: '#FFFFFF', lineHeight: 28 },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 8 },
  infoLabel: { fontSize: 14, color: '#64748B', flex: 1 },
  infoValue: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444', borderRadius: 12, marginHorizontal: 16, marginTop: 16, marginBottom: 32, paddingVertical: 14, gap: 8 },
  logoutButtonText: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '700', color: '#FFFFFF' },
  bottomNavigation: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.90)', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingVertical: 12, paddingHorizontal: 24, justifyContent: 'space-between', position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center', gap: 4 },
  navItemActive: {},
  navText: { fontSize: 10, fontFamily: 'Manrope', fontWeight: '700', color: '#94A3B8', lineHeight: 15 },
  navTextActive: { color: '#B367D4' },
});

export default PerfilPaciente;