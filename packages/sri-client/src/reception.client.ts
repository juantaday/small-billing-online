import axios from 'axios';
import { Environment, IReceptionResponse, ISriMessage } from '@sri/core';
import { endpoints } from './endpoints';

function buildSoapEnvelope(signedXml: string): string {
  const payload = Buffer.from(signedXml, 'utf8').toString('base64');
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:validarComprobante>
      <xml>${payload}</xml>
    </ec:validarComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function parseMessages(xml: string): ISriMessage[] {
  const messages: ISriMessage[] = [];
  const blocks = xml.match(/<mensaje>[\s\S]*?<\/mensaje>/g) || [];

  blocks.forEach((block) => {
    const code = block.match(/<identificador>(.*?)<\/identificador>/)?.[1];
    const message = block.match(/<mensaje>([\s\S]*?)<\/mensaje>/)?.[1] || 'Mensaje sin detalle';
    const additionalInfo = block.match(/<informacionAdicional>([\s\S]*?)<\/informacionAdicional>/)?.[1];
    messages.push({ code, message: message.trim(), additionalInfo: additionalInfo?.trim() });
  });

  return messages;
}

function parseStatus(xml: string): string {
  return xml.match(/<estado>(.*?)<\/estado>/)?.[1] || 'ERROR';
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

export async function sendVoucher(
  signedXml: string,
  env: Environment,
): Promise<IReceptionResponse> {
  const url = endpoints.reception(env);
  const body = buildSoapEnvelope(signedXml);

  try {
    const responseXml = await requestWithRetry(url, body);
    return {
      status: parseStatus(responseXml),
      messages: parseMessages(responseXml),
      rawXml: responseXml,
    };
  } catch (error) {
    return {
      status: 'ERROR',
      messages: [
        {
          message: error instanceof Error ? error.message : 'Error desconocido',
        },
      ],
    };
  }
}
