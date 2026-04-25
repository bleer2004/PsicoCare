import { initialize, requestPermission, readRecords } from 'react-native-health-connect';

export async function getDadosSaude() {
  try {
    console.log("Inicializando Health Connect...");

    const isInitialized = await initialize();
    if (!isInitialized) {
      throw new Error("Health Connect não disponível");
    }

    console.log("Pedindo permissões...");

    const granted = await requestPermission([
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'RestingHeartRate' },
      { accessType: 'read', recordType: 'HeartRateVariabilityRmssd' },
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'SleepSession' }, // ✅ CORRIGIDO
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'Distance' },
      { accessType: 'read', recordType: 'OxygenSaturation' },
      { accessType: 'read', recordType: 'BloodPressure' },
      { accessType: 'read', recordType: 'BodyTemperature' },
      { accessType: 'read', recordType: 'Weight' },
      { accessType: 'read', recordType: 'Height' },
    ]);

    if (!granted) {
      throw new Error("Permissões não concedidas pelo usuário");
    }

    console.log("Lendo dados...");

    const agora = new Date();
    const ontem = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
    const semanaPassada = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);

    const intervalo24h = {
      operator: 'between' as const,
      startTime: ontem.toISOString(),
      endTime: agora.toISOString(),
    };

    const intervalo7d = {
      operator: 'between' as const,
      startTime: semanaPassada.toISOString(),
      endTime: agora.toISOString(),
    };

   const [
  fc, fcRepouso, hrv, passos, sono,
  calorias, distancia, oxigenio,
  pressao, temperatura, peso, altura
    ] = await Promise.all([
      readRecords('HeartRate', { timeRangeFilter: intervalo7d }),
      readRecords('RestingHeartRate', { timeRangeFilter: intervalo7d }),
      readRecords('HeartRateVariabilityRmssd', { timeRangeFilter: intervalo7d }),
      readRecords('Steps', { timeRangeFilter: intervalo7d }),
      readRecords('SleepSession', { timeRangeFilter: intervalo7d }),
      readRecords('ActiveCaloriesBurned', { timeRangeFilter: intervalo7d }),
      readRecords('Distance', { timeRangeFilter: intervalo7d }),
      readRecords('OxygenSaturation', { timeRangeFilter: intervalo7d }),
      readRecords('BloodPressure', { timeRangeFilter: intervalo7d }),
      readRecords('BodyTemperature', { timeRangeFilter: intervalo7d }),
      readRecords('Weight', { timeRangeFilter: intervalo7d }),
      readRecords('Height', { timeRangeFilter: intervalo7d }),
    ]);

    console.log("FC raw:", JSON.stringify(fc, null, 2));
    console.log("Passos raw:", JSON.stringify(passos, null, 2));
    console.log("Sono raw:", JSON.stringify(sono, null, 2));
    console.log("Pressao raw:", JSON.stringify(pressao, null, 2));
    console.log("Oxigenio raw:", JSON.stringify(oxigenio, null, 2));

    // 💤 Sono total
    const horasSono = sono.records.length > 0
      ? sono.records.reduce((acc, r) => {
          return acc + (
            new Date(r.endTime).getTime() -
            new Date(r.startTime).getTime()
          ) / (1000 * 60 * 60);
        }, 0)
      : null;

    // 💤 Fases do sono (seguro contra undefined)
    let faseSono = null;

    if (sono.records.length > 0) {
      const primeiraSessao: any = sono.records[0];

      if (primeiraSessao?.stages?.length > 0) {
        const calcHoras = (stageId: number) =>
          primeiraSessao.stages
            .filter((s: any) => s.stage === stageId)
            .reduce((acc: number, s: any) => {
              return acc + (
                new Date(s.endTime).getTime() -
                new Date(s.startTime).getTime()
              ) / (1000 * 60 * 60);
            }, 0);

        faseSono = {
          leve: parseFloat(calcHoras(4).toFixed(1)),
          profundo: parseFloat(calcHoras(5).toFixed(1)),
          rem: parseFloat(calcHoras(6).toFixed(1)),
        };
      }
    }

    return {
      frequenciaCardiaca: fc.records.at(-1)?.samples?.at(-1)?.beatsPerMinute ?? null,
      fcRepouso: fcRepouso.records.at(-1)?.beatsPerMinute ?? null,
      hrv: (hrv.records.at(-1) as any)?.heartRateVariabilityMillis ?? null,

      pressaoSistolica: (pressao.records.at(-1) as any)?.systolic?.inMillimetersOfMercury ?? null,
      pressaoDiastolica: (pressao.records.at(-1) as any)?.diastolic?.inMillimetersOfMercury ?? null,

      oxigenio: (oxigenio.records.at(-1) as any)?.percentage ?? null,
      temperatura: (temperatura.records.at(-1) as any)?.temperature?.inCelsius ?? null,

      passos: passos.records.reduce((acc, r) => acc + (r.count ?? 0), 0),

      distancia: parseFloat(
        (distancia.records.reduce((acc, r: any) =>
          acc + (r.distance?.inMeters ?? 0), 0
        ) / 1000).toFixed(2)
      ),

      caloriasAtivas: Math.round(
        calorias.records.reduce((acc, r: any) =>
          acc + (r.energy?.inKilocalories ?? 0), 0
        )
      ),

      sono: horasSono ? parseFloat(horasSono.toFixed(1)) : null,
      faseSono,

      peso: peso.records.at(-1)?.weight?.inKilograms ?? null,
      altura: altura.records.at(-1)?.height?.inMeters ?? null,
    };

  } catch (err: any) {
    console.error('Erro Health Connect:', err);
    throw new Error(err?.message || "Erro ao acessar dados de saúde");
  }
}