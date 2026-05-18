import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../../src/services/api';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const MetasPaciente = ({ navigation }) => {
  const [metasList, setMetasList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarMetas();
  }, []);

  const carregarMetas = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      const response = await fetch(`${API_URL}/patients/${user.id}/goals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setMetasList(data.goals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'concluido') return '#22C55E';
    if (status === 'andamento') return '#F59E0B';
    return '#B367D4';
  };

  const getStatusLabel = (status) => {
    if (status === 'concluido') return 'Concluído';
    if (status === 'andamento') return 'Em andamento';
    return 'Nova';
  };

  const metasAtivas = metasList.filter(m => m.status !== 'concluido');
  const metasConcluidas = metasList.filter(m => m.status === 'concluido');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Minhas metas</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.statTitle}>Concluídas</Text>
            </View>
            <Text style={styles.statNumber}>{metasConcluidas.length}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statDot, { backgroundColor: '#B367D4' }]} />
              <Text style={styles.statTitle}>Ativas</Text>
            </View>
            <Text style={styles.statNumber}>{metasAtivas.length}</Text>
          </View>
        </View>

        <View style={styles.metasContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#B367D4" style={{ marginTop: 40 }} />
          ) : metasList.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="target" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Nenhuma meta ainda</Text>
              <Text style={styles.emptyText}>Seu psicólogo ainda não cadastrou metas para você.</Text>
            </View>
          ) : (
            <>
              {metasAtivas.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Metas ativas</Text>
                  {metasAtivas.map((meta) => (
                    <View key={meta.id} style={styles.metaCard}>
                      <View style={styles.metaHeader}>
                        <View style={styles.metaInfo}>
                          <View style={[styles.metaCategoryBadge, { backgroundColor: getStatusColor(meta.status) + '20' }]}>
                            <Text style={[styles.metaCategoryText, { color: getStatusColor(meta.status) }]}>
                              {getStatusLabel(meta.status)}
                            </Text>
                          </View>
                          <Text style={styles.metaTitle}>{meta.titulo}</Text>
                          <Text style={styles.metaDescription}>{meta.progresso}</Text>
                          {meta.prazo && meta.prazo !== 'Sem prazo definido' && (
                            <View style={styles.prazoRow}>
                              <Icon name="calendar" size={12} color="#94A3B8" />
                              <Text style={styles.prazoText}>Prazo: {meta.prazo}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {metasConcluidas.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Concluídas</Text>
                  {metasConcluidas.map((meta) => (
                    <View key={meta.id} style={[styles.metaCard, styles.metaCompleted]}>
                      <View style={styles.metaHeader}>
                        <View style={styles.metaInfo}>
                          <View style={styles.completedBadge}>
                            <Icon name="check-circle" size={12} color="#22C55E" />
                            <Text style={styles.completedText}>Concluído</Text>
                          </View>
                          <Text style={[styles.metaTitle, styles.metaTitleCompleted]}>{meta.titulo}</Text>
                        </View>
                        <View style={styles.completedIconContainer}>
                          <Icon name="check" size={20} color="#FFFFFF" />
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomePaciente')}>
          <Icon name="home" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="target" size={20} color="#B367D4" />
          <Text style={[styles.navText, styles.navTextActive]}>Metas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('DiarioPaciente')}>
          <Icon name="book-open" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Diário</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('PerfilPaciente')}>
          <Icon name="user" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(246, 246, 248, 0.80)',
    backdropFilter: 'blur(6px)',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22.5,
  },
  headerAddButton: {
    width: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  addButtonInner: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(43, 108, 238, 0.10)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarRing: {
    width: 128,
    height: 128,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarInnerRing: {
    width: 116,
    height: 116,
    position: 'absolute',
    top: 6,
    left: 6,
    borderWidth: 8,
    borderColor: '#E2E8F0',
    borderRadius: 58,
  },
  avatarImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 128,
    height: 128,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#F6F6F8',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FACC15',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#F6F6F8',
  },
  levelText: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 15,
  },
  congratsContainer: {
    alignItems: 'center',
  },
  congratsTitle: {
    fontSize: 24,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 32,
    textAlign: 'center',
  },
  congratsSubtitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F2EEF6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(43, 108, 238, 0.10)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#64748B',
    lineHeight: 16,
    letterSpacing: 0.6,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Manrope',
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 32,
  },
  statTrend: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 16,
  },
  tabsContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tabsInner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(226, 232, 240, 0.50)',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#64748B',
    lineHeight: 20,
  },
  tabTextActive: {
    color: '#B367D4',
  },
  metasContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#94A3B8',
    lineHeight: 20,
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  metaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metaCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  metaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaInfo: {
    flex: 1,
    gap: 4,
  },
  metaCategoryBadge: {
    backgroundColor: 'rgba(43, 108, 238, 0.10)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  metaCategoryText: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    lineHeight: 15,
  },
  metaTitle: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 24,
  },
  metaTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  metaDescription: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 16,
  },
  metaMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: 8,
    gap: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#94A3B8',
    lineHeight: 15,
  },
  progressValue: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#94A3B8',
    lineHeight: 15,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 10,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#16A34A',
    lineHeight: 15,
  },
  completedIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#22C55E',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  historyButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  historyButtonText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#B367D4',
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navItemActive: {},
  navText: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 15,
  },
  navTextActive: {
    color: '#B367D4',
    fontWeight: '700',
  },
});

export default MetasPaciente;