
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
  unit: string;
  stock: number;
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
}
