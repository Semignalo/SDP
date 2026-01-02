import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import ProductCard from '../components/ui/ProductCard';

export default function Catalog() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="p-4 pb-24">
            <h1 className="text-2xl font-bold mb-4">Katalog Produk</h1>

            {loading ? (
                <div className="grid grid-cols-2 gap-3 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-gray-200 aspect-square rounded-xl" />
                    ))}
                </div>
            ) : (
                <>
                    {products.length === 0 ? (
                        <p className="text-gray-500 text-center mt-10">Belum ada produk.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
