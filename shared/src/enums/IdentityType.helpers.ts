import { IdentityType } from './IdentityType.enum';

// Labels para mostrar en UI
export const IdentityTypeLabels: Record<IdentityType, string> = {
  [IdentityType.CEDULA]: 'Cédula',
  [IdentityType.RUC]: 'RUC',
  [IdentityType.PASAPORTE]: 'Pasaporte',
};

// Helper para obtener label
export const getIdentityTypeLabel = (type: IdentityType): string => {
  return IdentityTypeLabels[type];
};

// Helper para obtener opciones de select
export const getIdentityTypeOptions = () => {
  return Object.values(IdentityType).map(value => ({
    value,
    label: IdentityTypeLabels[value],
  }));
};
