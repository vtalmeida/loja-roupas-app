import React, { forwardRef } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import colors from '../theme/colors';

// Importar as telas
import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import CustomersScreen from '../screens/CustomersScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator para cada aba
function ProductsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProductsList" 
        component={ProductsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function CustomersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CustomersList" 
        component={CustomersScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}


function OrdersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="OrdersList" 
        component={OrdersScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function ReportsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ReportsList" 
        component={ReportsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function SettingsStack({ sharedFile, onFileProcessed }) {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SettingsList" 
        options={{ headerShown: false }}
      >
        {(props) => <SettingsScreen {...props} sharedFile={sharedFile} onFileProcessed={onFileProcessed} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Tab Navigator principal
function MainTabNavigator({ sharedFile, onFileProcessed }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = '🏠';
          } else if (route.name === 'Products') {
            iconName = '📦';
          } else if (route.name === 'Customers') {
            iconName = '👤';
          } else if (route.name === 'Orders') {
            iconName = '📋';
          } else if (route.name === 'Reports') {
            iconName = '📊';
          } else if (route.name === 'Settings') {
            iconName = '⚙️';
          }

          return (
            <Text style={{ fontSize: size, color }}>
              {iconName}
            </Text>
          );
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.backgroundSecondary,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'Início',
          tabBarLabel: 'Início'
        }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsStack}
        options={{ 
          title: 'Produtos',
          tabBarLabel: 'Produtos'
        }}
      />
      <Tab.Screen 
        name="Customers" 
        component={CustomersStack}
        options={{ 
          title: 'Clientes',
          tabBarLabel: 'Clientes'
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersStack}
        options={{ 
          title: 'Pedidos',
          tabBarLabel: 'Pedidos'
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsStack}
        options={{ 
          title: 'Relatórios',
          tabBarLabel: 'Relatórios'
        }}
      />
      <Tab.Screen 
        name="Settings" 
        options={{ 
          title: 'Configurações',
          tabBarLabel: 'Configurações'
        }}
      >
        {(props) => <SettingsStack {...props} sharedFile={sharedFile} onFileProcessed={onFileProcessed} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Navigator principal
const AppNavigator = forwardRef(({ sharedFile, onFileProcessed }, ref) => {
  return (
    <NavigationContainer ref={ref}>
      <MainTabNavigator sharedFile={sharedFile} onFileProcessed={onFileProcessed} />
    </NavigationContainer>
  );
});

export default AppNavigator;
