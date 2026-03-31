import { CardType } from './CardType.enum';

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  [CardType.VISA]: 'Visa',
  [CardType.MASTERCARD]: 'Mastercard',
  [CardType.AMERICAN_EXPRESS]: 'American Express',
  [CardType.DINERS_CLUB]: 'Diners Club',
  [CardType.DISCOVER]: 'Discover',
  [CardType.OTHER]: 'Otra',
};

export function getCardTypeLabel(type: CardType): string {
  return CARD_TYPE_LABELS[type] || type;
}
