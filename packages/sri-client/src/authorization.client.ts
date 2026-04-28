import axios from 'axios';
import { Environment, IAuthorizationResponse } from '@sri/core';
import { endpoints } from './endpoints';

function buildSoapEnvelope(accessKey: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:autorizacionComprobante>
      <claveAccesoComprobante>${accessKey}</claveAccesoComprobante>
    </ec:autorizacionComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function parseAuthorizationResponse(xml: string, accessKey: string): IAuthorizationResponse {
  const status = xml.match(/<estado>(.*?)<\/estado>/)?.[1] || 'ERROR';
  const authBlocks = xml.match(/<autorizacion>[\s\S]*?<\/autorizacion>/g) || [];

  const authorizations = authBlocks.map((block) => {
    const number = block.match(/<numeroAutorizacion>(.*?)<\/numeroAutorizacion>/)?.[1] || '';
    const date = block.match(/<fechaAutorizacion>(.*?)<\/fechaAutorizacion>/)?.[1] || '';
    const statusBlock = block.match(/<estado>(.*?)<\/estado>/)?.[1] || status;
    const xmlNode = block.match(/<comprobante>([\s\S]*?)<\/comprobante>/)?.[1] || '';

    return {
      number,
      date,
      status: statusBlock,
      xml: xmlNode,
    };
  });

  return {
    status,
    accessKey,
    authorizations,
    rawXml: xml,
  };
}

async function requestWithRetry(url: string, body: string): Promise<string> {
  let attempt = 0;
  let delayMs = 500;

  while (attempt < 5) {
    try {
      const response = await axios.post(url, body, {
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
        timeout: 15000,
      });
      return response.data as string;
    } catch (error) {
      attempt += 1;
      if (attempt >= 5) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }

  return '';
}

export async function authorizeVoucher(
  accessKey: string,
  env: Environment,
): Promise<IAuthorizationResponse> {
  const url = endpoints.authorization(env);
  const body = buildSoapEnvelope(accessKey);

  try {
    const responseXml = await requestWithRetry(url, body);
    return parseAuthorizationResponse(responseXml, accessKey);
  } catch (error) {
    return {
      status: 'ERROR',
      accessKey,
      authorizations: [],
    };
  }
}
