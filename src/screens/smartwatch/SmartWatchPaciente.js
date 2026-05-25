import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const SmartwatchPaciente = ({ paciente, standalone = false }) => {
  const [conectado, setConectado] = useState(false); // false = sem conexão
  const [refreshing, setRefreshing] = useState(false);
  const [dadosSmartwatch, setDadosSmartwatch] = useState({
    batimentos: '--',
    nivelStress: '--',
    ultimaSincronizacao: null,
  });

  const handleConectar = () => {
    Alert.alert(
      'Conectar Smartwatch',
      'Para conectar seu dispositivo wearable, siga os passos:\n\n1. Abra o app do seu smartwatch\n2. Ative o Bluetooth\n3. Autorize a conexão com o ApsiCare\n\nDeseja tentar conectar agora?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Conectar', 
          onPress: () => {
            // Simular conexão
            Alert.alert('Conectando...', 'Aguardando pareamento do dispositivo');
            setTimeout(() => {
              setConectado(true);
              setDadosSmartwatch({
                batimentos: '72',
                nivelStress: 'Baixo',
                ultimaSincronizacao: new Date().toLocaleString(),
              });
              Alert.alert('Sucesso!', 'Smartwatch conectado com sucesso');
            }, 2000);
          }
        }
      ]
    );
  };

  const handleDesconectar = () => {
    Alert.alert(
      'Desconectar Smartwatch',
      'Tem certeza que deseja desconectar seu dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Desconectar', 
          style: 'destructive',
          onPress: () => {
            setConectado(false);
            setDadosSmartwatch({
              batimentos: '--',
              nivelStress: '--',
              ultimaSincronizacao: null,
            });
            Alert.alert('Desconectado', 'Smartwatch desconectado com sucesso');
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    if (!conectado) {
      Alert.alert('Dispositivo não conectado', 'Conecte seu smartwatch para sincronizar os dados');
      return;
    }
    
    setRefreshing(true);
    setTimeout(() => {
      setDadosSmartwatch({
        batimentos: String(Math.floor(Math.random() * (90 - 65 + 1) + 65)),
        nivelStress: ['Baixo', 'Médio', 'Alto'][Math.floor(Math.random() * 3)],
        ultimaSincronizacao: new Date().toLocaleString(),
      });
      setRefreshing(false);
      Alert.alert('Sincronizado!', 'Dados do smartwatch atualizados');
    }, 1500);
  };

  const renderDesconectado = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon name="watch" size={64} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>Nenhum dispositivo conectado</Text>
      <Text style={styles.emptyText}>
        Conecte seu smartwatch para acompanhar seus dados de saúde em tempo real.
      </Text>
      <TouchableOpacity style={styles.conectarButton} onPress={handleConectar}>
        <Icon name="bluetooth" size={20} color="#FFFFFF" />
        <Text style={styles.conectarButtonText}>Conectar Smartwatch</Text>
      </TouchableOpacity>
      
      <View style={styles.infoBox}>
        <Icon name="info" size={16} color="#6366F1" />
        <Text style={styles.infoText}>
          Compatível com Apple Watch, Galaxy Watch, Fitbit e dispositivos Wear OS
        </Text>
      </View>
    </View>
  );

  const renderConectado = () => (
    <>
      {/* Status da Conexão */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.statusBadge}>
            <Icon name="bluetooth" size={14} color="#10B981" />
            <Text style={styles.statusBadgeText}>Conectado</Text>
          </View>
          <TouchableOpacity onPress={handleDesconectar}>
            <Text style={styles.desconectarText}>Desconectar</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.ultimaSincronizacao}>
          Última sincronização: {dadosSmartwatch.ultimaSincronizacao || '--'}
        </Text>
      </View>

      {/* Cards de Dados */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
            <Icon name="activity" size={24} color="#EF4444" />
          </View>
          <Text style={styles.statValue}>{dadosSmartwatch.batimentos}</Text>
          <Text style={styles.statLabel}>BPM</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
            <Icon name="moon" size={24} color="#10B981" />
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#E0E7FF' }]}>
            <Icon name="trending-up" size={24} color="#6366F1" />
          </View>
          <Text style={styles.statValue}>{dadosSmartwatch.passos}</Text>
          <Text style={styles.statLabel}>Passos (hoje)</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
            <Icon name="flame" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>{dadosSmartwatch.calorias}</Text>
          <Text style={styles.statLabel}>Calorias (hoje)</Text>
        </View>
      </View>

      {/* Nível de Stress */}
      <View style={styles.stressCard}>
        <Text style={styles.stressTitle}>Nível de Stress</Text>
        <View style={styles.stressLevel}>
          <Text style={[
            styles.stressValue,
            dadosSmartwatch.nivelStress === 'Baixo' && styles.stressBaixo,
            dadosSmartwatch.nivelStress === 'Médio' && styles.stressMedio,
            dadosSmartwatch.nivelStress === 'Alto' && styles.stressAlto,
          ]}>
            {dadosSmartwatch.nivelStress}
          </Text>
        </View>
        <View style={styles.stressBarContainer}>
          <View style={[styles.stressBar, { width: dadosSmartwatch.nivelStress === 'Baixo' ? '33%' : dadosSmartwatch.nivelStress === 'Médio' ? '66%' : '100%' }]} />
        </View>
        <Text style={styles.stressDesc}>
          {dadosSmartwatch.nivelStress === 'Baixo' && 'Você está com níveis saudáveis de stress. Continue com suas práticas de mindfulness!'}
          {dadosSmartwatch.nivelStress === 'Médio' && 'Seu nível de stress está moderado. Considere exercícios de respiração.'}
          {dadosSmartwatch.nivelStress === 'Alto' && 'Seu nível de stress está elevado. Recomendamos contatar seu psicólogo.'}
        </Text>
      </View>

      {/* Botão Sincronizar */}
      <TouchableOpacity style={styles.sincronizarButton} onPress={onRefresh}>
        <Icon name="refresh-cw" size={18} color="#6366F1" />
        <Text style={styles.sincronizarText}>Sincronizar Agora</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {!conectado ? renderDesconectado() : renderConectado()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  // Estado Desconectado
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  conectarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
    marginBottom: 20,
  },
  conectarButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#4338CA',
  },
  // Estado Conectado
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  desconectarText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  ultimaSincronizacao: {
    fontSize: 11,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  stressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  stressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  stressLevel: {
    alignItems: 'center',
    marginBottom: 12,
  },
  stressValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  stressBaixo: {
    color: '#10B981',
  },
  stressMedio: {
    color: '#F59E0B',
  },
  stressAlto: {
    color: '#EF4444',
  },
  stressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  stressBar: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  stressDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  sincronizarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  sincronizarText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
  },
});

export default SmartwatchPaciente;