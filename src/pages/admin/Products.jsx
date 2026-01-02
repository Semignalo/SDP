import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { formatRupiah } from '../../lib/currency';
import { Pencil, Trash2, Plus, X } from 'lucide-react';

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        base_price: '',
        category: '',
        image_url: '',
        stock: ''
    });

    const fetchProducts = async () => {
        const snap = await getDocs(collection(db, "products"));
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                base_price: Number(formData.base_price),
                stock: Number(formData.stock),
                is_active: true
            };

            if (editingId) {
                await updateDoc(doc(db, "products", editingId), payload);
            } else {
                await addDoc(collection(db, "products"), payload);
            }

            setShowModal(false);
            setEditingId(null);
            setFormData({ name: '', description: '', base_price: '', category: '', image_url: '', stock: '' });
            fetchProducts();
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    const handleEdit = (p) => {
        setEditingId(p.id);
        setFormData({
            name: p.name,
            description: p.description,
            base_price: p.base_price,
            category: p.category,
            image_url: p.image_url,
            stock: p.stock
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Hapus produk ini?")) return;
        await deleteDoc(doc(db, "products", id));
        fetchProducts();
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manajemen Produk</h1>
                <button
                    onClick={() => { setEditingId(null); setFormData({ name: '', description: '', base_price: '', category: '', image_url: '', stock: '' }); setShowModal(true); }}
                    className="bg-gold-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gold-600"
                >
                    <Plus size={18} /> Tambah Produk
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0">
                            {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-cover rounded-lg" />}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-800 line-clamp-1">{p.name}</h3>
                            <p className="text-xs text-gray-500 mb-2">{p.category}</p>
                            <p className="font-bold text-gold-600">{formatRupiah(p.base_price)}</p>
                            <p className="text-xs text-gray-400">Stok: {p.stock}</p>

                            <div className="flex gap-2 mt-3 justify-end">
                                <button onClick={() => handleEdit(p)} className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"><Pencil size={16} /></button>
                                <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl p-6 relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400"><X size={24} /></button>
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Nama Produk</label>
                                <input required className="w-full border p-2 rounded-lg" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Harga (Rp)</label>
                                    <input required type="number" className="w-full border p-2 rounded-lg" value={formData.base_price} onChange={e => setFormData({ ...formData, base_price: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Stok</label>
                                    <input required type="number" className="w-full border p-2 rounded-lg" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Kategori</label>
                                <input required className="w-full border p-2 rounded-lg" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Deskripsi</label>
                                <textarea className="w-full border p-2 rounded-lg" rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Image URL</label>
                                <input required className="w-full border p-2 rounded-lg" placeholder="https://..." value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} />
                            </div>

                            <button className="w-full bg-star-dark text-white py-3 rounded-xl font-bold">Simpan Produk</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
