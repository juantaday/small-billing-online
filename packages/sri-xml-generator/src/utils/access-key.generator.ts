export interface AccessKeyParams {
  date: string;
  voucherType: string;
  ruc: string;
  environment: string;
  series: string;
  sequential: string;
  numericCode: string;
  emissionType: string;
}

export function buildAccessKey(params: AccessKeyParams): string {
  const rawKey = [
    params.date,
    params.voucherType,
    params.ruc,
    params.environment,
    params.series,
    params.sequential,
    params.numericCode,
    params.emissionType,
  ].join('');

  if (!/^[0-9]+$/.test(rawKey)) {
    throw new Error('Access key must contain only digits');
  }

  if (rawKey.length !== 48) {
    throw new Error('Access key must be 48 digits before verifier');
  }

  const verifier = calculateVerifierDigit(rawKey);
  return rawKey + verifier;
}

export function calculateVerifierDigit(rawKey: string): string {
  // La clave de acceso se valida con modulo 11 usando pesos 2-7 desde la derecha.
  const weights = [2, 3, 4, 5, 6, 7];
  let sum = 0;
  let weightIndex = 0;

  for (let i = rawKey.length - 1; i >= 0; i -= 1) {
    const digit = Number(rawKey[i]);
    sum += digit * weights[weightIndex];
    weightIndex = (weightIndex + 1) % weights.length;
  }

  const remainder = sum % 11;
  const result = 11 - remainder;

  if (result === 11) {
    return '0';
  }

  if (result === 10) {
    return '1';
  }

  return String(result);
}
