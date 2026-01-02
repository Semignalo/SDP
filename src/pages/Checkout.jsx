import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatRupiah } from '../lib/currency';
import { ArrowLeft, Upload, CreditCard, CheckCircle } from 'lucide-react';
import { auth, db, storage } from '../lib/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { getTier, calculateDiscountedPrice } from '../lib/tiers';

export default function Checkout() {
    const { cart, totalItems, clearCart } = useCart();
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    if (!currentUser) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-screen text-center">
                <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
                <p className="mb-4">Anda harus login untuk memproses pesanan.</p>
                <Link to="/login" className="bg-star-dark text-white px-6 py-2 rounded-lg font-bold">
                    Login Sekarang
                </Link>
            </div>
        );
    }

    // Form State
    const [address, setAddress] = useState('');
    const [courier, setCourier] = useState('jne');
    const [paymentFile, setPaymentFile] = useState(null);

    // Simple hardcoded shipping cost for now
    const shippingCost = 20000;

    const getTotal = () => {
        const tier = getTier(userData?.total_spent || 0, userData?.is_star_center);
        return cart.reduce((acc, item) => {
            const { discountedPrice } = calculateDiscountedPrice(item.base_price, tier);

            return acc + (discountedPrice * item.qty);
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!address || !paymentFile) return alert("Mohon lengkapi alamat dan bukti transfer");

        setLoading(true);
        try {
            if (!currentUser) return alert("Silakan login user terlebih dahulu.");

            // Simulation delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            const proofUrl = "https://placehold.co/400x600?text=Bukti+Transfer+Dummy";

            const orderData = {
                user_id: currentUser.uid,
                items: cart,
                shipping_address: address,
                shipping_cost: shippingCost,
                total_amount: getTotal() + shippingCost,
                status: 'pending_payment',
                payment_proof_url: proofUrl,
                created_at: serverTimestamp()
            };

            await addDoc(collection(db, "orders"), orderData);

            clearCart();
            setShowSuccessModal(true);

        } catch (err) {
            console.error(err);
            alert("Gagal checkout: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 pb-24 bg-gray-50 min-h-screen">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold">Checkout / Pembayaran</h1>
            </div>

            <div className="space-y-6">
                {/* Address Section */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                        <span className="bg-star-dark text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">1</span>
                        Alamat Pengiriman
                    </h3>
                    <textarea
                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none text-sm h-24 resize-none"
                        placeholder="Jalan, Nomor Rumah, Kecamatan, Kota, Kode Pos..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </div>

                {/* Courier Section (Placeholder) */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                        <span className="bg-star-dark text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">2</span>
                        Pengiriman
                    </h3>
                    <select
                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none text-sm"
                        value={courier}
                        onChange={(e) => setCourier(e.target.value)}
                    >
                        <option value="jne">JNE - Regular (Rp 20.000)</option>
                        <option value="jnt">J&T - Regular (Rp 20.000)</option>
                    </select>
                </div>

                {/* Payment Section */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                        <span className="bg-star-dark text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">3</span>
                        Metode Pembayaran
                    </h3>

                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <p className="text-xs text-gray-500 mb-1">Transfer ke Bank BCA</p>
                        <p className="font-mono font-bold text-lg text-blue-800">123 456 7890</p>
                        <p className="text-xs text-gray-500 mt-1">a/n Star Digital Program</p>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                            type="file"
                            id="proof"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => setPaymentFile(e.target.files[0])}
                        />
                        <label htmlFor="proof" className="cursor-pointer flex flex-col items-center gap-2">
                            <Upload className="text-gray-400" />
                            <span className="text-sm text-gray-600 font-medium">
                                {paymentFile ? paymentFile.name : "Upload Bukti Transfer"}
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
                <div className="max-w-md mx-auto">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-star-dark text-white py-3.5 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50"
                    >
                        {loading ? 'Memproses...' : 'Bayar Sekarang'}
                    </button>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <CheckCircle className="text-green-600 w-10 h-10" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pesanan Berhasil!</h2>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                            Terima kasih telah berbelanja.<br />Admin kami akan segera memverifikasi pembayaran Anda.
                        </p>
                        <div className="space-y-3">
                            <Link
                                to="/profile"
                                className="block w-full py-3 bg-star-dark text-white font-bold rounded-xl hover:bg-black transition-colors"
                            >
                                Cek Status Pesanan
                            </Link>
                            <Link
                                to="/"
                                className="block w-full py-3 text-gray-500 font-medium hover:text-gray-800"
                            >
                                Kembali ke Beranda
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
