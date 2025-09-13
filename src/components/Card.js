import React from 'react';
import { View, StyleSheet } from 'react-native';
import colors from '../theme/colors';

const Card = ({ children, style, noMargin = false, ...props }) => {
  const cardStyle = noMargin ? [styles.card, styles.cardNoMargin, style] : [styles.card, style];
  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardNoMargin: {
    marginVertical: 0,
    marginHorizontal: 0,
  },
});

export default Card;

