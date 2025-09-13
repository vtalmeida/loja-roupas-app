/**
 * Loja de Roupas App
 * Sistema de controle de loja de roupas
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import Database from './src/database/database';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    // Inicializar o banco de dados quando o app iniciar
    Database.init().catch(error => {
      console.error('Erro ao inicializar banco de dados:', error);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#F2D1D3"
      />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
