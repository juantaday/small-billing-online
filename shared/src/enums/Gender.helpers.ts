import { Gender } from '@prisma/client';

// Labels para mostrar en UI
export const GenderLabels: Record<Gender, string> = {
  [Gender.MASCULINO]: 'Masculino',
  [Gender.FEMENINO]: 'Femenino',
  [Gender.OTRO]: 'Otro',
};

// Helper para obtener label
export const getGenderLabel = (gender: Gender): string => {
  return GenderLabels[gender];
};

// Helper para obtener opciones de select
export const getGenderOptions = () => {
  return Object.values(Gender).map(value => ({
    value,
    label: GenderLabels[value],
  }));
};
