import { useState } from 'react';

import { Package, Users, ShoppingCart, BarChart, Menu, X, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import AdminOrders from './Orders';
import AdminProducts from './Products';
import AdminUsers from './Users';
import AdminSettings from './Settings';

function AdminSidebar({ isOpen, setIsOpen }) {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const menuItems = [
        { name: 'Dashboard', icon: BarChart, path: '/admin' },
        { name: 'Pesanan', icon: ShoppingCart, path: '/admin/orders' },
        { name: 'Produk', icon: Package, path: '/admin/products' },
        { name: 'Users / Center', icon: Users, path: '/admin/users' },
        { name: 'Pengaturan', icon: Settings, path: '/admin/settings' },
    ];

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-star-dark text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
                    <span className="text-xl font-bold text-gold-500">SDP Admin</span>
                    <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                <nav className="p-4 flex-1 flex flex-col h-[calc(100vh-4rem)]">
                    <div className="space-y-2">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <item.icon size={20} className="mr-3" />
                                <span>{item.name}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="mt-auto space-y-2 pb-6">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <span className="mr-3">🏠</span>
                            <span>Back to App</span>
                        </button>
                        <button
                            onClick={logout}
                            className="w-full flex items-center px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                            <LogOut size={20} className="mr-3" />
                            <span>Logout</span>
                        </button>
                    </div>
                </nav>
            </aside>
        </>
    );
}

import Dashboard from './Dashboard';

// Placeholder Pages
// const Dashboard = () => <div className="p-6"><h1 className="text-2xl font-bold">Dashboard Overview</h1></div>;
const Orders = () => <div className="p-6"><h1 className="text-2xl font-bold">Manajemen Pesanan</h1></div>;
const Products = () => <div className="p-6"><h1 className="text-2xl font-bold">Manajemen Produk</h1></div>;
const UsersPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Manajemen Users & Star Center</h1></div>;

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col min-h-screen">
                <header className="h-16 bg-white shadow-sm flex items-center px-4 lg:hidden">
                    <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
                        <Menu size={24} />
                    </button>
                    <span className="ml-4 font-bold text-gray-800">Admin Panel</span>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/orders" element={<AdminOrders />} />
                        <Route path="/products" element={<AdminProducts />} />
                        <Route path="/users" element={<AdminUsers />} />
                        <Route path="/settings" element={<AdminSettings />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}
