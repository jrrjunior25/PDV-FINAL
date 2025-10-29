// types.ts

export enum UserRole {
  ADMIN = 'ADMIN',
  CAIXA = 'CAIXA',
  GERENTE = 'GERENTE',
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  costPrice: number; // Preço de custo para cálculo de lucro
  unit: string;
  stock: number;
  // --- Novos campos fiscais ---
  ncm: string; // Nomenclatura Comum do Mercosul
  cest: string; // Código Especificador da Substituição Tributária
  cfop: string; // Código Fiscal de Operações e Prestações
  origin: string; // Origem da mercadoria (ex: 0 - Nacional)
  taxes: {
    icms: number; // %
    pis: number;  // %
    cofins: number; // %
  };
}

export interface Customer {
  id: number;
  name: string;
  cpfCnpj: string;
  phone: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

export enum PaymentMethod {
  DINHEIRO = 'DINHEIRO',
  CARTAO = 'CARTAO',
  PIX = 'PIX',
  A_PRAZO = 'A PRAZO',
}

export enum SaleStatus {
    PAGO = 'PAGO',
    PENDENTE = 'PENDENTE',
    CANCELADO = 'CANCELADO',
}

export interface Sale {
  id: string; // Pode ser um UUID
  items: CartItem[];
  customer: Customer | null;
  user: User;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentDetails: {
    txid?: string;
    pixQrCodeDataUrl?: string;
    paid: boolean;
  };
  timestamp: Date;
  status: SaleStatus;
}

// Para o módulo Financeiro
export interface AccountReceivable {
    id: string;
    saleId: string;
    customerName: string;
    amount: number;
    dueDate: Date;
    status: 'PENDENTE' | 'PAGO';
}

export interface AccountPayable {
    id: string;
    description: string;
    amount: number;
    dueDate: Date;
    status: 'PENDENTE' | 'PAGO';
}