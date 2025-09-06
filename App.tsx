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
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor="#2E86AB"
      />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
