import React from 'react';
import { calculateDiscountedPrice, getTier } from '../../lib/tiers';
import { formatRupiah } from '../../lib/currency';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
    const { userData } = useAuth();
    const { addToCart } = useCart();
    const { addToast } = useToast();

    // Pass isStarCenter to getTier
    const tier = getTier(userData?.total_spent || 0, userData?.is_star_center);
    // Ensure numeric price
    const originalPrice = Number(product.base_price) || 0;


    // Use new return structure: { discountedPrice, discountAmount }
    const { discountedPrice } = calculateDiscountedPrice(originalPrice, tier);
    const finalPrice = discountedPrice;

    const hasDiscount = originalPrice > finalPrice;

    const handleAdd = (e) => {
        e.preventDefault(); // Prevent navigating if clicking the add button
        e.stopPropagation();
        addToCart({
            id: product.id,
            name: product.name,
            base_price: product.base_price,
            image_url: product.image_url
        });
        addToast('Produk berhasil masuk keranjang!', 'success');
    };

    return (
        <Link to={`/product/${product.id}`} className="block">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full group relative cursor-pointer">
                <div className="relative pt-[100%] bg-gray-100">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
                            No Image
                        </div>
                    )}
                    {/* Badge if needed */}
                    {hasDiscount && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                            Hemat {formatRupiah(originalPrice - finalPrice)}
                        </div>
                    )}
                </div>

                <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-medium text-sm text-gray-800 line-clamp-2 mb-1">{product.name}</h3>

                    <div className="mt-auto pt-2 flex items-end justify-between">
                        <div>
                            {hasDiscount && (
                                <p className="text-xs text-gray-400 line-through mb-0.5">
                                    {formatRupiah(originalPrice)}
                                </p>
                            )}
                            <p className={cn(
                                "font-bold text-base",
                                hasDiscount ? "text-gold-600" : "text-gray-900"
                            )}>
                                {formatRupiah(finalPrice)}
                            </p>
                        </div>

                        <button
                            onClick={handleAdd}
                            className="bg-star-dark text-white p-2 rounded-lg hover:bg-gold-500 transition-colors shadow-md active:scale-95 z-10 relative"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
