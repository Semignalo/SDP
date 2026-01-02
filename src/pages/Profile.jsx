import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { formatRupiah } from '../lib/currency';
import { Package, Clock, CheckCircle, XCircle, Crown, ChevronRight, Star, Gift, Shield, X, AlertCircle, Settings } from 'lucide-react'; // Added Settings icon import
import { useNavigate, Link } from 'react-router-dom';
import { getTier, getNextTier, TIERS } from '../lib/tiers';

export default function Profile() {
    const { currentUser, userData } = useAuth(); // Removed logout from destructuring if not needed here anymore, or keep it if I want to be safe, but user said remove button.
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [showTierModal, setShowTierModal] = useState(false);
    const navigate = useNavigate();

    const currentTier = getTier(userData?.total_spent || 0, userData?.is_star_center);
    const nextTier = getNextTier(currentTier.level);

    // Calculate Progress
    const totalSpent = userData?.total_spent || 0;
    // Note: Progress should probably reflect their actual spending vs next tier, 
    // OR if they are boosted to Gold, maybe they should see progress to Diamond?
    // Current implementation:
    // If they are Boosted Gold (spending 0), currentTier is Gold (min 20M).
    // range is 20M -> 50M.
    // If we use actual value (0), progress will be negative or wrong if we use currentTier.minSpent.

    // Fix progress calculation logic:
    // If boosted, we should probably behave as if they have the minSpent of that tier for visual progress?
    // Or just let them see they need 50M for Diamond, and they have 0?
    // If I have 0 spent, boosted to Gold (20M). Next is Diamond (50M).
    // Start of bar: 20M. End of bar: 50M. Value: 0. 
    // They will be behind the bar.

    // Better logic: usage of `totalSpent` in progress calculation should perhaps use the effective spent from getTier logic if we want to show them effectively starting from Gold?
    // But `userData.total_spent` is real money.

    // Let's stick to simple update first:
    // If I am Gold (Boosted), minSpent is 20M. Next is 50M. My spent is 0.
    // Progress: (0 - 20) / (50 - 20) = negative.
    // Math.max(0, ...) handles negative. So it will show 0% progress to Diamond. 
    // That seems correct. They effectively have the status but if they want Diamond they need to spend real money? 
    // OR does Star Center mean they get Diamond if they spend 30M more? 
    // The requirement says "langsung masuk ke tiering gold". 
    // Probably implies they get the benefits. 
    // I will use effective spent for the progress bar ensuring it doesn't look broken.

    const effectiveSpent = (userData?.is_star_center && (userData?.total_spent || 0) < 20000000)
        ? 20000000
        : (userData?.total_spent || 0);

    const progressPercent = nextTier
        ? Math.min(100, Math.max(0, ((effectiveSpent - currentTier.minSpent) / (nextTier.minSpent - currentTier.minSpent)) * 100))
        : 100;


    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const fetchOrders = async () => {
            try {
                const q = query(
                    collection(db, "orders"),
                    where("user_id", "==", currentUser.uid)
                );
                const snap = await getDocs(q);
                let fetchedOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Sort client-side
                fetchedOrders.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));

                setOrders(fetchedOrders);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [currentUser]);

    const activeOrders = orders.filter(o => ['pending_payment', 'processing', 'shipped'].includes(o.status));
    const historyOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status));

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> Selesai</span>;
            case 'cancelled':
                return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={12} /> Dibatalkan</span>;
            default: // pending_payment
                return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12} /> Menunggu Konfirmasi</span>;
        }
    };

    const OrderCard = ({ order }) => {
        const [isExpanded, setIsExpanded] = useState(false);

        return (
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 cursor-pointer transition-all hover:shadow-md"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs text-gray-400 font-mono">Order ID: {order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">
                            {order.created_at?.toDate
                                ? order.created_at.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                : '-'
                            }
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''} text-gray-400`}>▼</span>
                    </div>
                </div>

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100 mt-3 border-t border-gray-100 pt-3' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-2 mb-3">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-600 line-clamp-1 flex-1 pr-4">{item.name} <span className="text-gray-400">x{item.qty}</span></span>
                            </div>
                        ))}
                    </div>
                    {/* Invoice Button */}
                    {order.status === 'completed' && (
                        <div className="mt-2 mb-2">
                            <Link
                                to={`/invoice/${order.id}`}
                                className="block w-full py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider text-center rounded hover:bg-gray-200"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Lihat Invoice
                            </Link>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                    <span className="text-sm font-medium text-gray-500">Total Belanja</span>
                    <span className="font-bold text-star-dark">{formatRupiah(order.total_amount)}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 pb-24 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Akun Saya</h1>
                <Link
                    to="/settings"
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
                    title="Pengaturan"
                >
                    <Settings size={22} />
                </Link>
            </div>

            {/* Profile Card & Tier Badge Wrapper */}
            <div className="rounded-2xl shadow-lg overflow-hidden flex flex-col relative">
                {/* Profile Summary */}
                <div className="bg-gradient-to-r from-star-dark to-gray-800 text-white p-6 relative z-10">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner border border-white/10 shrink-0 overflow-hidden">
                            {userData?.photo_url ? (
                                <img src={userData.photo_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                userData?.name?.charAt(0) || 'U'
                            )}
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-bold text-lg truncate">{userData?.name || 'User'}</h2>
                            <p className="text-gray-300 text-sm truncate">{currentUser?.email}</p>
                            <button onClick={() => navigate('/referral')} className="inline-block mt-2 bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full text-xs font-bold hover:bg-white/20 cursor-pointer backdrop-blur-sm transition-colors">
                                Cek Referral & Komisi
                            </button>
                        </div>
                    </div>
                    {/* Decorative BG */}
                    <div className="absolute -right-4 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                </div>

                {/* Loyalty Tier Bar */}
                <button
                    onClick={() => setShowTierModal(true)}
                    className={`w-full p-4 bg-gradient-to-r ${currentTier.gradient} flex items-center justify-between relative z-0 group hover:brightness-110 transition-all`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full bg-white/20 backdrop-blur-sm ${currentTier.textColor}`}>
                            <Crown size={20} fill="currentColor" className="opacity-90" />
                        </div>
                        <div className="text-left">
                            <p className={`font-bold text-sm ${currentTier.textColor}`}>{currentTier.name} Member</p>
                            <p className={`text-xs opacity-90 ${currentTier.textColor}`}>
                                {nextTier
                                    ? `${formatRupiah(totalSpent)} / ${formatRupiah(nextTier.minSpent)}`
                                    : "Top Tier Reached!"
                                }
                            </p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${currentTier.textColor}`}>
                        {nextTier ? 'Lihat Benefit' : 'Lihat Keuntungan'} <ChevronRight size={16} />
                    </div>
                </button>
            </div>

            {/* Active Orders */}
            <div className="pt-2">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gold-600">
                    <Clock className="text-gold-600" /> Pesanan Berlangsung
                </h3>
                {loading ? (
                    <p className="text-center text-gray-500 text-sm">Memuat...</p>
                ) : activeOrders.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-500 text-sm">Tidak ada pesanan aktif.</p>
                    </div>
                ) : (
                    activeOrders.map(order => <OrderCard key={order.id} order={order} />)
                )}
            </div>

            {/* Activity History */}
            <div>
                <div
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex justify-between items-center cursor-pointer mb-4"
                >
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Package className="text-star-dark" /> Riwayat Pesanan
                    </h3>
                    <span className="text-sm text-gold-600 font-medium">
                        {showHistory ? 'Tutup' : 'Lihat Semua'}
                    </span>
                </div>

                {showHistory && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        {loading ? (
                            <p className="text-center text-gray-500 text-sm">Memuat...</p>
                        ) : historyOrders.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed">
                                <p className="text-gray-500 mb-2">Belum ada riwayat pesanan.</p>
                                <Link to="/catalog" className="text-gold-600 font-bold hover:underline">Mulai Belanja</Link>
                            </div>
                        ) : (
                            historyOrders.map((order) => <OrderCard key={order.id} order={order} />)
                        )}
                    </div>
                )}
            </div>

            {/* Tier Modal */}
            {showTierModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col justify-end sm:justify-center animate-in fade-in duration-200">
                    <div className="bg-gray-50 w-full sm:max-w-md mx-auto sm:rounded-2xl rounded-t-3xl min-h-[85vh] sm:min-h-0 max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-300">

                        {/* Modal Header */}
                        <div className={`p-6 pb-12 bg-gradient-to-br ${currentTier.gradient} text-white relative`}>
                            <button onClick={() => setShowTierModal(false)} className="absolute top-4 right-4 p-2 bg-black/10 rounded-full hover:bg-black/20 transition-colors">
                                <X size={20} />
                            </button>

                            <div className="text-center">
                                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl border border-white/30">
                                    <Crown size={40} fill="currentColor" className="text-white drop-shadow-md" />
                                </div>
                                <h2 className="text-2xl font-bold drop-shadow-sm">{currentTier.name}</h2>
                                <p className="text-white/80 text-sm">Kumpulkan poin untuk naik level!</p>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto -mt-6 bg-gray-50 rounded-t-3xl relative z-10 px-6 py-8 space-y-8">

                            {/* Progress Section */}
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="font-bold text-gray-700 text-sm">Progress Tier</span>
                                    <span className="text-xs font-mono text-gray-500">
                                        {formatRupiah(totalSpent)} <span className="text-gray-300">/</span> {nextTier ? formatRupiah(nextTier.minSpent) : "MAX"}
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${currentTier.gradient} transition-all duration-1000`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                {nextTier && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Belanja <b>{formatRupiah(nextTier.minSpent - totalSpent)}</b> lagi untuk mencapai <span className={`font-bold`}>{nextTier.name}</span>
                                    </p>
                                )}
                            </div>

                            {/* Current Benefits */}
                            <div>
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                                    <Gift className="text-purple-500" size={20} /> Keuntungan {currentTier.name}
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {currentTier.benefits?.map((benefit, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-purple-50 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                                                <CheckCircle size={16} className="text-purple-600" />
                                            </div>
                                            <span className="text-gray-700 font-medium text-sm">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* All Tiers Preview */}
                            <div>
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                                    <Shield className="text-blue-500" size={20} /> Level Membership
                                </h3>
                                <div className="space-y-3">
                                    {TIERS.map((tier) => (
                                        <div
                                            key={tier.level}
                                            className={`p-4 rounded-xl border border-gray-100 flex items-center justify-between ${tier.level === currentTier.level ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white opacity-60 grayscale-[0.5]'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                                                    {tier.level}
                                                </div>
                                                <div>
                                                    <p className={`font-bold text-sm ${tier.level === currentTier.level ? 'text-gray-900' : 'text-gray-500'}`}>{tier.name}</p>
                                                    <p className="text-xs text-gray-400">{formatRupiah(tier.minSpent)}+</p>
                                                </div>
                                            </div>
                                            {tier.level === currentTier.level && (
                                                <span className="text-xs font-bold text-blue-600 bg-white px-2 py-1 rounded-md shadow-sm">Current</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
