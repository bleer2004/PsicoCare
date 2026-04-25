import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { getDadosSaude } from '../../services/saudeService';

export default function Index() {
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarDados = async () => {
    setLoading(true);
    setErro(null);
    try {
      const dadosSaude = await getDadosSaude();
      setDados(dadosSaude);
    } catch (e: any) {
      console.error(e);
      setErro(e.message || 'Erro ao carregar dados do Health Connect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>PsicoCare 💜</Text>

        <View style={styles.cardAcao}>
          <Text style={styles.subtitulo}>Sincronize seus dados biométricos para análise.</Text>
          <Button
            title={loading ? "Sincronizando..." : "Carregar dados do relógio"}
            onPress={carregarDados}
            disabled={loading}
            color="#6B4EFF"
          />
        </View>

        {erro && (
          <View style={styles.errorBox}>
            <Text style={styles.erroTexto}>{erro}</Text>
          </View>
        )}

        {dados && (
          <View style={styles.dashboard}>
            
            <Text style={styles.secao}>❤️ Cardiovascular</Text>
            <Item label="Frequência Cardíaca" valor={dados.frequenciaCardiaca} unidade="bpm" />
            <Item label="FC em Repouso" valor={dados.fcRepouso} unidade="bpm" />
            <Item label="HRV (RMSSD)" valor={dados.hrv} unidade="ms" />
            <Item
              label="Pressão Arterial"
              valor={dados.pressaoSistolica && dados.pressaoDiastolica
                ? `${Math.round(dados.pressaoSistolica)}/${Math.round(dados.pressaoDiastolica)}`
                : null}
              unidade="mmHg"
            />
            <Item label="SpO2" valor={dados.oxigenio} unidade="%" />
            <Item label="Temp. Corporal" valor={dados.temperatura} unidade="°C" />

            <Text style={styles.secao}>🏃 Atividade</Text>
            <Item label="Passos Hoje" valor={dados.passos} />
            <Item label="Distância" valor={dados.distancia} unidade="km" />
            <Item label="Calorias Ativas" valor={dados.caloriasAtivas} unidade="kcal" />

            <Text style={styles.secao}>🌙 Sono (Últimas 24h)</Text>
            <Item label="Total de Sono" valor={dados.sono} unidade="h" />
            {dados.faseSono && (
              <View style={styles.fasesSonoBox}>
                <Item label=" - Sono Leve" valor={dados.faseSono.leve} unidade="h" />
                <Item label=" - Sono Profundo" valor={dados.faseSono.profundo} unidade="h" />
                <Item label=" - REM" valor={dados.faseSono.rem} unidade="h" />
              </View>
            )}

            <Text style={styles.secao}>🧍 Composição Corporal</Text>
            <Item label="Peso" valor={dados.peso} unidade="kg" />
            <Item label="Altura" valor={dados.altura} unidade="m" />

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Componente de Linha de Item
function Item({ label, valor, unidade }: { label: string, valor: any, unidade?: string }) {
  if (valor === null || valor === undefined) return null;
  
  return (
    <View style={styles.itemContainer}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.valor}>
        {valor}{unidade ? ` ${unidade}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 50,
  },
  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
  },
  subtitulo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  cardAcao: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#F8F7FF',
    borderRadius: 12,
  },
  dashboard: {
    marginTop: 10,
  },
  secao: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 10,
    color: '#444',
    borderLeftWidth: 4,
    borderLeftColor: '#6B4EFF',
    paddingLeft: 12,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  label: {
    fontSize: 15,
    color: '#555',
  },
  valor: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B4EFF',
  },
  fasesSonoBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  errorBox: {
    backgroundColor: '#FFEBEB',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  erroTexto: {
    color: '#D32F2F',
    textAlign: 'center',
    fontSize: 14,
  }
});