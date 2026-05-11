import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AmbienteTeste from './src/screens/ambienteTeste';

import VisaoGeral from './src/screens/visionBoard/visaoGeral';
import Pacientes from './src/screens/allVision/pacientes';
import DashboardPaciente from './src/screens/userProfile/perfilUsuario';
import CadastroPaciente from './src/screens/userSignUp/cadastroPaciente';
import Configuracoes from './src/screens/Configs/configuracoes';
import Relatorios from './src/screens/Files/RelatoriosPsicologo';

import LoginPaciente from './pacinte/src/screens/LoginPaciente';
import HomePaciente from './pacinte/src/screens/HomePaciente';
import MetasPaciente from './pacinte/src/screens/MetasPaciente';
import DiarioPaciente from './pacinte/src/screens/DiarioPaciente';
import PerfilPaciente from './pacinte/src/screens/PerfilPaciente';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AmbienteTeste">
        <Stack.Screen name="AmbienteTeste" component={AmbienteTeste} options={{ headerShown: false }} />
        
        <Stack.Screen name="VisaoGeral" component={VisaoGeral} options={{ headerShown: false }} />
        <Stack.Screen name="Pacientes" component={Pacientes} options={{ headerShown: false }} />
        <Stack.Screen name="DashboardPaciente" component={DashboardPaciente} options={{ headerShown: false }} />
        <Stack.Screen name="CadastroPaciente" component={CadastroPaciente} options={{ headerShown: false }} />
        <Stack.Screen name="Configuracoes" component={Configuracoes} options={{ headerShown: false }} />
        <Stack.Screen name="Relatorios" component={Relatorios} options={{ headerShown: false }} />
        
        <Stack.Screen name="LoginPaciente" component={LoginPaciente} options={{ headerShown: false }} />
        <Stack.Screen name="HomePaciente" component={HomePaciente} options={{ headerShown: false }} />
        <Stack.Screen name="MetasPaciente" component={MetasPaciente} options={{ headerShown: false }} />
        <Stack.Screen name="DiarioPaciente" component={DiarioPaciente} options={{ headerShown: false }} />
        <Stack.Screen name="PerfilPaciente" component={PerfilPaciente} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}