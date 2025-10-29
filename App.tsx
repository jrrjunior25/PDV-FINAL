import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { User, Sale, Product, Customer, CartItem, PaymentMethod, AccountReceivable, AccountPayable, SaleStatus, UserRole } from './types';
import { MOCK_USERS, MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_SALES, MOCK_ACCOUNTS_PAYABLE, MOCK_ACCOUNTS_RECEIVABLE } from './data/mockData';
import { generatePixPayload } from './utils/pix';

// Fix: Add type definition for window.QRCode which is loaded from a script tag.
declare global {
    interface Window {
        QRCode: {
            toDataURL: (text: string) => Promise<string>;
        };
    }
}

// Tipos de Telas do ERP
type Screen = 'dashboard' | 'pdv' | 'sales' | 'inventory' | 'financial' | 'customers' | 'fiscal';

// =========== HELPERS ===========
const calculateSaleNetProfit = (sale: Sale): number => {
    const totalCost = sale.items.reduce((sum, item) => sum + (item.product.costPrice * item.quantity), 0);
    const totalTaxes = sale.items.reduce((sum, item) => {
        const itemRevenue = item.product.price * item.quantity;
        const taxOnItem = itemRevenue * ((item.product.taxes.icms + item.product.taxes.pis + item.product.taxes.cofins) / 100);
        return sum + taxOnItem;
    }, 0);
    return sale.total - totalCost - totalTaxes;
};


// =========== COMPONENTES DE UI REUTILIZÁVEIS ===========

const StatCard: React.FC<{ title: string; value: string; icon: string; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
    <div className={`text-3xl p-3 rounded-full mr-4 ${color}`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div>
      <p className="text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string; size?: 'md' | 'lg' | 'xl' }> = ({ children, onClose, title, size = 'lg' }) => {
    const sizeClasses = {
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };
    return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]}`}>
            <header className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold">{title}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </header>
            <main className="p-6">{children}</main>
        </div>
    </div>
)};


// =========== TELA DE LOGIN ===========

const LoginScreen: React.FC<{ onLogin: (username: string) => boolean; }> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!onLogin(username)) {
            setError('Usuário ou senha inválidos.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-200">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
                <div className="text-center">
                    <i className="fas fa-cash-register fa-3x text-indigo-600"></i>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">ERP Inteligente</h2>
                    <p className="mt-2 text-sm text-gray-600">Gestão completa para seu negócio</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <input
                        type="text"
                        required
                        className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Usuário (ex: caixa1, gerente, admin)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        required
                        className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Senha (qualquer valor)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
};

// =========== BARRA DE NAVEGAÇÃO (SIDEBAR) ===========

const Sidebar: React.FC<{ user: User; onLogout: () => void; onNavigate: (screen: Screen) => void; activeScreen: Screen }> = ({ user, onLogout, onNavigate, activeScreen }) => {
    
    const navItems: { screen: Screen; label: string; icon: string; roles: UserRole[] }[] = [
        { screen: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt', roles: [UserRole.ADMIN, UserRole.GERENTE, UserRole.CAIXA] },
        { screen: 'pdv', label: 'PDV (Nova Venda)', icon: 'fa-cash-register', roles: [UserRole.ADMIN, UserRole.GERENTE, UserRole.CAIXA] },
        { screen: 'sales', label: 'Vendas', icon: 'fa-history', roles: [UserRole.ADMIN, UserRole.GERENTE] },
        { screen: 'inventory', label: 'Estoque', icon: 'fa-boxes', roles: [UserRole.ADMIN, UserRole.GERENTE] },
        { screen: 'financial', label: 'Financeiro', icon: 'fa-wallet', roles: [UserRole.ADMIN] },
        { screen: 'fiscal', label: 'Fiscal', icon: 'fa-file-invoice', roles: [UserRole.ADMIN] },
        { screen: 'customers', label: 'Clientes', icon: 'fa-users', roles: [UserRole.ADMIN, UserRole.GERENTE] },
    ];

    const accessibleNavItems = navItems.filter(item => item.roles.includes(user.role));

    return (
        <div className="w-64 bg-gray-800 text-white flex flex-col">
            <div className="p-5 text-center text-2xl font-bold bg-gray-900">
                ERP <span className="text-indigo-400">Inteligente</span>
            </div>
            <nav className="flex-grow">
                <ul>
                    {accessibleNavItems.map(item => (
                        <li key={item.screen}>
                            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate(item.screen); }}
                                className={`flex items-center px-4 py-3 hover:bg-gray-700 transition-colors ${activeScreen === item.screen ? 'bg-indigo-600' : ''}`}>
                                <i className={`fas ${item.icon} w-6 text-center`}></i>
                                <span className="ml-3">{item.label}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-gray-700">
                <p className="font-semibold">{user.username}</p>
                <p className="text-sm text-gray-400">{user.role}</p>
                <button onClick={onLogout} className="w-full mt-4 bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 text-sm">
                    Sair <i className="fas fa-sign-out-alt ml-1"></i>
                </button>
            </div>
        </div>
    );
};


// =========== DASHBOARD ===========

const DashboardScreen: React.FC<{user: User, sales: Sale[], products: Product[], accountsReceivable: AccountReceivable[]}> = ({user, sales, products, accountsReceivable}) => {
    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };

    const todaySales = sales.filter(sale => isToday(new Date(sale.timestamp)));
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const todayNetProfit = todaySales.reduce((sum, sale) => sum + calculateSaleNetProfit(sale), 0);

    const pendingReceivables = accountsReceivable.filter(ar => ar.status === 'PENDENTE').length.toString();
    const lowStockItems = products.filter(p => p.stock < 20).length.toString();
    const canViewAll = user.role === UserRole.ADMIN || user.role === UserRole.GERENTE;

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${canViewAll ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-6`}>
                <StatCard title="Vendas Hoje" value={todayRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon="fa-dollar-sign" color="bg-green-100 text-green-600" />
                {canViewAll && <StatCard title="Lucro Líquido (Hoje)" value={todayNetProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon="fa-chart-line" color="bg-blue-100 text-blue-600" />}
                {canViewAll && <StatCard title="Contas a Receber (Pendentes)" value={pendingReceivables} icon="fa-file-invoice-dollar" color="bg-yellow-100 text-yellow-600" />}
                {canViewAll && <StatCard title="Itens com Estoque Baixo" value={lowStockItems} icon="fa-exclamation-triangle" color="bg-red-100 text-red-600" />}
            </div>
            {/* Aqui poderiam entrar gráficos e outras informações */}
        </div>
    );
};

