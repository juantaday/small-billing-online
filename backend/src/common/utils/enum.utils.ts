/**
 * Mapea un string de Prisma al enum equivalente de la librería shared.
 * Funciona con cualquier enum cuyos valores string sean idénticos en ambos lados.
 *
 * @param targetEnum  - El enum destino (ej: BusinessTypeGroup, PersonType)
 * @param value       - El string que viene de Prisma
 * @param fieldName   - Nombre del campo, solo para el mensaje de error
 *
 * @example
 * mapEnum(BusinessTypeGroup, entity.group, 'group')
 * mapEnum(PersonType, entity.personType, 'personType')
 */
export function mapEnum<TTarget extends Record<string, string>>(
  targetEnum: TTarget,
  value: string,
  fieldName: string,
): TTarget[keyof TTarget] {
  const mapped = Object.values(targetEnum).find((v) => v === value);

  if (!mapped) {
    throw new Error(
      `Valor desconocido "${value}" para el campo "${fieldName}". ` +
      `Valores válidos: ${Object.values(targetEnum).join(', ')}`,
    );
  }

  return mapped as TTarget[keyof TTarget];
}