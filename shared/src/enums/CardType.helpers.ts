import { CardType } from './CardType.enum';

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  [CardType.VISA]: 'Visa',
  [CardType.MASTERCARD]: 'Mastercard',
  [CardType.AMERICAN_EXPRESS]: 'American Express',
  [CardType.DINERS_CLUB]: 'Diners Club',
  [CardType.DISCOVER]: 'Discover',
  [CardType.OTHER]: 'Otra',
};

export const CARD_TYPE_OPTIONS: CardType[] = [
  CardType.VISA,
  CardType.MASTERCARD,
  CardType.AMERICAN_EXPRESS,
  CardType.DINERS_CLUB,
  CardType.DISCOVER,
  CardType.OTHER,
];

export function getCardTypeLabel(type: CardType): string {
  return CARD_TYPE_LABELS[type] || type;
}

export function getCardTypeOptions() {
  return CARD_TYPE_OPTIONS.map((value) => ({
    value,
    label: getCardTypeLabel(value),
  }));
}
