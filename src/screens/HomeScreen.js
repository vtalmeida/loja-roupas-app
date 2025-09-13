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
import colors from '../theme/colors';

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

  const QuickAction = ({ title, onPress, icon, color = colors.primary }) => (
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
          <Text style={styles.welcomeText}>Bru Moda Íntima</Text>
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction 
              title="Novo Produto" 
              icon="📦" 
              onPress={() => handleNavigationWithAction('Products', 'newProduct')}
              color={colors.backgroundSecondary}
            />
            <QuickAction 
              title="Novo Cliente" 
              icon="👤" 
              onPress={() => handleNavigationWithAction('Customers', 'newCustomer')}
              color={colors.backgroundSecondary}
            />
            <QuickAction 
              title="Novo Pedido" 
              icon="📋" 
              onPress={() => handleNavigationWithAction('Orders', 'newOrder')}
              color={colors.backgroundSecondary}
            />
            <QuickAction 
              title="Relatórios" 
              icon="📊" 
              onPress={() => navigation.navigate('Reports')}
              color={colors.backgroundSecondary}
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
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#D61A75',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
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
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
});

export default HomeScreen;
