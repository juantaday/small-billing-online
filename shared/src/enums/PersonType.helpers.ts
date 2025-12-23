import { PersonType } from '@prisma/client';

// Labels para mostrar en UI
export const PersonTypeLabels: Record<PersonType, string> = {
  [PersonType.NATURAL]: 'Persona Natural',
  [PersonType.JURIDICA]: 'Persona Jurídica',
};

// Helper para obtener label
export const getPersonTypeLabel = (type: PersonType): string => {
  return PersonTypeLabels[type];
};

// Helper para obtener opciones de select
export const getPersonTypeOptions = () => {
  return Object.values(PersonType).map(value => ({
    value,
    label: PersonTypeLabels[value],
  }));
};
