import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ navigation }) => {

  const handleNavigationWithAction = async (screenName, action) => {
    try {
      await AsyncStorage.setItem('pendingAction', action);
      navigation.navigate(screenName);
    } catch (error) {
      console.error('Erro ao salvar ação:', error);
      navigation.navigate(screenName);
    }
  };

  const QuickAction = ({ title, onPress, icon, color = '#2E86AB' }) => (
    <TouchableOpacity 
      style={[styles.quickAction, { backgroundColor: color }]} 
      onPress={onPress}
    >
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Bru Boutique</Text>
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction 
              title="Novo Produto" 
              icon="📦" 
              onPress={() => handleNavigationWithAction('Products', 'newProduct')}
              color="#28A745"
            />
            <QuickAction 
              title="Novo Cliente" 
              icon="👤" 
              onPress={() => handleNavigationWithAction('Customers', 'newCustomer')}
              color="#17A2B8"
            />
            <QuickAction 
              title="Novo Pedido" 
              icon="📋" 
              onPress={() => handleNavigationWithAction('Orders', 'newOrder')}
              color="#6F42C1"
            />
            <QuickAction 
              title="Relatórios" 
              icon="📊" 
              onPress={() => navigation.navigate('Reports')}
              color="#FFC107"
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#2E86AB',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  quickActionsContainer: {
    padding: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default HomeScreen;
