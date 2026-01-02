import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getTier, calculateDiscountedPrice } from '../lib/tiers';
import { formatRupiah } from '../lib/currency';
import { ArrowLeft, Minus, Plus, ShoppingCart, Share2 } from 'lucide-react';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userData } = useAuth();
    const { addToCart } = useCart();
    const { addToast } = useToast();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const docRef = doc(db, "products", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProduct({ id: docSnap.id, ...docSnap.data() });
                } else {
                    alert("Produk tidak ditemukan");
                    navigate('/catalog');
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, navigate]);

    const handleAddToCart = async () => {
        setAdding(true);
        // Simulate a small delay for better UX feel
        await new Promise(r => setTimeout(r, 500));

        for (let i = 0; i < qty; i++) {
            addToCart(product);
        }

        addToast('Produk berhasil ditambahkan ke keranjang!', 'success');
        setAdding(false);
        navigate('/cart');
    };

    if (loading) return <div className="p-8 text-center">Memuat produk...</div>;
    if (!product) return null;

    // Price Calculation
    const basePrice = Number(product.base_price) || 0;
    const tier = getTier(userData?.total_spent || 0, userData?.is_star_center);
    const { discountedPrice, discountAmount } = calculateDiscountedPrice(basePrice, tier);


    return (
        <div className="bg-white min-h-screen pb-32 relative">
            {/* Header / Nav */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 pointer-events-none">
                <button onClick={() => navigate(-1)} className="bg-white/80 backdrop-blur p-2 rounded-full shadow-sm text-gray-700 pointer-events-auto">
                    <ArrowLeft size={24} />
                </button>
                <button className="bg-white/80 backdrop-blur p-2 rounded-full shadow-sm text-gray-700 pointer-events-auto">
                    <Share2 size={24} />
                </button>
            </div>

            {/* Product Image (Simulate Gallery) */}
            <div className="h-[45vh] bg-gray-100 w-full relative">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    <div className="w-2 h-2 bg-star-dark rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                </div>
            </div>

            {/* Content Container - Rounded Top */}
            <div className="-mt-6 bg-white rounded-t-3xl relative z-0 px-6 pt-8 pb-4 min-h-[50vh]">
                <div className="mb-2">
                    <span className="text-sm text-gray-400 font-medium">{product.category || 'General'}</span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>

                <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl font-bold text-gold-600">{formatRupiah(discountedPrice)}</span>
                    {discountAmount > 0 && (
                        <div className="flex flex-col">
                            <span className="text-sm text-gray-400 line-through decoration-red-400">{formatRupiah(basePrice)}</span>
                            <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full w-fit">
                                Hemat {formatRupiah(discountAmount)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-100 py-6">
                    <h3 className="font-bold text-lg mb-3">Deskripsi Produk</h3>
                    <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
                        {product.description || "Tidak ada deskripsi untuk produk ini."}
                    </p>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 px-6 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="max-w-md mx-auto flex items-center gap-4">
                    {/* Qty Control */}
                    <div className="flex items-center bg-gray-100 rounded-xl px-2 py-1">
                        <button
                            onClick={() => setQty(Math.max(1, qty - 1))}
                            className="p-2 text-gray-600 hover:text-star-dark transition disabled:opacity-30"
                            disabled={qty <= 1}
                        >
                            <Minus size={20} />
                        </button>
                        <span className="w-8 text-center font-bold text-gray-800">{qty}</span>
                        <button
                            onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}
                            className="p-2 text-gray-600 hover:text-star-dark transition"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={handleAddToCart}
                        disabled={adding || (product.stock || 0) <= 0}
                        className="flex-1 bg-star-dark text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {adding ? (
                            'Menambahkan...'
                        ) : (product.stock || 0) > 0 ? (
                            <>
                                <ShoppingCart size={20} />
                                + Keranjang
                            </>
                        ) : (
                            'Stok Habis'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
