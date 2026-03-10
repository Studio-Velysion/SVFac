/** Modes de paiement utilisés dans les factures et la comptabilité */
export const PAYMENT_METHODS = [
  { value: 'virement', label: 'Virement' },
  { value: 'carte_bancaire', label: 'Carte bancaire' },
  { value: 'especes', label: 'Espèces' },
];

export function getPaymentMethodLabel(value) {
  if (!value) return '';
  const found = PAYMENT_METHODS.find((m) => m.value === value);
  return found ? found.label : value;
}
