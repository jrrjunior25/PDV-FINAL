
// data/mockData.ts
import { User, UserRole, Product, Customer } from '../types';

export const MOCK_USERS: User[] = [
  { id: 1, username: 'caixa1', role: UserRole.CAIXA },
  { id: 2, username: 'gerente', role: UserRole.GERENTE },
  { id: 3, username: 'admin', role: UserRole.ADMIN },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 1, code: '001', name: 'Café Espresso', price: 5.00, unit: 'UN', stock: 100 },
  { id: 2, code: '002', name: 'Pão de Queijo', price: 3.50, unit: 'UN', stock: 200 },
  { id: 3, code: '003', name: 'Suco de Laranja 300ml', price: 8.00, unit: 'UN', stock: 80 },
  { id: 4, code: '004', name: 'Bolo de Chocolate (fatia)', price: 9.50, unit: 'UN', stock: 30 },
  { id: 5, code: '005', name: 'Água Mineral 500ml', price: 3.00, unit: 'UN', stock: 150 },
  { id: 6, code: '006', name: 'Sanduíche Natural', price: 12.00, unit: 'UN', stock: 50 },
  { id: 7, code: '007', name: 'Refrigerante Lata', price: 6.00, unit: 'UN', stock: 120 },
  { id: 8, code: '008', name: 'Salgado Assado', price: 7.50, unit: 'UN', stock: 90 },
  { id: 9, code: '009', name: 'Açaí 300ml', price: 15.00, unit: 'UN', stock: 40 },
  { id: 10, code: '010', name: 'Vitamina de Frutas', price: 10.00, unit: 'UN', stock: 60 },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 1, name: 'Cliente Padrão', cpfCnpj: '000.000.000-00', phone: '(00) 0000-0000' },
  { id: 2, name: 'João da Silva', cpfCnpj: '123.456.789-10', phone: '(11) 98765-4321' },
  { id: 3, name: 'Empresa XYZ Ltda', cpfCnpj: '12.345.678/0001-99', phone: '(21) 1234-5678' },
];
