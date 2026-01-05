import { useEffect, useState } from 'react';
import { db, storage } from '../../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { formatRupiah } from '../../lib/currency';
import { Pencil, Trash2, Plus, X, Upload, Search } from 'lucide-react';

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Search & Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name-asc');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        base_price: '',
        category: '',
        image_url: '',
        stock: '',
        is_promo: false
    });

    const fetchProducts = async () => {
        const snap = await getDocs(collection(db, "products"));
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Filter & Sort Logic
    const filteredProducts = products
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
            if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
            if (sortBy === 'price-asc') return a.base_price - b.base_price;
            if (sortBy === 'price-desc') return b.base_price - a.base_price;
            return 0;
        });

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            // Create a unique filename
            const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);

            // Upload file
            const snapshot = await uploadBytes(storageRef, file);

            // Get URL
            const url = await getDownloadURL(snapshot.ref);

            setFormData(prev => ({ ...prev, image_url: url }));
        } catch (error) {
            console.error("Upload error:", error);
            alert("Gagal mengupload gambar: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                base_price: Number(formData.base_price),
                stock: Number(formData.stock),
                is_active: true,
                is_promo: formData.is_promo || false
            };

            if (editingId) {
                await updateDoc(doc(db, "products", editingId), payload);
            } else {
                await addDoc(collection(db, "products"), payload);
            }

            setShowModal(false);
            setEditingId(null);
            setFormData({ name: '', description: '', base_price: '', category: '', image_url: '', stock: '', is_promo: false });
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
            stock: p.stock,
            is_promo: p.is_promo || false
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Manajemen Produk</h1>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', description: '', base_price: '', category: '', image_url: '', stock: '', is_promo: false });
                        setShowModal(true);
                    }}
                    className="bg-gold-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gold-600 w-full md:w-auto justify-center"
                >
                    <Plus size={18} /> Tambah Produk
                </button>
            </div>

            {/* Search & Sort Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari nama produk..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gold-500 transition"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <select
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gold-500 transition cursor-pointer"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                    >
                        <option value="name-asc">Nama (A-Z)</option>
                        <option value="name-desc">Nama (Z-A)</option>
                        <option value="price-asc">Harga (Termurah)</option>
                        <option value="price-desc">Harga (Termahal)</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((p) => (
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
                    <div className="bg-white w-full max-w-lg rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
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
                                <select
                                    required
                                    className="w-full border p-2 rounded-lg bg-white"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="">Pilih Kategori</option>
                                    <option value="Face & Body Serum">Face & Body Serum</option>
                                    <option value="Trio Holistic">Trio Holistic</option>
                                    <option value="General">General</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                <input
                                    type="checkbox"
                                    id="is_promo"
                                    className="w-5 h-5 text-star-dark rounded focus:ring-gold-500"
                                    checked={formData.is_promo}
                                    onChange={e => setFormData({ ...formData, is_promo: e.target.checked })}
                                />
                                <label htmlFor="is_promo" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                                    🔥 Masukkan ke Special Promo?
                                </label>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Deskripsi</label>
                                <textarea className="w-full border p-2 rounded-lg" rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            {/* Image Upload Section */}
                            <div>
                                <label className="text-sm font-medium mb-1 block">Gambar Produk</label>

                                {formData.image_url && (
                                    <div className="mb-2 relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden border">
                                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-contain" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, image_url: '' })}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}

                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={uploading}
                                    />
                                    <div className="flex flex-col items-center text-gray-500">
                                        {uploading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-star-dark mb-2"></div>
                                                <span className="text-sm">Mengupload...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={32} className="mb-2 text-gray-400" />
                                                <span className="text-sm font-medium text-gray-600">Klik untuk upload gambar</span>
                                                <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {/* Hidden input to force requirement validation if needed, or rely on manual check */}
                                <input
                                    className="sr-only"
                                    value={formData.image_url}
                                    onChange={() => { }}
                                    required
                                    onInvalid={(e) => e.target.setCustomValidity('Harap upload gambar produk')}
                                    onInput={(e) => e.target.setCustomValidity('')}
                                />
                            </div>

                            <button
                                disabled={uploading}
                                className="w-full bg-star-dark text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? 'Sedang Mengupload...' : 'Simpan Produk'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
