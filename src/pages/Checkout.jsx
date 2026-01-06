import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatRupiah } from '../lib/currency';
import { ArrowLeft, Upload, CreditCard, CheckCircle } from 'lucide-react';
import { auth, db, storage } from '../lib/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { getTier, calculateDiscountedPrice } from '../lib/tiers';
import { useToast } from '../context/ToastContext';

export default function Checkout() {
    const { cart, totalItems, clearCart } = useCart();
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Form State
    const [address, setAddress] = useState('');
    const [courier, setCourier] = useState('jne');
    const [paymentFile, setPaymentFile] = useState(null);

    // Bank Details State
    const [bankDetails, setBankDetails] = useState({
        bank_name: 'BCA',
        account_number: '1234567890',
        account_holder: 'Star Digital Program'
    });

    // Fetch Bank Settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, "settings", "general");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Only update if data exists to prevent overriding defaults with undefined
                    setBankDetails(prev => ({
                        ...prev,
                        bank_name: data.bank_name || prev.bank_name,
                        account_number: data.account_number || prev.account_number,
                        account_holder: data.account_holder || prev.account_holder
                    }));
                }
            } catch (err) {
                console.error("Failed to load bank settings", err);
            }
        };
        fetchSettings();
    }, []);

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

        if (!address) {
            return addToast("Mohon lengkapi alamat pengiriman.", "error");
        }
        if (!paymentFile) {
            return addToast("Mohon upload bukti transfer.", "error");
        }

        setLoading(true);
        try {
            if (!currentUser) {
                addToast("Sesi habis, silakan login kembali.", "error");
                return;
            }

            // 1. Upload Payment Proof
            const fileRef = ref(storage, `payment_proofs/${Date.now()}_${paymentFile.name}`);
            await uploadBytes(fileRef, paymentFile);
            const proofUrl = await getDownloadURL(fileRef);

            // 2. Create Order Data
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

            // 3. Save to Firestore
            await addDoc(collection(db, "orders"), orderData);

            clearCart();
            setShowSuccessModal(true);
            addToast("Pesanan berhasil dibuat!", "success");

        } catch (err) {
            console.error(err);
            addToast("Gagal checkout: " + err.message, "error");
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
                        <p className="text-xs text-gray-500 mb-1">Transfer ke Bank {bankDetails.bank_name}</p>
                        <p className="font-mono font-bold text-lg text-blue-800">{bankDetails.account_number}</p>
                        <p className="text-xs text-gray-500 mt-1">a/n {bankDetails.account_holder}</p>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                        <input
                            type="file"
                            id="proof"
                            className="hidden"
                            accept="image/jpeg,image/png,application/pdf"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    // Validation: Max 5MB
                                    if (file.size > 5 * 1024 * 1024) {
                                        addToast("Ukuran file terlalu besar! Maksimal 5MB.", "error");
                                        e.target.value = null; // Reset input
                                        return;
                                    }
                                    // Validation: Type
                                    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
                                        addToast("Format file tidak didukung. Gunakan JPG, PNG, atau PDF.", "error");
                                        e.target.value = null;
                                        return;
                                    }
                                    setPaymentFile(file);
                                }
                            }}
                        />
                        <label htmlFor="proof" className="cursor-pointer flex flex-col items-center gap-2 w-full">
                            <Upload className={`w-8 h-8 ${paymentFile ? 'text-green-500' : 'text-gray-400'}`} />
                            <span className="text-sm text-gray-700 font-medium">
                                {paymentFile ? (
                                    <span className="text-green-600 font-bold">{paymentFile.name}</span>
                                ) : (
                                    "Klik untuk Upload Bukti Transfer"
                                )}
                            </span>
                            <p className="text-xs text-gray-400 mt-1">
                                Format: JPG, PNG, PDF. Maksimal 5MB.
                            </p>
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
