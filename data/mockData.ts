// data/mockData.ts
import { User, UserRole, Product, Customer, Sale, SaleStatus, PaymentMethod, AccountPayable, AccountReceivable } from '../types';

export const MOCK_USERS: User[] = [
  { id: 1, username: 'caixa1', role: UserRole.CAIXA },
  { id: 2, username: 'gerente', role: UserRole.GERENTE },
  { id: 3, username: 'admin', role: UserRole.ADMIN },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 1, code: '001', name: 'Café Espresso', price: 5.00, costPrice: 1.50, unit: 'UN', stock: 100, ncm: '0901.21.00', cest: '17.099.00', cfop: '5102', origin: '0', taxes: { icms: 7, pis: 0.65, cofins: 3 } },
  { id: 2, code: '002', name: 'Pão de Queijo', price: 3.50, costPrice: 0.80, unit: 'UN', stock: 200, ncm: '1901.20.00', cest: '17.058.00', cfop: '5102', origin: '0', taxes: { icms: 7, pis: 0, cofins: 0 } },
  { id: 3, code: '003', name: 'Suco de Laranja 300ml', price: 8.00, costPrice: 3.00, unit: 'UN', stock: 15, ncm: '2009.12.00', cest: '03.007.00', cfop: '5405', origin: '0', taxes: { icms: 18, pis: 1.65, cofins: 7.6 } }, // Estoque baixo
  { id: 4, code: '004', name: 'Bolo de Chocolate (fatia)', price: 9.50, costPrice: 4.00, unit: 'UN', stock: 30, ncm: '1905.90.90', cest: '17.064.00', cfop: '5102', origin: '0', taxes: { icms: 7, pis: 0.65, cofins: 3 } },
  { id: 5, code: '005', name: 'Água Mineral 500ml', price: 3.00, costPrice: 0.50, unit: 'UN', stock: 150, ncm: '2201.10.00', cest: '03.001.00', cfop: '5405', origin: '0', taxes: { icms: 18, pis: 1.65, cofins: 7.6 } },
  { id: 6, code: '006', name: 'Sanduíche Natural', price: 12.00, costPrice: 5.50, unit: 'UN', stock: 50, ncm: '1602.32.10', cest: '17.084.00', cfop: '5102', origin: '0', taxes: { icms: 7, pis: 0.65, cofins: 3 } },
  { id: 7, code: '007', name: 'Refrigerante Lata', price: 6.00, costPrice: 2.20, unit: 'UN', stock: 120, ncm: '2202.10.00', cest: '03.011.00', cfop: '5405', origin: '0', taxes: { icms: 18, pis: 1.65, cofins: 7.6 } },
  { id: 8, code: '008', name: 'Salgado Assado', price: 7.50, costPrice: 3.10, unit: 'UN', stock: 90, ncm: '1905.90.90', cest: '17.064.00', cfop: '5102', origin: '0', taxes: { icms: 7, pis: 0.65, cofins: 3 } },
  { id: 9, code: '009', name: 'Açaí 300ml', price: 15.00, costPrice: 7.00, unit: 'UN', stock: 10, ncm: '2008.99.00', cest: '17.016.00', cfop: '5102', origin: '0', taxes: { icms: 12, pis: 0.65, cofins: 3 } }, // Estoque baixo
  { id: 10, code: '010', name: 'Vitamina de Frutas', price: 10.00, costPrice: 4.50, unit: 'UN', stock: 60, ncm: '2202.99.00', cest: '17.112.00', cfop: '5102', origin: '0', taxes: { icms: 7, pis: 0.65, cofins: 3 } },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 1, name: 'Cliente Padrão', cpfCnpj: '000.000.000-00', phone: '(00) 0000-0000' },
  { id: 2, name: 'João da Silva', cpfCnpj: '123.456.789-10', phone: '(11) 98765-4321' },
  { id: 3, name: 'Empresa XYZ Ltda', cpfCnpj: '12.345.678/0001-99', phone: '(21) 1234-5678' },
];

// Dados mocados para Vendas e Financeiro
export const MOCK_SALES: Sale[] = [
    {
        id: 'VENDA-1678886400',
        items: [{ product: MOCK_PRODUCTS[0], quantity: 2, total: 10.00 }, { product: MOCK_PRODUCTS[1], quantity: 1, total: 3.50 }],
        customer: MOCK_CUSTOMERS[1],
        user: MOCK_USERS[0],
        subtotal: 13.50,
        discount: 0,
        total: 13.50,
        paymentMethod: PaymentMethod.PIX,
        paymentDetails: { paid: true },
        timestamp: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 dias atrás
        status: SaleStatus.PAGO
    },
    {
        id: 'VENDA-1678972800',
        items: [{ product: MOCK_PRODUCTS[5], quantity: 1, total: 12.00 }],
        customer: MOCK_CUSTOMERS[2],
        user: MOCK_USERS[0],
        subtotal: 12.00,
        discount: 0,
        total: 12.00,
        paymentMethod: PaymentMethod.A_PRAZO,
        paymentDetails: { paid: false },
        timestamp: new Date(new Date().setDate(new Date().getDate() - 1)), // 1 dia atrás
        status: SaleStatus.PENDENTE
    },
    {
        id: 'VENDA-TODAY001',
        items: [{ product: MOCK_PRODUCTS[2], quantity: 1, total: 8.00 }, { product: MOCK_PRODUCTS[4], quantity: 2, total: 6.00 }],
        customer: MOCK_CUSTOMERS[0],
        user: MOCK_USERS[0],
        subtotal: 14.00,
        discount: 0,
        total: 14.00,
        paymentMethod: PaymentMethod.DINHEIRO,
        paymentDetails: { paid: true },
        timestamp: new Date(),
        status: SaleStatus.PAGO,
    }
];

export const MOCK_ACCOUNTS_RECEIVABLE: AccountReceivable[] = [
    {
        id: 'CR-1678972800',
        saleId: 'VENDA-1678972800',
        customerName: 'Empresa XYZ Ltda',
        amount: 12.00,
        dueDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
        status: 'PENDENTE'
    },
     {
        id: 'CR-1678972900',
        saleId: 'VENDA-1678972900',
        customerName: 'João da Silva',
        amount: 55.70,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Vencido
        status: 'PENDENTE'
    }
];

export const MOCK_ACCOUNTS_PAYABLE: AccountPayable[] = [
    {
        id: 'CP-001',
        description: 'Aluguel',
        amount: 1200.00,
        dueDate: new Date(),
        status: 'PENDENTE'
    },
    {
        id: 'CP-002',
        description: 'Fornecedor de Café',
        amount: 350.50,
        dueDate: new Date(),
        status: 'PAGO'
    }
];