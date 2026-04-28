import { Environment } from '@sri/core';

const TESTING_BASE = 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws';
const PRODUCTION_BASE = 'https://cel.sri.gob.ec/comprobantes-electronicos-ws';

export const endpoints = {
  reception: (env: Environment): string =>
    `${env === Environment.TESTING ? TESTING_BASE : PRODUCTION_BASE}/RecepcionComprobantesOffline?wsdl`,
  authorization: (env: Environment): string =>
    `${env === Environment.TESTING ? TESTING_BASE : PRODUCTION_BASE}/AutorizacionComprobantesOffline?wsdl`,
};
