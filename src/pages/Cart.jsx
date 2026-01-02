import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { calculateDiscountedPrice, getTier } from '../lib/tiers';
import { formatRupiah } from '../lib/currency';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Cart() {
    const { cart, removeFromCart, updateQty, totalItems } = useCart();
    const { userData } = useAuth();

    // Pass isStarCenter
    const tier = getTier(userData?.total_spent || 0, userData?.is_star_center);


    // Calculate totals
    const totalAmount = cart.reduce((acc, item) => {
        const { discountedPrice } = calculateDiscountedPrice(item.base_price, tier);
        return acc + (discountedPrice * item.qty);
    }, 0);

    // Calculate potential savings (Optional display)
    const totalBase = cart.reduce((acc, item) => acc + (item.base_price * item.qty), 0);
    const totalSavings = totalBase - totalAmount;

    if (cart.length === 0) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-gray-500 text-center">
                <div className="bg-gray-100 p-6 rounded-full mb-4">
                    <ShoppingBag size={48} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Keranjang Kosong</h2>
                <p className="mb-6">Belum ada barang yang kamu pilih.</p>
                <Link to="/catalog" className="bg-star-dark text-white px-6 py-3 rounded-xl font-bold shadow-lg">
                    Mulai Belanja
                </Link>
            </div>
        );
    }

    return (
        <div className="p-4 pb-32">
            <h1 className="text-2xl font-bold mb-6">Keranjang ({totalItems})</h1>

            <div className="space-y-4">
                {cart.map((item) => {
                    const { discountedPrice } = calculateDiscountedPrice(item.base_price, tier);

                    return (
                        <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3">
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                {item.image_url && <img src={item.image_url} className="w-full h-full object-cover" />}
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-sm line-clamp-2">{item.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="font-bold text-gold-600">{formatRupiah(discountedPrice)}</p>
                                        {item.base_price > discountedPrice && (
                                            <p className="text-xs text-gray-400 line-through">{formatRupiah(item.base_price)}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-end mt-2">
                                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                                        <button
                                            onClick={() => updateQty(item.id, item.qty - 1)}
                                            className="p-1 text-gray-500 hover:text-black"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                                        <button
                                            onClick={() => updateQty(item.id, item.qty + 1)}
                                            className="p-1 text-gray-500 hover:text-black"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-red-500 p-1.5 bg-red-50 rounded-lg"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="fixed bottom-[70px] left-0 right-0 max-w-md mx-auto p-4 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-500">Total Pembayaran</span>
                    <div className="text-right">
                        {totalSavings > 0 && <p className="text-xs text-green-600">Hemat {formatRupiah(totalSavings)}</p>}
                        <span className="text-xl font-bold">{formatRupiah(totalAmount)}</span>
                    </div>
                </div>
                <Link to="/checkout" className="w-full block text-center bg-star-dark text-white py-3 rounded-xl font-bold shadow-lg hover:bg-black transition">
                    Checkout Sekarang
                </Link>
            </div>
        </div>
    );
}