// =========== TELA DE PONTO DE VENDA (PDV) - ESTILO SUPERMERCADO ===========

const ProductSearchModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onProductSelect: (product: Product) => void;
    products: Product[];
}> = ({ isOpen, onClose, onProductSelect, products }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, products]);
    
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        } else {
            setSearchTerm('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <Modal onClose={onClose} title="Buscar Produto (F2)">
            <input
                ref={searchInputRef}
                type="text"
                placeholder="Digite o nome ou código do produto..."
                className="w-full p-3 border rounded-md mb-4"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-left">
                    <thead><tr className="border-b"><th className="p-2">Cód.</th><th className="p-2">Produto</th><th className="p-2">Preço</th><th className="p-2">Estoque</th></tr></thead>
                    <tbody>
                        {filteredProducts.map(p => (
                            <tr key={p.id} onClick={() => onProductSelect(p)} className="hover:bg-indigo-100 cursor-pointer">
                                <td className="p-2">{p.code}</td>
                                <td className="p-2 font-semibold">{p.name}</td>
                                <td className="p-2">{p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className="p-2">{p.stock}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Modal>
    );
};

const PdvScreen: React.FC<{ user: User; onSaleComplete: (sale: Sale) => void; products: Product[]; customers: Customer[] }> = ({ user, onSaleComplete, products, customers }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customer, setCustomer] = useState<Customer>(customers[0]);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isSearchModalOpen, setSearchModalOpen] = useState(false);
    const [productCode, setProductCode] = useState('');
    const codeInputRef = useRef<HTMLInputElement>(null);
    
    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);

    const handleAddProduct = useCallback((product: Product) => {
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.product.id === product.id);
        if (existingItem) {
          return prevCart.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.product.price }
              : item
          );
        }
        return [...prevCart, { product, quantity: 1, total: product.price }];
      });
      codeInputRef.current?.focus();
    }, []);

    const handleProductCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!productCode) return;
        const product = products.find(p => p.code === productCode);
        if(product) {
            handleAddProduct(product);
        } else {
            alert(`Produto com código "${productCode}" não encontrado.`);
        }
        setProductCode('');
    };
    
    const handleSelectProductFromSearch = (product: Product) => {
        handleAddProduct(product);
        setSearchModalOpen(false);
    };

    const handleFinalizeSale = () => {
        if (cart.length > 0) setPaymentModalOpen(true);
    };

    const handlePaymentSuccess = useCallback((paymentMethod: PaymentMethod, paymentDetails: Sale['paymentDetails']) => {
        const newSale: Sale = {
            id: `VENDA-${Date.now()}`,
            items: cart,
            customer,
            user,
            subtotal,
            discount: 0, // Desconto ainda não implementado na UI
            total: subtotal,
            paymentMethod,
            paymentDetails,
            timestamp: new Date(),
            status: paymentMethod === PaymentMethod.A_PRAZO ? SaleStatus.PENDENTE : SaleStatus.PAGO,
        };
        
        onSaleComplete(newSale);

        setCart([]);
        setPaymentModalOpen(false);
        codeInputRef.current?.focus();
    }, [cart, customer, user, subtotal, onSaleComplete]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                e.preventDefault();
                setSearchModalOpen(true);
            } else if (e.key === 'F10') {
                e.preventDefault();
                handleFinalizeSale();
            } else if (e.key === 'Escape') {
                if (isSearchModalOpen) setSearchModalOpen(false);
                else if (isPaymentModalOpen) setPaymentModalOpen(false);
                else setProductCode('');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchModalOpen, isPaymentModalOpen, cart]);


    return (
        <div className="flex h-full bg-gray-200">
             <ProductSearchModal isOpen={isSearchModalOpen} onClose={() => setSearchModalOpen(false)} onProductSelect={handleSelectProductFromSearch} products={products} />
             
            <div className="w-2/5 bg-white p-4 flex flex-col shadow-lg">
                <h2 className="text-xl font-bold mb-2 border-b pb-2">Itens da Venda</h2>
                <div className="flex-grow overflow-y-auto pr-2">
                   {cart.length === 0 ? <p className="text-gray-500 text-center mt-10">Caixa Livre</p> : (
                       <table className="w-full text-sm">
                           <thead>
                               <tr className="border-b"><th className="text-left font-semibold p-1">Produto</th><th className="text-center font-semibold p-1">Qtd</th><th className="text-right font-semibold p-1">Total</th></tr>
                           </thead>
                           <tbody>
                               {cart.map(item => (
                                   <tr key={item.product.id} className="border-b">
                                       <td className="p-2">{item.product.name}</td>
                                       <td className="p-2 text-center">{item.quantity}</td>
                                       <td className="p-2 text-right font-semibold">{item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   )}
                </div>
            </div>

            <div className="w-3/5 p-6 flex flex-col">
                <div className="bg-gray-800 text-white rounded-lg p-6 mb-6 text-right shadow-xl">
                    <p className="text-2xl font-semibold">TOTAL A PAGAR</p>
                    <p className="text-7xl font-bold tracking-wider">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                
                <form onSubmit={handleProductCodeSubmit}>
                    <label className="block text-sm font-bold text-gray-700 mb-2">CÓDIGO DO PRODUTO (ENTER para adicionar)</label>
                    <input
                        ref={codeInputRef}
                        type="text"
                        autoFocus
                        value={productCode}
                        onChange={(e) => setProductCode(e.target.value)}
                        className="w-full text-2xl p-4 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Leia o código de barras"
                    />
                </form>

                <div className="mt-auto pt-6 text-sm text-gray-600">
                    <p className="font-bold mb-2">Atalhos do Teclado:</p>
                    <div className="flex justify-between">
                       <span><kbd className="font-mono p-1 bg-gray-300 rounded">F2</kbd> - Buscar Produto</span>
                       <span><kbd className="font-mono p-1 bg-gray-300 rounded">F10</kbd> - Finalizar Venda</span>
                       <span><kbd className="font-mono p-1 bg-gray-300 rounded">ESC</kbd> - Limpar/Fechar</span>
                    </div>
                </div>
            </div>
            
            {isPaymentModalOpen && <PaymentModal total={subtotal} onClose={() => { setPaymentModalOpen(false); codeInputRef.current?.focus(); }} onPaymentSuccess={handlePaymentSuccess} />}
        </div>
    );
};


// =========== MODAL DE PAGAMENTO ===========

const PaymentModal: React.FC<{
    total: number;
    onClose: () => void;
    onPaymentSuccess: (paymentMethod: PaymentMethod, paymentDetails: Sale['paymentDetails']) => void;
}> = ({ total, onClose, onPaymentSuccess }) => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [pixData, setPixData] = useState<{ qrCodeDataUrl: string, txid: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGeneratePix = useCallback(async () => {
        setIsLoading(true);
        const txid = `TXID${Date.now()}`;
        const payload = generatePixPayload({
            pixKey: '12345678900', // Chave PIX mockada
            amount: total,
            merchantName: 'PDV Inteligente',
            merchantCity: 'SAO PAULO',
            txid: txid,
        });

        try {
             if (typeof window.QRCode === 'undefined') {
                console.error('Biblioteca QRCode não carregada.');
                alert('Falha ao gerar QR Code: biblioteca não encontrada.');
                throw new Error('Biblioteca QRCode não carregada.');
            }
            const qrCodeDataUrl = await window.QRCode.toDataURL(payload);
            setPixData({ qrCodeDataUrl, txid });
        } catch (err) {
            console.error('Falha ao gerar QR Code', err);
        } finally {
            setIsLoading(false);
        }
    }, [total]);

    const handleSelectMethod = (method: PaymentMethod) => {
        setSelectedMethod(method);
        if (method === PaymentMethod.PIX) handleGeneratePix();
        else setPixData(null);
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (selectedMethod === PaymentMethod.PIX && pixData) {
            timer = setTimeout(() => {
                alert('Pagamento PIX confirmado (simulação)!');
                onPaymentSuccess(PaymentMethod.PIX, { txid: pixData.txid, pixQrCodeDataUrl: pixData.qrCodeDataUrl, paid: true });
            }, 5000);
        }
        return () => clearTimeout(timer);
    }, [selectedMethod, pixData, onPaymentSuccess]);

    const handleConfirmPayment = (method: PaymentMethod) => {
        onPaymentSuccess(method, { paid: true });
    };

    return (
        <Modal onClose={onClose} title="Finalizar Pagamento">
            <div className="text-center">
                <p className="text-3xl font-bold text-indigo-600 mb-6">
                    Total: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <div className="flex justify-center flex-wrap gap-4 mb-6">
                    {(Object.values(PaymentMethod) as PaymentMethod[]).map(method => (
                        <button key={method} onClick={() => handleSelectMethod(method)}
                            className={`px-6 py-3 rounded-lg font-semibold border-2 transition-colors ${selectedMethod === method ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-100 hover:bg-gray-200 border-gray-300'}`}>
                            {method}
                        </button>
                    ))}
                </div>
                <div className="mt-4 min-h-[250px] flex flex-col items-center justify-center">
                    {!selectedMethod && <p className="text-gray-500">Selecione uma forma de pagamento.</p>}
                    {selectedMethod === PaymentMethod.DINHEIRO && (
                        <button onClick={() => handleConfirmPayment(PaymentMethod.DINHEIRO)} className="bg-green-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-green-600">Confirmar Recebimento</button>
                    )}
                    {selectedMethod === PaymentMethod.CARTAO && (
                       <button onClick={() => handleConfirmPayment(PaymentMethod.CARTAO)} className="bg-green-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-green-600">Confirmar Pagamento</button>
                    )}
                    {selectedMethod === PaymentMethod.A_PRAZO && (
                       <button onClick={() => handleConfirmPayment(PaymentMethod.A_PRAZO)} className="bg-blue-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-600">Confirmar Venda a Prazo</button>
                    )}
                    {selectedMethod === PaymentMethod.PIX && (
                        <div>
                            {isLoading && <p>Gerando QR Code...</p>}
                            {pixData && (
                                <>
                                    <p className="text-lg mb-2">Escaneie o QR Code para pagar</p>
                                    <img src={pixData.qrCodeDataUrl} alt="PIX QR Code" className="mx-auto w-48 h-48 border" />
                                    <p className="text-gray-500 mt-2">Aguardando confirmação...</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

// =========== RECIBO NFC-e (MODAL) ===========

const NfceModal: React.FC<{ sale: Sale; onNewSale: () => void }> = ({ sale, onNewSale }) => {
    const totalTaxes = sale.items.reduce((sum, item) => {
        const itemRevenue = item.product.price * item.quantity;
        const taxOnItem = itemRevenue * ((item.product.taxes.icms + item.product.taxes.pis + item.product.taxes.cofins) / 100);
        return sum + taxOnItem;
    }, 0);
    return (
        <Modal onClose={onNewSale} title={`Recibo - Venda ${sale.id}`}>
             <div className="text-xs font-mono bg-stone-100 p-4">
                <div className="text-center mb-4">
                    <h2 className="font-bold text-base">PDV Inteligente LTDA</h2>
                    <p>CNPJ: 12.345.678/0001-99</p>
                    <p className="font-bold mt-2">DANFE NFC-e</p>
                    <p>Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</p>
                </div>
                 <hr className="my-2 border-dashed border-gray-500" />
                 <p>DATA: {new Date(sale.timestamp).toLocaleString('pt-BR')}</p>
                 <table className="w-full my-2">
                    <thead>
                        <tr className="border-b-2 border-dashed border-gray-500">
                            <th className="text-left py-1">PRODUTO</th>
                            <th className="text-center py-1">QTD</th>
                            <th className="text-right py-1">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale.items.map(item => (
                            <tr key={item.product.id}>
                                <td className="py-1">{item.product.name}</td>
                                <td className="text-center py-1">{item.quantity}</td>
                                <td className="text-right py-1">{item.total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
                 <hr className="my-2 border-dashed border-gray-500" />
                 <div className="space-y-1">
                    <div className="flex justify-between"><span>SUBTOTAL</span><span>{sale.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                    {sale.discount > 0 && <div className="flex justify-between"><span>DESCONTO</span><span>- {sale.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>}
                    <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span>{sale.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                    <div className="flex justify-between"><span>FORMA PAGTO.</span><span>{sale.paymentMethod}</span></div>
                 </div>
                 <hr className="my-2 border-dashed border-gray-500" />
                 <div className="text-center text-[10px] my-2">
                    <p>Valor Aproximado dos Tributos: {totalTaxes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (Lei Federal 12.741/12)</p>
                 </div>
                 {sale.paymentMethod === 'PIX' && sale.paymentDetails.pixQrCodeDataUrl && (
                    <div className="text-center my-4">
                        <p className="font-bold">Pague com PIX</p>
                        <img src={sale.paymentDetails.pixQrCodeDataUrl} alt="PIX QR Code" className="mx-auto w-32 h-32 mt-2 border" />
                    </div>
                )}
            </div>
            <div className="mt-6 flex gap-4">
                <button onClick={onNewSale} className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700">Nova Venda</button>
                <button onClick={() => window.print()} className="w-full bg-gray-600 text-white p-3 rounded-lg font-bold hover:bg-gray-700">Imprimir</button>
            </div>
        </Modal>
    );
};

// =========== OUTRAS TELAS DO ERP ===========

const SalesHistoryScreen: React.FC<{sales: Sale[]}> = ({sales}) => (
    <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Histórico de Vendas</h1>
        <div className="bg-white p-4 rounded-lg shadow-md">
            <table className="w-full">
                <thead>
                    <tr className="border-b">
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Cliente</th>
                        <th className="text-right p-2">Total</th>
                        <th className="text-right p-2">Lucro Líquido</th>
                        <th className="text-left p-2">Pagamento</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Data</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map(sale => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="p-2 text-sm">{sale.id}</td>
                            <td className="p-2">{sale.customer?.name}</td>
                            <td className="p-2 text-right font-semibold">{sale.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="p-2 text-right text-blue-600">{calculateSaleNetProfit(sale).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="p-2">{sale.paymentMethod}</td>
                            <td className="p-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${sale.status === SaleStatus.PAGO ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{sale.status}</span>
                            </td>
                            <td className="p-2">{new Date(sale.timestamp).toLocaleString('pt-BR')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// --- MODAL PARA CADASTRO DE NOVO PRODUTO A PARTIR DO XML ---
const AddProductFromXmlModal: React.FC<{
    productData: Omit<Product, 'id' | 'stock'>,
    onClose: () => void,
    onConfirm: (newProduct: Omit<Product, 'id'>) => void
}> = ({ productData, onClose, onConfirm }) => {
    const [product, setProduct] = useState(productData);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if(name.startsWith('taxes.')){
            const taxName = name.split('.')[1];
            setProduct(prev => ({ ...prev, taxes: { ...prev.taxes, [taxName]: parseFloat(value) || 0 } }));
        } else {
            setProduct(prev => ({ ...prev, [name]: ['price', 'costPrice'].includes(name) ? parseFloat(value) : value }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm({ ...product, stock: 0 }); // Estoque inicial será atualizado pela nota
    };

    return (
        <Modal onClose={onClose} title="Cadastrar Novo Produto da NF-e" size="xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-600">Este produto não foi encontrado no seu sistema. Confirme os dados para cadastrá-lo.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="name" value={product.name} onChange={handleChange} placeholder="Nome do Produto" className="p-2 border rounded" />
                    <input name="code" value={product.code} onChange={handleChange} placeholder="Código" className="p-2 border rounded" />
                    <input name="price" value={product.price} onChange={handleChange} type="number" step="0.01" placeholder="Preço Venda" className="p-2 border rounded" />
                    <input name="costPrice" value={product.costPrice} onChange={handleChange} type="number" step="0.01" placeholder="Preço Custo" className="p-2 border rounded" />
                    <input name="unit" value={product.unit} onChange={handleChange} placeholder="Unidade (UN, KG)" className="p-2 border rounded" />
                    <input name="ncm" value={product.ncm} onChange={handleChange} placeholder="NCM" className="p-2 border rounded" />
                    <input name="cest" value={product.cest} onChange={handleChange} placeholder="CEST" className="p-2 border rounded" />
                    <input name="cfop" value={product.cfop} onChange={handleChange} placeholder="CFOP" className="p-2 border rounded" />
                    <input name="origin" value={product.origin} onChange={handleChange} placeholder="Origem" className="p-2 border rounded" />
                    <input name="taxes.icms" value={product.taxes.icms} onChange={handleChange} type="number" step="0.01" placeholder="% ICMS" className="p-2 border rounded" />
                    <input name="taxes.pis" value={product.taxes.pis} onChange={handleChange} type="number" step="0.01" placeholder="% PIS" className="p-2 border rounded" />
                    <input name="taxes.cofins" value={product.taxes.cofins} onChange={handleChange} type="number" step="0.01" placeholder="% COFINS" className="p-2 border rounded" />
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded">Cancelar</button>
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">Confirmar e Cadastrar</button>
                </div>
            </form>
        </Modal>
    );
};


const InventoryScreen: React.FC<{
    products: Product[],
    onUpdateStock: (productId: number, newStock: number) => void,
    onAddNewProduct: (newProduct: Omit<Product, 'id'>) => void
}> = ({ products, onUpdateStock, onAddNewProduct }) => {
    
    const [newProductFromXml, setNewProductFromXml] = useState<Omit<Product, 'id' | 'stock'> | null>(null);

    const handleImportXml = () => {
        // --- SIMULAÇÃO DE DADOS DE UM XML DE NOTA FISCAL ---
        const MOCK_XML_DATA = {
            items: [
                { code: '001', name: 'Café Espresso', quantity: 50, costPrice: 1.55, price: 5.00, unit: 'UN', ncm: '0901.21.00', cest: '17.099.00', cfop: '5102', origin: '0', taxes: { icms: 7, pis: 0.65, cofins: 3 } },
                { code: '007', name: 'Refrigerante Lata', quantity: 100, costPrice: 2.25, price: 6.00, unit: 'UN', ncm: '2202.10.00', cest: '03.011.00', cfop: '5405', origin: '0', taxes: { icms: 18, pis: 1.65, cofins: 7.6 } },
                // Este produto é novo e não existe no sistema
                { code: '115', name: 'Biscoito Importado', quantity: 20, costPrice: 4.50, price: 9.90, unit: 'UN', ncm: '1905.31.00', cest: '17.056.00', cfop: '6102', origin: '1', taxes: { icms: 18, pis: 1.65, cofins: 7.6 } },
            ]
        };
        // --------------------------------------------------------

        let productsToRegister: Omit<Product, 'id'|'stock'>[] = [];
        
        MOCK_XML_DATA.items.forEach(xmlItem => {
            const existingProduct = products.find(p => p.code === xmlItem.code);
            if (existingProduct) {
                const newStock = existingProduct.stock + xmlItem.quantity;
                onUpdateStock(existingProduct.id, newStock);
            } else {
                productsToRegister.push(xmlItem);
            }
        });

        if (productsToRegister.length > 0) {
            // Abre o modal para o primeiro produto novo. Poderia ser uma lista.
            setNewProductFromXml(productsToRegister[0]);
        }
        
        alert(`Importação concluída! ${MOCK_XML_DATA.items.length - productsToRegister.length} produto(s) atualizado(s). ${productsToRegister.length} novo(s) para cadastrar.`);
    };

    const handleConfirmNewProduct = (newProduct: Omit<Product, 'id'>) => {
        onAddNewProduct(newProduct);
        // Aqui, daria entrada no estoque do produto recém-cadastrado
        setNewProductFromXml(null);
    };

    return (
    <div className="p-6">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Controle de Estoque</h1>
            <button onClick={handleImportXml} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">
                <i className="fas fa-file-import mr-2"></i>Importar XML de NF-e
            </button>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
            <table className="w-full">
                <thead>
                     <tr className="border-b">
                        <th className="text-left p-2">Cód.</th>
                        <th className="text-left p-2">Produto</th>
                        <th className="text-right p-2">Preço Custo</th>
                        <th className="text-right p-2">Preço Venda</th>
                        <th className="text-right p-2">Estoque Atual</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                         <tr key={p.id} className="hover:bg-gray-50">
                            <td className="p-2">{p.code}</td>
                            <td className="p-2">{p.name}</td>
                            <td className="p-2 text-right">{p.costPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="p-2 text-right">{p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className={`p-2 text-right font-bold ${p.stock < 20 ? 'text-red-500' : 'text-green-600'}`}>{p.stock} {p.unit}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {newProductFromXml && <AddProductFromXmlModal productData={newProductFromXml} onClose={() => setNewProductFromXml(null)} onConfirm={handleConfirmNewProduct} />}
    </div>
);
}
const FiscalScreen: React.FC<{sales: Sale[]}> = ({sales}) => (
    <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Módulo Fiscal</h1>
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">NFC-e Emitidas (Simulação)</h2>
            <p className="text-gray-600">Esta tela centralizará futuras operações fiscais, como gerenciamento de notas, relatórios e integrações com a SEFAZ.</p>
             <table className="w-full mt-4">
                <thead>
                    <tr className="border-b">
                        <th className="text-left p-2">ID da Venda</th>
                        <th className="text-left p-2">Data</th>
                        <th className="text-right p-2">Valor Total</th>
                        <th className="text-right p-2">Tributos Aprox.</th>
                    </tr>
                </thead>
                <tbody>
                     {sales.slice(0, 10).map(sale => {
                        const totalTaxes = sale.items.reduce((sum, item) => sum + (item.total * ((item.product.taxes.icms + item.product.taxes.pis + item.product.taxes.cofins) / 100)), 0);
                        return (
                            <tr key={sale.id} className="hover:bg-gray-50">
                                <td className="p-2 text-sm">{sale.id}</td>
                                <td className="p-2">{new Date(sale.timestamp).toLocaleDateString('pt-BR')}</td>
                                <td className="p-2 text-right">{sale.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className="p-2 text-right">{totalTaxes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            </tr>
                        );
                     })}
                </tbody>
             </table>
        </div>
    </div>
);
const FinancialScreen: React.FC<{
    accountsReceivable: AccountReceivable[],
    accountsPayable: AccountPayable[],
    onUpdateAccountStatus: (accountId: string, type: 'payable' | 'receivable', newStatus: 'PAGO') => void;
}> = ({ accountsReceivable, accountsPayable, onUpdateAccountStatus }) => (
    <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Financeiro</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Contas a Receber</h2>
                <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="text-left p-1">Cliente</th><th className="text-left p-1">Valor</th><th className="text-left p-1">Status</th><th className="text-left p-1">Ações</th></tr></thead>
                    <tbody>{accountsReceivable.map(ar => <tr key={ar.id}><td className="p-1">{ar.customerName}</td><td className="p-1">{ar.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-1"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${ar.status === 'PAGO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{ar.status}</span></td>
                    <td className="p-1">{ar.status === 'PENDENTE' && <button onClick={() => onUpdateAccountStatus(ar.id, 'receivable', 'PAGO')} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Marcar como Pago</button>}</td>
                    </tr>)}</tbody>
                </table>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Contas a Pagar</h2>
                 <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="text-left p-1">Descrição</th><th className="text-left p-1">Valor</th><th className="text-left p-1">Status</th><th className="text-left p-1">Ações</th></tr></thead>
                    <tbody>{accountsPayable.map(ap => <tr key={ap.id}><td className="p-1">{ap.description}</td><td className="p-1">{ap.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-1"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${ap.status === 'PAGO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{ap.status}</span></td>
                    <td className="p-1">{ap.status === 'PENDENTE' && <button onClick={() => onUpdateAccountStatus(ap.id, 'payable', 'PAGO')} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Marcar como Pago</button>}</td>
                    </tr>)}</tbody>
                </table>
            </div>
        </div>
    </div>
);

const CustomersScreen: React.FC<{customers: Customer[]}> = ({customers}) => (
     <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Clientes</h1>
        <div className="bg-white p-4 rounded-lg shadow-md">
             <table className="w-full">
                <thead><tr className="border-b"><th className="text-left p-2">Nome</th><th className="text-left p-2">CPF/CNPJ</th><th className="text-left p-2">Telefone</th></tr></thead>
                <tbody>{customers.map(c => <tr key={c.id} className="hover:bg-gray-50"><td className="p-2">{c.name}</td><td className="p-2">{c.cpfCnpj}</td><td className="p-2">{c.phone}</td></tr>)}</tbody>
            </table>
        </div>
    </div>
);


// =========== COMPONENTE PRINCIPAL (APP) ===========

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);

    // Centralized State Management
    const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
    const [sales, setSales] = useState<Sale[]>(MOCK_SALES);
    const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
    const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>(MOCK_ACCOUNTS_PAYABLE);
    const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>(MOCK_ACCOUNTS_RECEIVABLE);


    const handleLogin = useCallback((username: string): boolean => {
        const user = MOCK_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (user) {
            setCurrentUser(user);
            setCurrentScreen('dashboard');
            return true;
        }
        return false;
    }, []);

    const handleLogout = useCallback(() => {
        setCurrentUser(null);
        setCurrentScreen('dashboard');
    }, []);

    const handleSaleComplete = useCallback((newSale: Sale) => {
        setSales(prevSales => [newSale, ...prevSales]);

        setProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            newSale.items.forEach(item => {
                const productIndex = updatedProducts.findIndex(p => p.id === item.product.id);
                if (productIndex !== -1) {
                    updatedProducts[productIndex].stock -= item.quantity;
                }
            });
            return updatedProducts;
        });

        if (newSale.status === SaleStatus.PENDENTE) {
            const newReceivable: AccountReceivable = {
                id: `CR-${Date.now()}`,
                saleId: newSale.id,
                customerName: newSale.customer?.name ?? 'N/A',
                amount: newSale.total,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: 'PENDENTE'
            };
            setAccountsReceivable(prev => [newReceivable, ...prev]);
        }
        
        setCompletedSale(newSale);

    }, []);
    
    const handleCloseReceipt = useCallback(() => {
        setCompletedSale(null);
        setCurrentScreen('pdv');
    }, []);

    const handleUpdateAccountStatus = useCallback((accountId: string, type: 'payable' | 'receivable', newStatus: 'PAGO') => {
        if (type === 'payable') {
            setAccountsPayable(prev => prev.map(acc => acc.id === accountId ? {...acc, status: newStatus} : acc));
        } else {
            const updatedReceivables = accountsReceivable.map(acc => acc.id === accountId ? {...acc, status: newStatus} : acc);
            setAccountsReceivable(updatedReceivables);

            const receivable = accountsReceivable.find(acc => acc.id === accountId);
            if (receivable) {
                setSales(prevSales => prevSales.map(sale => sale.id === receivable.saleId ? {...sale, status: SaleStatus.PAGO} : sale));
            }
        }
    }, [accountsReceivable]);

    const handleNavigate = useCallback((screen: Screen) => {
        if (!currentUser) return;
        
        const screenPermissions: Record<Screen, UserRole[]> = {
            dashboard: [UserRole.ADMIN, UserRole.GERENTE, UserRole.CAIXA],
            pdv: [UserRole.ADMIN, UserRole.GERENTE, UserRole.CAIXA],
            sales: [UserRole.ADMIN, UserRole.GERENTE],
            inventory: [UserRole.ADMIN, UserRole.GERENTE],
            financial: [UserRole.ADMIN],
            fiscal: [UserRole.ADMIN],
            customers: [UserRole.ADMIN, UserRole.GERENTE],
        };

        if (screenPermissions[screen].includes(currentUser.role)) {
            setCurrentScreen(screen);
        } else {
            // Silently prevent navigation instead of alerting
            console.warn(`User ${currentUser.username} with role ${currentUser.role} attempted to access restricted screen: ${screen}`);
        }
    }, [currentUser]);

    const handleUpdateStock = useCallback((productId: number, newStock: number) => {
        setProducts(prev => prev.map(p => p.id === productId ? {...p, stock: newStock} : p));
    }, []);

    const handleAddNewProduct = useCallback((newProduct: Omit<Product, 'id'>) => {
        const newProductWithId: Product = {
            ...newProduct,
            id: Date.now(), // Simple way to generate a unique ID for mock data
        };
        setProducts(prev => [newProductWithId, ...prev]);
        alert(`Produto "${newProduct.name}" cadastrado com sucesso!`);
    }, []);

    const renderScreen = () => {
        if (!currentUser) return null;
        switch (currentScreen) {
            case 'dashboard': return <DashboardScreen user={currentUser} sales={sales} products={products} accountsReceivable={accountsReceivable} />;
            case 'pdv': return <PdvScreen user={currentUser} onSaleComplete={handleSaleComplete} products={products} customers={customers} />;
            case 'sales': return <SalesHistoryScreen sales={sales} />;
            case 'inventory': return <InventoryScreen products={products} onUpdateStock={handleUpdateStock} onAddNewProduct={handleAddNewProduct} />;
            case 'financial': return <FinancialScreen accountsPayable={accountsPayable} accountsReceivable={accountsReceivable} onUpdateAccountStatus={handleUpdateAccountStatus} />;
            case 'fiscal': return <FiscalScreen sales={sales} />;
            case 'customers': return <CustomersScreen customers={customers} />;
            default: return <DashboardScreen user={currentUser} sales={sales} products={products} accountsReceivable={accountsReceivable} />;
        }
    };

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar user={currentUser} onLogout={handleLogout} onNavigate={handleNavigate} activeScreen={currentScreen} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-x-hidden overflow-y-auto">
                    {renderScreen()}
                </div>
            </main>
            {completedSale && <NfceModal sale={completedSale} onNewSale={handleCloseReceipt} />}
        </div>
    );
};

export default App;