import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTier, TIERS } from '../lib/tiers';
import { formatRupiah as formatIDR } from '../lib/currency';
import { ArrowRight } from 'lucide-react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ProductCard from '../components/ui/ProductCard';

export default function Home() {
    const { userData } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Fetch all products to categorize them client-side
                // In a real large app, you'd use separate queries with 'where' clauses.
                const q = query(collection(db, "products"));
                const snap = await getDocs(q);
                setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error("Failed to load products", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const totalSpent = userData?.total_spent || 0;
    const currentTier = getTier(totalSpent, userData?.is_star_center);
    const nextTier = TIERS.find(t => t.level === currentTier.level + 1);

    const progress = nextTier
        ? Math.min(100, Math.max(0, ((totalSpent - currentTier.minSpent) / (nextTier.minSpent - currentTier.minSpent)) * 100))
        : 100;

    // Filter Products by Category/Attributes
    const promoProducts = products.filter(p => p.is_promo === true);
    const serumProducts = products.filter(p => p.category === 'Face & Body Serum');
    const trioProducts = products.filter(p => p.category === 'Trio Holistic');

    // Fallback: If no category matches, maybe show them in a "General" or mixed section? 
    // The user specifically asked for these 3. I'll just show these 3 for now as requested.

    const ProductSection = ({ title, items }) => (
        <section>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                {items.length > 4 && (
                    <button className="text-gold-600 text-sm font-medium flex items-center">
                        View All <ArrowRight size={16} className="ml-1" />
                    </button>
                )}
            </div>
            {items.length === 0 ? (
                <div className="text-gray-400 text-sm italic py-4">Belum ada produk di kategori ini.</div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {items.slice(0, 4).map((product) => ( // Limit to 4 for display
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </section>
    );

    return (
        <div className="p-4 space-y-8 pb-24">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-star-dark">Star Digital</h1>
                    <p className="text-gray-500 text-sm">Welcome back, {userData?.name || 'Guest'}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentTier.bg} ${currentTier.color}`}>
                    {currentTier.name} • {currentTier.discount * 100}% OFF
                </div>
            </header>

            <section className="bg-gradient-to-r from-star-dark to-gray-800 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-gold-400 font-medium mb-1">Total Accumulation</p>
                    <h2 className="text-3xl font-bold mb-4">{formatIDR(totalSpent)}</h2>

                    <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-2">
                        <div
                            className="bg-gold-500 h-full transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {nextTier ? (
                        <div className="flex justify-between text-xs text-gray-300">
                            <span>{currentTier.name}</span>
                            <span className="text-right">To {nextTier.name}: {formatIDR(nextTier.minSpent - totalSpent)}</span>
                        </div>
                    ) : (
                        <p className="text-xs text-gold-400 font-bold">Max Tier Reached! You are a Legend.</p>
                    )}
                </div>

                {/* Decorative Circle */}
                <div className="absolute -right-4 -bottom-10 w-32 h-32 bg-gold-500/20 rounded-full blur-2xl" />
            </section>

            {loading ? (
                <div className="space-y-4">
                    <div className="bg-white h-8 w-1/3 rounded animate-pulse" />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white h-48 rounded-xl shadow-sm animate-pulse" />
                        <div className="bg-white h-48 rounded-xl shadow-sm animate-pulse" />
                    </div>
                </div>
            ) : (
                <>
                    <ProductSection title="Special Promo" items={promoProducts} />
                    <ProductSection title="Face & Body Serum" items={serumProducts} />
                    <ProductSection title="Trio Holistic" items={trioProducts} />
                </>
            )}
        </div>
    );
}

