
// components/PaymentModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { PaymentMethod, Sale } from '../types';
import { generatePixPayload } from '../utils/pix';

declare const QRCode: any; // Declaração para o QRCode.js carregado via CDN

interface PaymentModalProps {
  total: number;
  onClose: () => void;
  onPaymentSuccess: (paymentMethod: PaymentMethod, paymentDetails: Sale['paymentDetails']) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ total, onClose, onPaymentSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [pixData, setPixData] = useState<{ qrCodeDataUrl: string, txid: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePix = useCallback(async () => {
    setIsLoading(true);
    const txid = `TXID${Date.now()}`;
    const payload = generatePixPayload({
      pixKey: '12345678900', // Chave PIX aleatória (ex: CPF)
      amount: total,
      merchantName: 'PDV Inteligente',
      merchantCity: 'SAO PAULO',
      txid: txid,
    });
    
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(payload);
      setPixData({ qrCodeDataUrl, txid });
    } catch (err) {
      console.error('Falha ao gerar QR Code', err);
      alert('Não foi possível gerar o QR Code PIX.');
    } finally {
        setIsLoading(false);
    }
  }, [total]);

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method === PaymentMethod.PIX) {
      handleGeneratePix();
    } else {
      setPixData(null);
    }
  };

  // Simula confirmação de pagamento PIX após alguns segundos
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (selectedMethod === PaymentMethod.PIX && pixData) {
      timer = setTimeout(() => {
        alert('Pagamento PIX confirmado (simulação)!');
        onPaymentSuccess(PaymentMethod.PIX, { 
            txid: pixData.txid, 
            pixQrCodeDataUrl: pixData.qrCodeDataUrl,
            paid: true 
        });
      }, 5000); // Confirma após 5 segundos
    }
    return () => clearTimeout(timer);
  }, [selectedMethod, pixData, onPaymentSuccess]);

  const handleConfirmPayment = (method: PaymentMethod) => {
    onPaymentSuccess(method, { paid: true });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl">
          &times;
        </button>
        <h2 className="text-2xl font-bold text-center mb-4">Finalizar Pagamento</h2>
        <div className="text-center text-3xl font-bold text-indigo-600 mb-6">
          Total: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>

        <div className="flex justify-center gap-4 mb-6">
          {(Object.keys(PaymentMethod) as Array<keyof typeof PaymentMethod>).map(key => (
            <button
              key={key}
              onClick={() => handleSelectMethod(PaymentMethod[key])}
              className={`px-6 py-3 rounded-lg font-semibold border-2 transition-colors ${
                selectedMethod === PaymentMethod[key]
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
              }`}
            >
              {PaymentMethod[key]}
            </button>
          ))}
        </div>

        <div className="mt-4 min-h-[250px] flex flex-col items-center justify-center">
          {!selectedMethod && <p className="text-gray-500">Selecione uma forma de pagamento.</p>}
          
          {selectedMethod === PaymentMethod.DINHEIRO && (
            <div className="text-center">
              <p className="text-lg mb-4">Pagamento em dinheiro.</p>
              <button onClick={() => handleConfirmPayment(PaymentMethod.DINHEIRO)} className="bg-green-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-green-600">
                Confirmar Recebimento
              </button>
            </div>
          )}

          {selectedMethod === PaymentMethod.CARTAO && (
            <div className="text-center">
              <p className="text-lg mb-4">Insira ou aproxime o cartão na maquininha.</p>
              <button onClick={() => handleConfirmPayment(PaymentMethod.CARTAO)} className="bg-green-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-green-600">
                Confirmar Pagamento
              </button>
            </div>
          )}
          
          {selectedMethod === PaymentMethod.PIX && (
            <div className="text-center">
              {isLoading && <p>Gerando QR Code...</p>}
              {pixData && (
                <>
                  <p className="text-lg mb-2">Escaneie o QR Code para pagar</p>
                  <img src={pixData.qrCodeDataUrl} alt="PIX QR Code" className="mx-auto w-48 h-48 border" />
                  <p className="text-gray-500 mt-2">Aguardando confirmação de pagamento...</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
