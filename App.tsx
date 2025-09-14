import React, { useEffect, useState, useRef } from 'react';
import { StatusBar, Linking, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import Database from './src/database/database';

const AppNavigatorWrapper = React.forwardRef<any, { sharedFile: string | null; onFileProcessed: () => void }>((props, ref) => {
  return <AppNavigator ref={ref} {...props} />;
});

function App() {
  const [sharedFile, setSharedFile] = useState<string | null>(null);
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    Database.init().catch(error => {
      console.error('Erro ao inicializar banco de dados:', error);
    });

    const handleInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          setSharedFile(initialUrl);
        }
      } catch (error) {
        console.error('Erro ao capturar URL inicial:', error);
      }
    };

    const handleDeepLink = (event: { url: string }) => {
      setSharedFile(event.url);
    };

    handleInitialURL();
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (sharedFile) {
      processSharedFile(sharedFile);
    }
  }, [sharedFile]);

  const processSharedFile = async (fileUri: string | null) => {
    try {
      if (!fileUri || typeof fileUri !== 'string') {
        Alert.alert('Erro', 'Arquivo inválido ou não fornecido');
        setSharedFile(null);
        return;
      }
      
      if (fileUri.includes('.xlsx') || fileUri.includes('.xls') || fileUri.includes('excel') || fileUri.includes('spreadsheet')) {
        const fileName = fileUri.split('/').pop() || 'arquivo_excel.xlsx';
        
        Alert.alert(
          'Arquivo Excel Recebido',
          `Arquivo: ${fileName}\n\nDeseja importar os dados deste arquivo Excel para o app?`,
          [
            { 
              text: 'Cancelar', 
              style: 'cancel',
              onPress: () => setSharedFile(null)
            },
            { 
              text: 'Importar', 
              onPress: () => {
                setSharedFile(fileUri);
                setTimeout(() => {
                  if (navigationRef.current) {
                    navigationRef.current.navigate('Settings');
                  }
                }, 100);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Arquivo Não Suportado',
          'Este tipo de arquivo não é suportado. Use arquivos Excel (.xlsx ou .xls).',
          [{ text: 'OK', onPress: () => setSharedFile(null) }]
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', 'Erro ao processar arquivo: ' + errorMessage);
      setSharedFile(null);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#E8B4B8"
      />
      <AppNavigatorWrapper 
        ref={navigationRef}
        sharedFile={sharedFile} 
        onFileProcessed={() => setSharedFile(null)} 
      />
    </SafeAreaProvider>
  );
}

export default App;
