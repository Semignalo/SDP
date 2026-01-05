import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import ProductCard from '../components/ui/ProductCard';

import { Search } from 'lucide-react';

export default function Catalog() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const q = query(collection(db, "products"), where("is_active", "==", true));
                const querySnapshot = await getDocs(q);
                const productsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setProducts(productsData);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 pb-24">
            <h1 className="text-2xl font-bold mb-4">Katalog Produk</h1>

            {/* Search Bar */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-2 sticky top-4 z-10">
                <Search className="text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Cari produk..."
                    className="flex-1 outline-none text-sm bg-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-2 gap-3 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-gray-200 aspect-square rounded-xl" />
                    ))}
                </div>
            ) : (
                <>
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-500">Tidak ada produk ditemukan.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
