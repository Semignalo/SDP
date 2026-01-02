import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { formatRupiah } from '../../lib/currency';
import { TrendingUp, Users, Package, ShoppingCart, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';

export default function Dashboard() {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("created_at", "desc")), (snap) => {
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
            setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        setLoading(false);

        return () => {
            unsubOrders();
            unsubProducts();
            unsubUsers();
        };
    }, []);

    // Stats Calculation
    const totalRevenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const activeOrders = orders.filter(o => ['pending_payment', 'processing', 'shipped'].includes(o.status)).length;
    const totalUsers = users.length;
    const lowStockItems = products.filter(p => (parseInt(p.stock) || 0) < 10);

    // Chart Data (Last 7 Days Revenue)
    const getLast7DaysData = () => {
        const days = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            days.push({
                date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
                rawDate: d, // Store actual Date object
                amount: 0
            });
        }

        orders.forEach(order => {
            if (order.status === 'completed' && order.created_at) {
                const orderDate = order.created_at.toDate ? order.created_at.toDate() : new Date(order.created_at);

                const day = days.find(d =>
                    d.rawDate.getDate() === orderDate.getDate() &&
                    d.rawDate.getMonth() === orderDate.getMonth() &&
                    d.rawDate.getFullYear() === orderDate.getFullYear()
                );

                if (day) {
                    day.amount += (Number(order.total_amount) || 0);
                }
            }
        });
        return days;
    };

    const chartData = getLast7DaysData();
    const maxChartValue = Math.max(...chartData.map(d => d.amount), 1);

    const StatsCard = ({ title, value, icon: Icon, color, subValue }) => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                {subValue && <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1"><ArrowUp size={12} /> {subValue}</p>}
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    );

    if (loading) return <div className="p-8">Loading Dashboard...</div>;

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Pendapatan"
                    value={formatRupiah(totalRevenue)}
                    icon={TrendingUp}
                    color="bg-green-500"
                    subValue="Total Lifetime"
                />
                <StatsCard
                    title="Pesanan Aktif"
                    value={activeOrders}
                    icon={ShoppingCart}
                    color="bg-blue-500"
                    subValue="Perlu Diproses"
                />
                <StatsCard
                    title="Total Customer"
                    value={totalUsers}
                    icon={Users}
                    color="bg-purple-500"
                    subValue="Terdaftar"
                />
                <StatsCard
                    title="Stok Menipis"
                    value={lowStockItems.length}
                    icon={AlertCircle}
                    color="bg-red-500"
                    subValue="Item Perlu Restock"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg mb-6 text-gray-800">Penjualan 7 Hari Terakhir</h3>
                    <div className="h-64 flex gap-2 sm:gap-4">
                        {chartData.map((d, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                <div className="relative w-full flex justify-end flex-col items-center h-full">
                                    <div
                                        className="w-full bg-star-dark/80 rounded-t-lg group-hover:bg-star-dark transition-all relative overflow-hidden"
                                        style={{ height: `${(d.amount / maxChartValue) * 100}%` }}
                                    >
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-star-dark w-full"></div>
                                    </div>
                                    {/* Tooltip */}
                                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                                        {formatRupiah(d.amount)}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 font-medium">{d.date}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
                        <AlertCircle className="text-red-500" size={20} /> Stok Menipis
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[300px] scrollbar-thin">
                        {lowStockItems.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-4">Stok aman.</p>
                        ) : (
                            lowStockItems.slice(0, 10).map(item => (
                                <div key={item.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                                    <div className="w-10 h-10 bg-white rounded-lg overflow-hidden shrink-0">
                                        <img src={item.image_url || 'https://placehold.co/100'} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate">{item.name}</p>
                                        <p className="text-xs text-red-600 font-medium">Sisa: {item.stock}</p>
                                    </div>
                                </div>
                            ))
                        )}
                        {lowStockItems.length > 10 && (
                            <p className="text-center text-xs text-gray-400">Dan {lowStockItems.length - 10} item lainnya...</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4 text-gray-800">Pesanan Terbaru</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="p-3 rounded-l-lg">Order ID</th>
                                <th className="p-3">Customer</th>
                                <th className="p-3">Total</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 rounded-r-lg">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.slice(0, 5).map(order => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="p-3 font-mono text-xs text-blue-600">#{order.id.slice(0, 8)}</td>
                                    <td className="p-3 font-medium text-gray-800">
                                        {/* Ideally we map UserID to Name, but for now ID is shown. 
                                            Since we didn't fetch User map here (unlike Orders page). 
                                            We can reuse the logic if important, but let's stick to simple display. */}
                                        {users.find(u => u.id === order.user_id)?.name || order.user_id.slice(0, 5)}
                                    </td>
                                    <td className="p-3 font-bold">{formatRupiah(order.total_amount)}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-500">
                                        {order.created_at?.toDate().toLocaleDateString('id-ID')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
