
// components/PdvScreen.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { User, Product, CartItem, Customer, Sale, PaymentMethod } from '../types';
import { MOCK_PRODUCTS, MOCK_CUSTOMERS } from '../data/mockData';
import { PaymentModal } from './PaymentModal';

interface PdvScreenProps {
  user: User;
  onLogout: () => void;
  onSaleComplete: (sale: Sale) => void;
}

// Componente para a grade de produtos
const ProductGrid: React.FC<{ onAddProduct: (product: Product) => void }> = ({ onAddProduct }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = useMemo(() => 
        MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [searchTerm]
    );

    return (
        <div className="bg-white p-4 rounded-lg shadow-md flex-grow flex flex-col">
            <input 
                type="text"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 mb-4 border rounded-md"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto">
                {filteredProducts.map(product => (
                    <div
                        key={product.id}
                        onClick={() => onAddProduct(product)}
                        className="border rounded-lg p-3 text-center cursor-pointer hover:bg-indigo-100 hover:shadow-lg transition-all flex flex-col justify-between items-center"
                    >
                        <p className="font-semibold text-sm">{product.name}</p>
                        <p className="text-indigo-600 font-bold mt-2">
                            {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Componente para o painel do carrinho
const CartPanel: React.FC<{ 
    cart: CartItem[]; 
    onUpdateQuantity: (productId: number, newQuantity: number) => void; 
    onRemoveItem: (productId: number) => void;
    onClearCart: () => void;
    onFinalizeSale: () => void;
}> = ({ cart, onUpdateQuantity, onRemoveItem, onClearCart, onFinalizeSale }) => {
    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-md w-full lg:w-1/3 flex flex-col">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Carrinho</h2>
            <div className="flex-grow overflow-y-auto">
                {cart.length === 0 ? (
                    <p className="text-gray-500 text-center mt-8">Carrinho vazio</p>
                ) : (
                    <ul className="divide-y">
                        {cart.map(item => (
                            <li key={item.product.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{item.product.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        value={item.quantity} 
                                        onChange={(e) => onUpdateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                                        className="w-16 p-1 border rounded-md text-center"
                                        min="1"
                                    />
                                    <button onClick={() => onRemoveItem(item.product.id)} className="text-red-500 hover:text-red-700">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {cart.length > 0 && (
                <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center text-xl font-bold mb-4">
                        <span>Total:</span>
                        <span>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                     <div className="flex gap-2">
                        <button onClick={onClearCart} className="w-full bg-red-500 text-white p-3 rounded-md hover:bg-red-600 transition-colors font-semibold">
                            Cancelar
                        </button>
                        <button onClick={onFinalizeSale} className="w-full bg-green-500 text-white p-3 rounded-md hover:bg-green-600 transition-colors font-semibold">
                            Finalizar Venda
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


export const PdvScreen: React.FC<PdvScreenProps> = ({ user, onLogout, onSaleComplete }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>(MOCK_CUSTOMERS[0]);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  
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
  }, []);

  const handleUpdateQuantity = useCallback((productId: number, newQuantity: number) => {
      if (newQuantity < 1) return;
      setCart(prevCart => prevCart.map(item => 
          item.product.id === productId 
          ? { ...item, quantity: newQuantity, total: newQuantity * item.product.price }
          : item
      ));
  }, []);

  const handleRemoveItem = useCallback((productId: number) => {
      setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  }, []);
  
  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  const handleFinalizeSale = () => {
      if(cart.length > 0) {
        setPaymentModalOpen(true);
      } else {
        alert("Adicione produtos ao carrinho para finalizar a venda.");
      }
  };
  
  const handlePaymentSuccess = useCallback((paymentMethod: PaymentMethod, paymentDetails: Sale['paymentDetails']) => {
      const newSale: Sale = {
        id: `VENDA-${Date.now()}`,
        items: cart,
        customer,
        user,
        subtotal,
        discount: 0,
        total: subtotal,
        paymentMethod,
        paymentDetails,
        timestamp: new Date(),
      };
      
      onSaleComplete(newSale);
      setCart([]);
      setPaymentModalOpen(false);
  }, [cart, customer, user, subtotal, onSaleComplete]);

  return (
    <div className="flex flex-col h-screen p-4 gap-4 bg-gray-100">
      <header className="flex justify-between items-center bg-white p-3 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-indigo-600">PDV Inteligente</h1>
        <div className="flex items-center gap-4">
            <span className="font-semibold">Usuário: {user.username}</span>
            <button onClick={onLogout} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
                Sair <i className="fas fa-sign-out-alt ml-2"></i>
            </button>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col lg:flex-row gap-4 overflow-hidden">
        <ProductGrid onAddProduct={handleAddProduct} />
        <CartPanel 
            cart={cart} 
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onFinalizeSale={handleFinalizeSale}
        />
      </main>

      {isPaymentModalOpen && (
          <PaymentModal 
              total={subtotal}
              onClose={() => setPaymentModalOpen(false)}
              onPaymentSuccess={handlePaymentSuccess}
          />
      )}
    </div>
  );
};
