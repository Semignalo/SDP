import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, getDoc, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { formatRupiah } from '../../lib/currency';
import { Check, X, Eye } from 'lucide-react';

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [userNames, setUserNames] = useState({});

    // Confirmation Modal State
    const [confirmAction, setConfirmAction] = useState(null); // { type: 'approve'|'reject', order }
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const unsubscribeOrders = onSnapshot(query(collection(db, "orders"), orderBy("created_at", "desc")), (snapshot) => {
            setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
            const names = {};
            snapshot.docs.forEach(doc => {
                names[doc.id] = doc.data().name || "Unknown";
            });
            setUserNames(names);
        });

        return () => {
            unsubscribeOrders();
            unsubscribeUsers();
        };
    }, []);

    const performApprove = async (order) => {
        setProcessing(true);
        try {
            const orderRef = doc(db, "orders", order.id);
            const userRef = doc(db, "users", order.user_id);

            // 1. Generate Invoice Number
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            const invNum = `INV/${dateStr}/${randomSuffix}`;

            // 2. Update Order Status & Invoice
            await updateDoc(orderRef, {
                status: 'completed',
                invoice_number: invNum,
                updated_at: serverTimestamp()
            });

            // 3. Update User Total Spent
            await updateDoc(userRef, {
                total_spent: increment(order.total_amount)
            });

            // 4. Calculate Commission
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();

            if (userData?.referred_by_code) {
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("referral_code", "==", userData.referred_by_code));
                const uplineDest = await getDocs(q);

                if (!uplineDest.empty) {
                    const uplineDoc = uplineDest.docs[0];
                    const uplineRef = doc(db, "users", uplineDoc.id);
                    const commission = order.total_amount * 0.05;

                    await updateDoc(uplineRef, {
                        wallet_balance: increment(commission)
                    });

                    await addDoc(collection(db, 'commissions'), {
                        upline_id: uplineDoc.id,
                        from_user: userData.name || 'Anonymous User',
                        amount: commission,
                        order_id: order.id,
                        created_at: serverTimestamp()
                    });
                }
            }
            setSelectedOrder(null);
        } catch (err) {
            console.error(err);
            alert("Error: " + err.message);
        } finally {
            setProcessing(false);
            setConfirmAction(null);
        }
    };

    const performReject = async (order) => {
        setProcessing(true);
        try {
            await updateDoc(doc(db, "orders", order.id), { status: 'cancelled' });
            setSelectedOrder(null);
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setProcessing(false);
            setConfirmAction(null);
        }
    };

    // UI Handlers
    const handleApproveClick = (e, order) => {
        e.stopPropagation();
        setConfirmAction({ type: 'approve', order });
    };

    const handleRejectClick = (e, order) => {
        e.stopPropagation();
        setConfirmAction({ type: 'reject', order });
    };

    const closeConfirm = () => setConfirmAction(null);

    const onConfirmYes = () => {
        if (confirmAction?.type === 'approve') {
            performApprove(confirmAction.order);
        } else if (confirmAction?.type === 'reject') {
            performReject(confirmAction.order);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Manajemen Pesanan</h1>

            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-medium text-gray-500">Order ID</th>
                            <th className="p-4 font-medium text-gray-500">Date</th>
                            <th className="p-4 font-medium text-gray-500">User</th>
                            <th className="p-4 font-medium text-gray-500">Total</th>
                            <th className="p-4 font-medium text-gray-500">Status</th>
                            <th className="p-4 font-medium text-gray-500">Bukti</th>
                            <th className="p-4 font-medium text-gray-500">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="7" className="p-4 text-center">Loading...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan="7" className="p-4 text-center">Tidak ada pesanan.</td></tr>
                        ) : (
                            orders.map((order) => (
                                <tr
                                    key={order.id}
                                    onClick={() => setSelectedOrder(order)}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <td className="p-4 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                                    <td className="p-4 text-gray-500">
                                        {order.created_at?.toDate().toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="p-4 font-medium">
                                        {userNames[order.user_id] || order.user_id.slice(0, 8)}
                                    </td>
                                    <td className="p-4 font-bold text-gray-700">{formatRupiah(order.total_amount)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize
                      ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <a
                                            href={order.payment_proof_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-blue-500 flex items-center gap-1 hover:underline"
                                        >
                                            <Eye size={14} /> Lihat
                                        </a>
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        {order.status === 'pending_payment' && (
                                            <>
                                                <button
                                                    onClick={(e) => handleApproveClick(e, order)}
                                                    className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100"
                                                    title="Approve"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleRejectClick(e, order)}
                                                    className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                                                    title="Reject"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-bold">Detail Pesanan</h2>
                                <p className="text-sm text-gray-500 font-mono">#{selectedOrder.id}</p>
                                <p className="text-sm font-bold text-gray-800 mt-1">
                                    Customer: {userNames[selectedOrder.user_id] || selectedOrder.user_id}
                                </p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status Banner */}
                            <div className={`p-4 rounded-xl flex justify-between items-center ${selectedOrder.status === 'completed' ? 'bg-green-50 text-green-700' :
                                selectedOrder.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                                    'bg-yellow-50 text-yellow-700'
                                }`}>
                                <span className="font-bold capitalize">{selectedOrder.status.replace('_', ' ')}</span>
                                <span className="text-sm">
                                    {selectedOrder.created_at?.toDate().toLocaleString('id-ID')}
                                </span>
                            </div>

                            {/* Shipping Info */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Pengiriman Ke</h3>
                                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg text-sm leading-relaxed">
                                        {selectedOrder.shipping_address}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Bukti Pembayaran</h3>
                                    <a
                                        href={selectedOrder.payment_proof_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block bg-blue-50 text-blue-600 p-3 rounded-lg text-center font-bold hover:bg-blue-100 transition"
                                    >
                                        Lihat Bukti Transfer ↗
                                    </a>
                                </div>
                            </div>

                            {/* Items List */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">Barang Pesanan</h3>
                                <div className="space-y-3">
                                    {selectedOrder.items?.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-center bg-white border border-gray-100 p-3 rounded-xl">
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</h4>
                                                <p className="text-xs text-gray-500">{item.qty} x {formatRupiah(item.base_price)}</p>
                                            </div>
                                            <div className="font-bold text-gray-700">
                                                {formatRupiah(item.base_price * item.qty)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="border-t border-gray-100 pt-4 flex flex-col gap-2 items-end">
                                <div className="flex justify-between w-full max-w-xs text-sm text-gray-500">
                                    <span>Ongkos Kirim</span>
                                    <span>{formatRupiah(selectedOrder.shipping_cost || 0)}</span>
                                </div>
                                <div className="flex justify-between w-full max-w-xs text-lg font-bold text-gray-900">
                                    <span>Total Pembayaran</span>
                                    <span>{formatRupiah(selectedOrder.total_amount)}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            {selectedOrder.status === 'pending_payment' ? (
                                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100">
                                    <button
                                        onClick={(e) => handleRejectClick(e, selectedOrder)}
                                        className="py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50"
                                    >
                                        Tolak Pesanan
                                    </button>
                                    <button
                                        onClick={(e) => handleApproveClick(e, selectedOrder)}
                                        className="py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-200"
                                    >
                                        Terima & Proses
                                    </button>
                                </div>
                            ) : selectedOrder.status === 'completed' && (
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <a
                                        href={`/invoice/${selectedOrder.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full py-3 rounded-xl bg-gray-800 text-white font-bold text-center hover:bg-black shadow-lg"
                                    >
                                        📄 Lihat / Cetak Invoice
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmAction.type === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                            {confirmAction.type === 'approve' ? <Check size={32} /> : <X size={32} />}
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            {confirmAction.type === 'approve' ? 'Terima Pesanan?' : 'Tolak Pesanan?'}
                        </h2>
                        <p className="text-gray-500 text-sm mb-6">
                            {confirmAction.type === 'approve'
                                ? `Anda akan menerima pesanan dari ${userNames[confirmAction.order.user_id] || 'User'} . Invoice akan dibuat otomatis.`
                                : `Pesanan ini akan dibatalkan. Tindakan ini tidak dapat dibatalkan.`
                            }
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={closeConfirm}
                                disabled={processing}
                                className="py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={onConfirmYes}
                                disabled={processing}
                                className={`py-2.5 rounded-xl text-white font-bold shadow-lg ${confirmAction.type === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                {processing ? 'Memproses...' : (confirmAction.type === 'approve' ? 'Ya, Terima' : 'Ya, Tolak')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
