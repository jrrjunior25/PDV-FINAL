
// utils/pix.ts

/**
 * Calcula o CRC16 CCITT (false) para o payload PIX.
 * @param data String de dados para cálculo.
 * @returns String hexadecimal de 4 caracteres representando o CRC.
 */
function crc16_ccitt(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
  }
  return ('0000' + (crc & 0xFFFF).toString(16).toUpperCase()).slice(-4);
}

/**
 * Formata um campo no padrão TLV (Tag-Length-Value) do PIX.
 * @param id Tag do campo.
 * @param value Valor do campo.
 * @returns String formatada no padrão TLV.
 */
function tlv(id: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

export interface PixPayloadOptions {
  pixKey: string;
  amount: number;
  merchantName: string;
  merchantCity: string;
  txid: string;
}

/**
 * Gera o payload completo para um QR Code PIX estático.
 * @param opts Opções para a geração do payload.
 * @returns String completa do payload PIX (BR Code).
 */
export function generatePixPayload(opts: PixPayloadOptions): string {
  const { pixKey, amount, merchantName = 'NOME EMPRESA', merchantCity = 'SAO PAULO', txid } = opts;

  // Monta os campos fixos e dinâmicos do payload
  const payloadFormatIndicator = tlv('00', '01');
  
  const merchantAccountInformation = tlv('26', 
    tlv('00', 'BR.GOV.BCB.PIX') + 
    tlv('01', pixKey)
  );

  const merchantCategoryCode = tlv('52', '0000'); // Categoria do comerciante (0000 para não especificado)
  const transactionCurrency = tlv('53', '986'); // Moeda (986 para Real Brasileiro)
  const transactionAmount = tlv('54', amount.toFixed(2));
  const countryCode = tlv('58', 'BR');
  const merchantNameTlv = tlv('59', merchantName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, 25));
  const merchantCityTlv = tlv('60', merchantCity.normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, 15));
  
  const additionalDataField = tlv('62', 
    tlv('05', txid.slice(0, 25))
  );

  // Concatena todos os campos para gerar o payload sem o CRC
  const payloadWithoutCRC = 
    `${payloadFormatIndicator}` +
    `${merchantAccountInformation}` +
    `${merchantCategoryCode}` +
    `${transactionCurrency}` +
    `${transactionAmount}` +
    `${countryCode}` +
    `${merchantNameTlv}` +
    `${merchantCityTlv}` +
    `${additionalDataField}`;

  // Adiciona o campo do CRC16
  const payloadWithCRCHeader = `${payloadWithoutCRC}6304`;
  const crc = crc16_ccitt(payloadWithCRCHeader);
  
  return `${payloadWithCRCHeader}${crc}`;
}
