import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../../src/services/api';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, Alert, Modal, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const DiarioPaciente = ({ navigation }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [anotacao, setAnotacao] = useState('');
  const [sonhos, setSonhos] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [breathingModalVisible, setBreathingModalVisible] = useState(false);
  const [breathingStep, setBreathingStep] = useState(1);
  const [selectedAnotacao, setSelectedAnotacao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sharingId, setSharingId] = useState(null);
  const [anotacoes, setAnotacoes] = useState([]);

  const moods = [
    { id: 'feliz', label: 'Feliz', color: '#E3F2FD', iconColor: '#2563EB', emoji: '😃', valence: 8, arousal: 7 },
    { id: 'calmo', label: 'Calmo', color: '#E0F2F1', iconColor: '#0D9488', emoji: '😌', valence: 7, arousal: 3 },
    { id: 'ansioso', label: 'Ansioso', color: '#F3E5F5', iconColor: '#9333EA', emoji: '😰', valence: 3, arousal: 8 },
    { id: 'triste', label: 'Triste', color: '#FCE4EC', iconColor: '#DB2777', emoji: '😢', valence: 2, arousal: 2 },
    { id: 'neutral', label: 'Neutral', color: '#F1F5F9', iconColor: '#64748B', emoji: '😐', valence: 5, arousal: 5 },
  ];

  useEffect(() => {
    carregarHistorico();
    setBreathingModalVisible(true);
    iniciarContagemRespiração();
  }, []);

  const iniciarContagemRespiração = () => {
    let step = 1;
    const interval = setInterval(() => {
      if (step < 5) {
        step++;
        setBreathingStep(step);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setBreathingModalVisible(false);
        }, 500);
      }
    }, 1000);
    return () => clearInterval(interval);
  };

  const carregarHistorico = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      const response = await fetch(`${API_URL}/patients/${user.id}/moods?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        const formatados = (data.moods || [])
          .filter(m => m.diaryText || m.dreamText)
          .map((m, i) => ({
            id: String(i),
            humor: m.contextTags?.[0] || 'neutral',
            titulo: `Se sentindo ${m.contextTags?.[0] || 'neutral'}`,
            texto: m.diaryText || '',
            sonhos: m.dreamText || '',
            data: new Date(m.timestamp).toLocaleDateString('pt-BR'),
            shared: m.sharedWithPsychologist || false,
            moodId: m.id,
          }));
        setAnotacoes(formatados);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getMoodEmoji = (moodId) => moods.find(m => m.id === moodId)?.emoji || '😐';

  const handleSalvar = async () => {
    if (!selectedMood) {
      Alert.alert('Atenção', 'Selecione como você está se sentindo');
      return;
    }
    if (!anotacao.trim() && !sonhos.trim()) {
      Alert.alert('Atenção', 'Escreva sua anotação ou registre seus sonhos');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      const mood = moods.find(m => m.id === selectedMood);

      const response = await fetch(`${API_URL}/patients/${user.id}/moods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          valenceScore: mood.valence,
          arousalScore: mood.arousal,
          contextTags: [selectedMood],
          diaryText: anotacao,
          dreamText: sonhos,
        })
      });

      if (response.ok) {
        setSelectedMood(null);
        setAnotacao('');
        setSonhos('');
        Alert.alert('Sucesso', 'Anotação salva com sucesso!');
        await carregarHistorico();
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar a anotação');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarParaPsicologo = async (anotacaoItem) => {
    Alert.alert(
      'Enviar para psicólogo',
      'Deseja compartilhar esta anotação com seu psicólogo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            setSharingId(anotacaoItem.id);
            try {
              const token = await AsyncStorage.getItem('token');
              const userStr = await AsyncStorage.getItem('user');
              const user = JSON.parse(userStr);
              
              const response = await fetch(`${API_URL}/patients/${user.id}/moods/${anotacaoItem.moodId}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ sharedWithPsychologist: true })
              });

              if (response.ok) {
                Alert.alert('Sucesso', 'Anotação compartilhada com seu psicólogo!');
                await carregarHistorico();
              } else {
                Alert.alert('Erro', 'Não foi possível compartilhar a anotação');
              }
            } catch (err) {
              Alert.alert('Erro', 'Não foi possível compartilhar a anotação');
            } finally {
              setSharingId(null);
            }
          }
        }
      ]
    );
  };

  const handleEnviarAnotacaoAtual = () => {
    if (!anotacao.trim() && !sonhos.trim()) {
      Alert.alert('Atenção', 'Escreva algo antes de enviar para o psicólogo');
      return;
    }
    Alert.alert(
      'Enviar para psicólogo',
      'Deseja compartilhar esta anotação com seu psicólogo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enviar', onPress: () => handleSalvarComPartilha() }
      ]
    );
  };

  const handleSalvarComPartilha = async () => {
    if (!selectedMood) {
      Alert.alert('Atenção', 'Selecione como você está se sentindo');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      const mood = moods.find(m => m.id === selectedMood);

      const response = await fetch(`${API_URL}/patients/${user.id}/moods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          valenceScore: mood.valence,
          arousalScore: mood.arousal,
          contextTags: [selectedMood],
          diaryText: anotacao,
          dreamText: sonhos,
          sharedWithPsychologist: true,
        })
      });

      if (response.ok) {
        setSelectedMood(null);
        setAnotacao('');
        setSonhos('');
        Alert.alert('Sucesso', 'Anotação salva e compartilhada com seu psicólogo!');
        await carregarHistorico();
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar a anotação');
    } finally {
      setLoading(false);
    }
  };

  const renderBreathingModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={breathingModalVisible}
      onRequestClose={() => setBreathingModalVisible(false)}
    >
      <View style={styles.breathingOverlay}>
        <View style={styles.breathingContainer}>
          <View style={styles.breathingCircle}>
            <Text style={styles.breathingNumber}>{breathingStep}</Text>
          </View>
          <Text style={styles.breathingTitle}>Respire fundo...</Text>
          <Text style={styles.breathingSubtitle}>
            Inspire e expire lentamente enquanto escreve o que vem à sua mente
          </Text>
          <TouchableOpacity 
            style={styles.breathingSkipButton} 
            onPress={() => setBreathingModalVisible(false)}
          >
            <Text style={styles.breathingSkipText}>Pular</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
      
      {renderBreathingModal()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color="#B367D4" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Diário emocional</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Seção de Humor */}
        <View style={styles.moodSection}>
          <Text style={styles.moodTitle}>Como você está se sentindo hoje?</Text>
          <View style={styles.moodContainer}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[styles.moodItem, selectedMood === mood.id && styles.moodItemSelected]}
                onPress={() => setSelectedMood(mood.id)}
              >
                <View style={[styles.moodIconWrapper, { backgroundColor: mood.color }]}>
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                </View>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Seção de Anotação Diária */}
        <View style={styles.anotacaoSection}>
          <View style={styles.sectionLabelContainer}>
            <Icon name="edit-2" size={16} color="#B367D4" />
            <Text style={styles.sectionLabel}>Anotações do dia</Text>
          </View>
          <View style={styles.anotacaoContainer}>
            <TextInput
              style={styles.anotacaoInput}
              placeholder="Este é um local seguro, expresse suas ideias, pensamentos..."
              placeholderTextColor="#94A3B8"
              multiline
              value={anotacao}
              onChangeText={setAnotacao}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Seção de Anotação de Sonhos */}
        <View style={styles.dreamsSection}>
          <View style={styles.sectionLabelContainer}>
            <Icon name="moon" size={16} color="#B367D4" />
            <Text style={styles.sectionLabel}>Anotar sonhos</Text>
          </View>
          <View style={styles.dreamsContainer}>
            <TextInput
              style={styles.dreamsInput}
              placeholder="Registre seus sonhos, mesmo que pareçam desconexos..."
              placeholderTextColor="#94A3B8"
              multiline
              value={sonhos}
              onChangeText={setSonhos}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Botões de ação */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSalvar} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Salvar</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleEnviarAnotacaoAtual} disabled={loading}>
            <Icon name="send" size={18} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Enviar ao psicólogo</Text>
          </TouchableOpacity>
        </View>

        {/* Histórico de Anotações */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Anotações recentes</Text>
          {anotacoes.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="book-open" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>Nenhuma anotação ainda</Text>
            </View>
          ) : (
            anotacoes.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.anotacaoCard} 
                onPress={() => { setSelectedAnotacao(item); setModalVisible(true); }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.cardEmoji}>{getMoodEmoji(item.humor)}</Text>
                    <View>
                      <Text style={styles.cardTitle}>{item.titulo}</Text>
                      <Text style={styles.cardDate}>{item.data}</Text>
                    </View>
                  </View>
                  {!item.shared && (item.texto || item.sonhos) && (
                    <TouchableOpacity 
                      style={styles.shareIconButton} 
                      onPress={() => handleEnviarParaPsicologo(item)}
                      disabled={sharingId === item.id}
                    >
                      {sharingId === item.id ? (
                        <ActivityIndicator size="small" color="#B367D4" />
                      ) : (
                        <Icon name="send" size={16} color="#B367D4" />
                      )}
                    </TouchableOpacity>
                  )}
                  {item.shared && (
                    <View style={styles.sharedBadge}>
                      <Icon name="check-circle" size={12} color="#10B981" />
                      <Text style={styles.sharedText}>Compartilhado</Text>
                    </View>
                  )}
                </View>
                
                {/* Anotações diárias */}
                {item.texto && (
                  <Text style={styles.cardText} numberOfLines={2}>{item.texto}</Text>
                )}
                
                {/* Sonhos - com azul mais claro */}
                {item.sonhos && (
                  <View style={styles.dreamsPreview}>
                    <Icon name="moon" size={14} color="#3B82F6" />
                    <Text style={styles.dreamsPreviewText} numberOfLines={2}>
                      {item.sonhos}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal de Detalhes da Anotação */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes da anotação</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {selectedAnotacao && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.modalMood}>
                  <Text style={styles.modalEmoji}>{getMoodEmoji(selectedAnotacao.humor)}</Text>
                  <Text style={styles.modalMoodText}>{selectedAnotacao.titulo}</Text>
                </View>
                <Text style={styles.modalDate}>{selectedAnotacao.data}</Text>
                
                {selectedAnotacao.texto && (
                  <>
                    <Text style={styles.modalSubtitle}>📝 Anotações</Text>
                    <Text style={styles.modalText}>{selectedAnotacao.texto}</Text>
                  </>
                )}
                
                {selectedAnotacao.sonhos && (
                  <>
                    <Text style={[styles.modalSubtitle, styles.modalSubtitleDream]}>🌙 Sonhos</Text>
                    <Text style={[styles.modalText, styles.modalTextDream]}>{selectedAnotacao.sonhos}</Text>
                  </>
                )}
                
                {!selectedAnotacao.shared && (selectedAnotacao.texto || selectedAnotacao.sonhos) && (
                  <TouchableOpacity 
                    style={styles.modalPsychButton} 
                    onPress={() => {
                      handleEnviarParaPsicologo(selectedAnotacao);
                      setModalVisible(false);
                    }}
                  >
                    <Icon name="send" size={18} color="#B367D4" />
                    <Text style={styles.modalPsychText}>Compartilhar com psicólogo</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomePaciente')}>
          <Icon name="home" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="book-open" size={20} color="#B367D4" />
          <Text style={[styles.navText, styles.navTextActive]}>Diário</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MetasPaciente')}>
          <Icon name="target" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Metas</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43, 108, 238, 0.10)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 28,
  },
  headerPlaceholder: {
    width: 40,
  },
  moodSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  moodTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 28,
    marginBottom: 16,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F2EEF6',
  },
  moodItem: {
    alignItems: 'center',
    minWidth: 60,
    paddingHorizontal: 2,
  },
  moodItemSelected: {
    opacity: 0.7,
  },
  moodIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabel: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#475569',
    lineHeight: 16,
  },
  sectionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 20,
  },
  anotacaoSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  anotacaoContainer: {
    minHeight: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(43, 108, 238, 0.10)',
    padding: 16,
  },
  anotacaoInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 150,
  },
  dreamsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dreamsContainer: {
    minHeight: 140,
    backgroundColor: '#1E1B4B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
  },
  dreamsInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 110,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#B367D4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  shareButtonText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  recentSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 28,
    marginBottom: 16,
  },
  anotacaoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F2EEF6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardEmoji: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  cardDate: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '400',
    textTransform: 'uppercase',
    color: '#94A3B8',
    lineHeight: 15,
    letterSpacing: 0.5,
  },
  shareIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(179, 103, 212, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  sharedText: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#10B981',
  },
  cardText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#475569',
    lineHeight: 20,
  },
  // ESTILOS DOS SONHOS - AZUL MAIS CLARO
  dreamsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E7FF',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
  },
  dreamsPreviewText: {
    fontSize: 13,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#2563EB',
    flex: 1,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 12,
  },
  breathingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  breathingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(179, 103, 212, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#B367D4',
  },
  breathingNumber: {
    fontSize: 48,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#B367D4',
  },
  breathingTitle: {
    fontSize: 24,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  breathingSubtitle: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  breathingSkipButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  breathingSkipText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    padding: 20,
  },
  modalMood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  modalEmoji: {
    fontSize: 28,
  },
  modalMoodText: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#1F2937',
  },
  modalDate: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#94A3B8',
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
    marginTop: 16,
  },
  modalSubtitleDream: {
    color: '#2563EB',
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  modalTextDream: {
    color: '#1D4ED8',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
  },
  modalPsychButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  modalPsychText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#B367D4',
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

export default DiarioPaciente;