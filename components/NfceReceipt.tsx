
// components/NfceReceipt.tsx
import React from 'react';
import { Sale } from '../types';

interface NfceReceiptProps {
  sale: Sale;
  onNewSale: () => void;
}

export const NfceReceipt: React.FC<NfceReceiptProps> = ({ sale, onNewSale }) => {
    
    // Função para imprimir o recibo
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-4">
            <div className="w-full max-w-md bg-white p-6 shadow-lg rounded-lg">
                <div id="receipt-content" className="text-xs font-mono">
                    <div className="text-center mb-4">
                        <h2 className="font-bold text-lg">PDV Inteligente LTDA</h2>
                        <p>Rua Fictícia, 123 - Centro</p>
                        <p>CNPJ: 12.345.678/0001-99</p>
                        <hr className="my-2 border-dashed" />
                        <p className="font-bold">DANFE NFC-e - Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</p>
                        <p>Não permite aproveitamento de crédito de ICMS</p>
                        <hr className="my-2 border-dashed" />
                    </div>

                    <div className="mb-2">
                        <span>DATA: {sale.timestamp.toLocaleString('pt-BR')}</span>
                        <span className="float-right">VENDA: {sale.id}</span>
                    </div>

                    <table className="w-full mb-2">
                        <thead>
                            <tr className="border-b-2 border-dashed">
                                <th className="text-left">PRODUTO</th>
                                <th className="text-center">QTD</th>
                                <th className="text-right">VALOR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items.map(item => (
                                <tr key={item.product.id}>
                                    <td className="text-left">{item.product.name}</td>
                                    <td className="text-center">{item.quantity}</td>
                                    <td className="text-right">{item.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <hr className="my-2 border-dashed" />

                    <div className="flex justify-between font-bold text-sm">
                        <span>TOTAL</span>
                        <span>{sale.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Forma de Pagamento:</span>
                        <span>{sale.paymentMethod}</span>
                    </div>

                    <hr className="my-2 border-dashed" />

                    <div className="text-center my-4">
                        {sale.paymentMethod === 'PIX' && sale.paymentDetails.pixQrCodeDataUrl && (
                            <>
                                <p className="font-bold">Pagamento via PIX</p>
                                <img src={sale.paymentDetails.pixQrCodeDataUrl} alt="PIX QR Code" className="mx-auto w-32 h-32 mt-2" />
                            </>
                        )}
                        <p className="mt-4">Obrigado pela preferência!</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 w-full max-w-md flex gap-4">
                <button 
                    onClick={onNewSale}
                    className="w-1/2 bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                >
                    Nova Venda
                </button>
                <button 
                    onClick={handlePrint}
                    className="w-1/2 bg-gray-600 text-white p-3 rounded-lg font-bold hover:bg-gray-700 transition-colors"
                >
                    Imprimir
                </button>
            </div>
            <style>
            {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #receipt-content, #receipt-content * {
                        visibility: visible;
                    }
                    #receipt-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}
            </style>
        </div>
    );
};
