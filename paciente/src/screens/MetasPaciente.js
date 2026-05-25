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
  const [updatingId, setUpdatingId] = useState(null);

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
      if (response.ok) {
        const metasComAtraso = (data.goals || []).map(meta => ({
          ...meta,
          isOverdue: verificarAtraso(meta.prazo, meta.status)
        }));
        setMetasList(metasComAtraso);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const verificarAtraso = (prazo, status) => {
    if (!prazo || prazo === 'Sem prazo definido') return false;
    if (status === 'concluido') return false;
    
    const partes = prazo.split('/');
    if (partes.length !== 3) return false;
    
    const dataPrazo = new Date(partes[2], partes[1] - 1, partes[0]);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    return dataPrazo < hoje;
  };

  const atualizarStatusMeta = async (metaId, novoStatus) => {
    setUpdatingId(metaId);
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      
      let progressoTexto = '';
      if (novoStatus === 'concluido') progressoTexto = 'Concluído!';
      else if (novoStatus === 'andamento') progressoTexto = 'Em andamento';
      else progressoTexto = 'Não iniciada';
      
      const response = await fetch(`${API_URL}/patients/${user.id}/goals/${metaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: novoStatus, progresso: progressoTexto })
      });
      
      if (response.ok) {
        await carregarMetas();
        Alert.alert('Sucesso', `Meta ${novoStatus === 'concluido' ? 'concluída' : 'iniciada'} com sucesso!`);
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar a meta');
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível atualizar a meta');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status, isOverdue) => {
    if (status === 'concluido') return '#22C55E';
    if (status === 'andamento') return '#F59E0B';
    if (isOverdue && status !== 'concluido') return '#EF4444';
    return '#B367D4';
  };

  const getStatusLabel = (status, isOverdue) => {
    if (status === 'concluido') return 'Concluída';
    if (status === 'andamento') return 'Em progresso';
    if (isOverdue) return 'Em atraso';
    return 'Ativa';
  };

  const metasAtivas = metasList.filter(m => m.status !== 'concluido' && m.status !== 'andamento' && !m.isOverdue);
  const metasEmProgresso = metasList.filter(m => m.status === 'andamento' && !m.isOverdue);
  const metasEmAtraso = metasList.filter(m => m.isOverdue && m.status !== 'concluido');
  const metasConcluidas = metasList.filter(m => m.status === 'concluido');

  const renderMetaCard = (meta, showActions = true) => {
    const isOverdue = meta.isOverdue;
    const statusColor = getStatusColor(meta.status, isOverdue);
    const statusLabel = getStatusLabel(meta.status, isOverdue);
    const isUpdating = updatingId === meta.id;
    
    return (
      <View key={meta.id} style={[styles.metaCard, isOverdue && styles.metaOverdue, meta.status === 'concluido' && styles.metaCompleted]}>
        <View style={styles.metaHeader}>
          <View style={styles.metaInfo}>
            <View style={[styles.metaCategoryBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.metaCategoryText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>
            <Text style={[styles.metaTitle, meta.status === 'concluido' && styles.metaTitleCompleted]}>{meta.titulo}</Text>
            <Text style={styles.metaDescription}>{meta.progresso || 'Meta cadastrada'}</Text>
            {meta.prazo && meta.prazo !== 'Sem prazo definido' && (
              <View style={[styles.prazoRow, isOverdue && styles.prazoRowOverdue]}>
                <Icon name="calendar" size={12} color={isOverdue ? '#EF4444' : '#94A3B8'} />
                <Text style={[styles.prazoText, isOverdue && styles.prazoTextOverdue]}>
                  Prazo: {meta.prazo} {isOverdue && '(Atrasada)'}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {showActions && meta.status !== 'concluido' && (
          <View style={styles.metaActions}>
            {meta.status !== 'andamento' && (
              <TouchableOpacity 
                style={[styles.actionButton, isOverdue ? styles.overdueButton : styles.startButton]} 
                onPress={() => atualizarStatusMeta(meta.id, 'andamento')}
                disabled={isUpdating}
              >
                {isUpdating ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                  <Text style={styles.actionButtonText}>
                    {isOverdue ? 'Iniciar mesmo assim' : 'Iniciar'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            {meta.status === 'andamento' && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.completeButton]} 
                onPress={() => atualizarStatusMeta(meta.id, 'concluido')}
                disabled={isUpdating}
              >
                {isUpdating ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.actionButtonText}>Concluir</Text>}
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {meta.status === 'concluido' && (
          <View style={styles.completedIconContainer}>
            <Icon name="check-circle" size={24} color="#22C55E" />
          </View>
        )}
      </View>
    );
  };

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
              <View style={[styles.statDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.statTitle}>Em progresso</Text>
            </View>
            <Text style={styles.statNumber}>{metasEmProgresso.length}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.statTitle}>Em atraso</Text>
            </View>
            <Text style={styles.statNumber}>{metasEmAtraso.length}</Text>
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
              {metasEmAtraso.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>⚠️ Em atraso</Text>
                  {metasEmAtraso.map(meta => renderMetaCard(meta, true))}
                </>
              )}
              
              {metasAtivas.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>📌 Ativas</Text>
                  {metasAtivas.map(meta => renderMetaCard(meta, true))}
                </>
              )}
              
              {metasEmProgresso.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>⚡ Em progresso</Text>
                  {metasEmProgresso.map(meta => renderMetaCard(meta, true))}
                </>
              )}
              
              {metasConcluidas.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>✅ Concluídas</Text>
                  {metasConcluidas.map(meta => renderMetaCard(meta, false))}
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
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('DiarioPaciente')}>
          <Icon name="book-open" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Diário</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="target" size={20} color="#B367D4" />
          <Text style={[styles.navText, styles.navTextActive]}>Metas</Text>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statTitle: {
    fontSize: 11,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 15,
  },
  statNumber: {
    fontSize: 28,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 36,
  },
  metasContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 4,
  },
  metaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  metaOverdue: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
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
    gap: 6,
  },
  metaCategoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  metaCategoryText: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  metaTitle: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
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
  prazoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  prazoRowOverdue: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  prazoText: {
    fontSize: 11,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#94A3B8',
  },
  prazoTextOverdue: {
    color: '#DC2626',
  },
  metaActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#B367D4',
  },
  completeButton: {
    backgroundColor: '#22C55E',
  },
  overdueButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 13,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completedIconContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
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