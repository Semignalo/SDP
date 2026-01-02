import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { formatRupiah } from '../lib/currency';
import { Printer } from 'lucide-react';

export default function Invoice() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const orderDoc = await getDoc(doc(db, "orders", id));
                if (orderDoc.exists()) {
                    const orderData = orderDoc.data();
                    setOrder({ id: orderDoc.id, ...orderData });

                    // Fetch customer details
                    if (orderData.user_id) {
                        const userDoc = await getDoc(doc(db, "users", orderData.user_id));
                        if (userDoc.exists()) {
                            setUser(userDoc.data());
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching invoice:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) return <div className="p-8 text-center bg-gray-50 min-h-screen">Loading Invoice...</div>;
    if (!order) return <div className="p-8 text-center bg-gray-50 min-h-screen">Invoice tidak ditemukan.</div>;

    const invoiceDate = order.updated_at ? order.updated_at.toDate() : order.created_at.toDate();

    return (
        <div className="bg-gray-100 min-h-screen p-4 md:p-8 print:bg-white print:p-0">
            {/* Print Button */}
            <div className="max-w-3xl mx-auto mb-6 flex justify-end print:hidden">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-star-dark text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-black transition"
                >
                    <Printer size={18} /> Cetak Invoice
                </button>
            </div>

            {/* Invoice Paper */}
            <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-xl shadow-xl print:shadow-none print:w-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-star-dark mb-2">INVOICE</h1>
                        <p className="text-gray-500 font-mono text-sm">#{order.invoice_number || order.id}</p>
                    </div>
                    <div className="text-right">
                        <img src="/starinc-logo.png" alt="Starinc Logo" className="h-20 ml-auto mb-4 object-contain" />
                        <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                            Jl. Ngagel Madya No.19-21, Baratajaya,<br />
                            Kec. Gubeng, Surabaya, Jawa Timur 60284<br />
                            <span className="font-semibold text-star-dark">starinc.id@gmail.com</span>
                        </p>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="border-t border-b border-gray-100 py-6 mb-8 grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tagihan Kepada</h3>
                        <p className="font-bold text-gray-800">{user?.name || 'Customer'}</p>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap max-w-[200px]">
                            {order.shipping_address}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="mb-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tanggal Invoice</h3>
                            <p className="font-medium text-gray-800">
                                {invoiceDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status Pembayaran</h3>
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">
                                LUNAS
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-gray-100">
                            <th className="text-left py-3 text-sm font-bold text-gray-600">Deskripsi Barang</th>
                            <th className="text-right py-3 text-sm font-bold text-gray-600">Harga</th>
                            <th className="text-right py-3 text-sm font-bold text-gray-600">Qty</th>
                            <th className="text-right py-3 text-sm font-bold text-gray-600">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {order.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-4 text-gray-800 font-medium">{item.name}</td>
                                <td className="py-4 text-right text-gray-600">{formatRupiah(item.base_price)}</td>
                                <td className="py-4 text-right text-gray-600">{item.qty}</td>
                                <td className="py-4 text-right font-bold text-gray-800">{formatRupiah(item.base_price * item.qty)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Summary */}
                <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-gray-600 text-sm">
                            <span>Subtotal</span>
                            <span>{formatRupiah(order.total_amount - (order.shipping_cost || 0))}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 text-sm">
                            <span>Ongkos Kirim</span>
                            <span>{formatRupiah(order.shipping_cost || 0)}</span>
                        </div>
                        <div className="border-t-2 border-gray-800 pt-2 flex justify-between font-bold text-xl text-gray-900 mt-4">
                            <span>Total</span>
                            <span>{formatRupiah(order.total_amount)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 text-center border-t border-gray-100 pt-8 text-gray-400 text-sm">
                    <p>Terima kasih telah berbelanja di Star Digital Program.</p>
                </div>
            </div>
        </div>
    );
}
