import { BusinessTypeDto, BusinessTypeGroup } from '@small-billing/shared';
import { BusinessType } from '@prisma/client';
import { mapEnum } from 'src/common/utils/enum.utils';

// ─── Mapper de BusinessType ─────────────────────────────────────────────────
export function toBusinessTypeDto(entity: BusinessType): BusinessTypeDto {
  return {
    id:          entity.id,
    code:        entity.code,
    name:        entity.name,
    group:       mapEnum(BusinessTypeGroup, entity.group, 'group'),
    description: entity.description,
    active:      entity.active,
    createdAt:   entity.createdAt,
    updatedAt:   entity.updatedAt,
  };
}