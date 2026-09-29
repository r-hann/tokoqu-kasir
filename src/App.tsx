import React, { useState, useEffect } from 'react';
import { Product, Transaction, KasbonRecord, AppSettings, CartItem } from './types/pos';
import {
  getProducts,
  getTransactions,
  getKasbonList,
  getSettings,
  saveProducts,
  saveTransactionsList,
  saveKasbonList,
} from './utils/storage';
import { Navbar, NavTab } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { CashierView } from './components/CashierView';
import { PriceCheckView } from './components/PriceCheckView';
import { ProductManageView } from './components/ProductManageView';
import { KasbonView } from './components/KasbonView';
import { TransactionHistoryView } from './components/TransactionHistoryView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kasbonList, setKasbonList] = useState<KasbonRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [autoOpenAddProduct, setAutoOpenAddProduct] = useState(false);

  // Load initial data
  const refreshAllData = () => {
    setProducts(getProducts());
    setTransactions(getTransactions());
    setKasbonList(getKasbonList());
    setSettings(getSettings());
  };

  const handleNavigate = (
    view: NavTab,
    action?: 'tambah_produk'
  ) => {
    if (action === 'tambah_produk') {
      setAutoOpenAddProduct(true);
    } else {
      setAutoOpenAddProduct(false);
    }
    setCurrentTab(view);
  };

  useEffect(() => {
    refreshAllData();

    // Listen to storage update events
    const handleProductsUpdated = () => setProducts(getProducts());
    const handleTransactionsUpdated = () => {
      setTransactions(getTransactions());
      setKasbonList(getKasbonList());
      setProducts(getProducts());
    };
    const handleKasbonUpdated = () => setKasbonList(getKasbonList());
    const handleSettingsUpdated = () => setSettings(getSettings());

    window.addEventListener('toko_qu_products_updated', handleProductsUpdated);
    window.addEventListener('toko_qu_transactions_updated', handleTransactionsUpdated);
    window.addEventListener('toko_qu_kasbon_updated', handleKasbonUpdated);
    window.addEventListener('toko_qu_settings_updated', handleSettingsUpdated);

    return () => {
      window.removeEventListener('toko_qu_products_updated', handleProductsUpdated);
      window.removeEventListener('toko_qu_transactions_updated', handleTransactionsUpdated);
      window.removeEventListener('toko_qu_kasbon_updated', handleKasbonUpdated);
      window.removeEventListener('toko_qu_settings_updated', handleSettingsUpdated);
    };
  }, []);

  // Add product to cart directly from "Cek Harga" or "Quick Scan"
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        const nextQty = next[idx].qty + 1;
        next[idx] = {
          ...next[idx],
          qty: nextQty,
          subtotal: nextQty * next[idx].product.sellingPrice - (next[idx].discount || 0),
        };
        return next;
      } else {
        return [
          ...prev,
          {
            product,
            qty: 1,
            subtotal: product.sellingPrice,
            discount: 0,
          },
        ];
      }
    });
  };

  const handleDataImported = (data: {
    products?: Product[];
    transactions?: Transaction[];
    kasbons?: KasbonRecord[];
  }) => {
    if (data.products && Array.isArray(data.products)) {
      saveProducts(data.products);
      setProducts(data.products);
    }
    if (data.transactions && Array.isArray(data.transactions)) {
      try {
        localStorage.setItem('toko_qu_transactions_v1', JSON.stringify(data.transactions));
        setTransactions(data.transactions);
      } catch (e) {
        console.error(e);
      }
    }
    if (data.kasbons && Array.isArray(data.kasbons)) {
      saveKasbonList(data.kasbons);
      setKasbonList(data.kasbons);
    }
  };

  const cartTotalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const unpaidKasbonCount = kasbonList.filter((k) => k.status === 'belum_lunas').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 pb-20 sm:pb-8">
      {/* Top Header */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        cartCount={cartTotalItems}
        unpaidKasbonCount={unpaidKasbonCount}
        settings={settings}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5">
        {currentTab === 'home' && (
          <HomeDashboard
            products={products}
            transactions={transactions}
            kasbonList={kasbonList}
            settings={settings}
            cart={cart}
            onNavigate={handleNavigate}
            onQuickScanFound={(prod) => {
              handleAddToCart(prod);
              setCurrentTab('kasir');
            }}
          />
        )}

        {currentTab === 'kasir' && (
          <CashierView
            products={products}
            settings={settings}
            cart={cart}
            setCart={setCart}
            onTransactionComplete={() => {
              setProducts(getProducts());
              setTransactions(getTransactions());
              setKasbonList(getKasbonList());
            }}
          />
        )}

        {currentTab === 'cek_harga' && (
          <PriceCheckView
            products={products}
            settings={settings}
            onAddToCart={handleAddToCart}
            onSwitchToCashier={() => setCurrentTab('kasir')}
          />
        )}

        {currentTab === 'produk' && (
          <ProductManageView
            products={products}
            settings={settings}
            initialOpenAdd={autoOpenAddProduct}
            onRefresh={() => setProducts(getProducts())}
          />
        )}

        {currentTab === 'kasbon' && (
          <KasbonView
            kasbonList={kasbonList}
            settings={settings}
            onRefresh={() => setKasbonList(getKasbonList())}
          />
        )}

        {currentTab === 'riwayat' && (
          <TransactionHistoryView
            transactions={transactions}
            settings={settings}
          />
        )}

        {currentTab === 'pengaturan' && (
          <SettingsView
            settings={settings}
            products={products}
            transactions={transactions}
            kasbons={kasbonList}
            onSettingsSaved={(newSettings) => setSettings(newSettings)}
            onDataImported={handleDataImported}
          />
        )}
      </main>
    </div>
  );
}
