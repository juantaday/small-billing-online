import { BusinessDetailsDto } from '@small-billing/shared';
import { BusinessTypeGroup } from '@small-billing/shared'; // ← el enum de TU librería
import { Prisma } from '@prisma/client';
import { mapEnum } from 'src/common/utils/enum.utils';

// Tipo que retorna Prisma con el include
type BusinessDetailsWithRelations = Prisma.BusinessDetailsGetPayload<{
  include: {
    legalNature: true;
    taxRegime: true;
    specialDesignation: true;
  };
}>;

export function toBusinessDetailsDto(entity: BusinessDetailsWithRelations): BusinessDetailsDto {
  return {
    id:             entity.id,
    ruc:            entity.ruc,
    legalName:      entity.legalName,
    commercialName: entity.commercialName,
    tradeName:      entity.tradeName,
    phone:          entity.phone,
    address:        entity.address,
    createdAt:      entity.createdAt,
    updatedAt:      entity.updatedAt,

    legalNatureId:        entity.legalNatureId,
    taxRegimeId:          entity.taxRegimeId,
    specialDesignationId: entity.specialDesignationId,

    legalNature: {
      ...entity.legalNature,
      group: mapEnum(BusinessTypeGroup, entity.legalNature.group, 'legalNature.group'),
    },
    taxRegime: {
      ...entity.taxRegime,
      group: mapEnum(BusinessTypeGroup, entity.taxRegime.group, 'taxRegime.group'),
    },
    specialDesignation: entity.specialDesignation
      ? {
          ...entity.specialDesignation,
          group: mapEnum(BusinessTypeGroup, entity.specialDesignation.group, 'specialDesignation.group'),
        }
      : null,
  };
}