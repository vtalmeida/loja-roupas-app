// Utilitários de formatação para o app

/**
 * Formata um valor monetário para exibição brasileira
 * @param {string|number} value - Valor a ser formatado
 * @returns {string} - Valor formatado com vírgula e 2 casas decimais
 */
export const formatCurrency = (value) => {
  if (!value) return '0,00';
  const num = parseFloat(value);
  if (isNaN(num)) return '0,00';
  return num.toFixed(2).replace('.', ',');
};

/**
 * Formata um valor para exibição simples (apenas converte ponto para vírgula)
 * @param {string|number} value - Valor a ser formatado
 * @returns {string} - Valor com vírgula se tiver ponto
 */
export const formatSimpleCurrency = (value) => {
  if (!value) return '';
  return value.toString().replace('.', ',');
};

/**
 * Formata um número de telefone brasileiro
 * @param {string} phone - Número de telefone
 * @returns {string} - Telefone formatado (99) 99999-9999
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

/**
 * Formata um valor para entrada (remove formatação)
 * @param {string} value - Valor formatado
 * @returns {string} - Valor limpo para entrada
 */
export const cleanCurrencyValue = (value) => {
  if (!value) return '';
  return value.toString().replace(',', '.');
};
