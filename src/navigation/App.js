import LoginSignedUp from '../screens/loginSignedUp';
import Cadastro from '../screens/signUpForm/cadastro';
import VisaoGeral from '../screens/visionBoard/visaoGeral';
import RecuperarSenha from '../screens/setUpPassword/recuperarSenha';
import Configuracoes from '../screens/Configs/configuracoes';

import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="LoginSignedUp">
      <Stack.Screen 
        name="LoginSignedUp" 
        component={LoginSignedUp}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Cadastro" 
        component={Cadastro}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="VisaoGeral" 
        component={VisaoGeral}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RecuperarSenha" 
        component={RecuperarSenha}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Configuracoes" 
        component={Configuracoes}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}