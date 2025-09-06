import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

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

function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SettingsList" 
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Tab Navigator principal
function MainTabNavigator() {
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
        tabBarActiveTintColor: '#2E86AB',
        tabBarInactiveTintColor: '#6C757D',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E9ECEF',
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
        component={SettingsStack}
        options={{ 
          title: 'Configurações',
          tabBarLabel: 'Configurações'
        }}
      />
    </Tab.Navigator>
  );
}

// Navigator principal
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <MainTabNavigator />
    </NavigationContainer>
  );
}
