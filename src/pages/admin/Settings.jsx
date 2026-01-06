import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';
import { Save, Building, CreditCard, Phone, MapPin, Globe } from 'lucide-react';

export default function AdminSettings() {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [config, setConfig] = useState({
        site_name: '',
        bank_name: '',
        account_number: '',
        account_holder: '',
        warehouse_address: '',
        hotline_wa: '', // WhatsApp number
        email_contact: ''
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, "settings", "general");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setConfig({ ...config, ...docSnap.data() });
                } else {
                    // Initialize if not exists
                    const initialData = {
                        site_name: 'Star Digital Program',
                        bank_name: 'BCA',
                        account_number: '1234567890',
                        account_holder: 'Star Digital Program',
                        warehouse_address: 'Jakarta, Indonesia',
                        hotline_wa: '628123456789',
                        email_contact: 'admin@stardigital.com'
                    };
                    await setDoc(docRef, initialData);
                    setConfig(initialData);
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
                addToast("Gagal memuat pengaturan.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleChange = (e) => {
        setConfig({ ...config, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await setDoc(doc(db, "settings", "general"), config);
            addToast("Pengaturan berhasil disimpan!", "success");
        } catch (error) {
            console.error("Error saving settings:", error);
            addToast("Gagal menyimpan pengaturan: " + error.message, "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Pengaturan Website</h1>

            <form onSubmit={handleSave} className="max-w-4xl space-y-6">

                {/* General Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
                        <Globe size={20} /> Informasi Umum
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Nama Website / Project</label>
                            <input
                                name="site_name"
                                value={config.site_name}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Email Kontak</label>
                            <input
                                name="email_contact"
                                value={config.email_contact}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Payment Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
                        <CreditCard size={20} /> Metode Pembayaran (Transfer Manual)
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Nama Bank</label>
                            <input
                                name="bank_name"
                                value={config.bank_name}
                                onChange={handleChange}
                                placeholder="ex: BCA"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Nomor Rekening</label>
                            <input
                                name="account_number"
                                value={config.account_number}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Atas Nama</label>
                            <input
                                name="account_holder"
                                value={config.account_holder}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Logistics & Contact */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
                        <Building size={20} /> Logistik & Kontak
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                                <Phone size={16} /> Kontak Hotline (WhatsApp)
                            </label>
                            <input
                                name="hotline_wa"
                                value={config.hotline_wa}
                                onChange={handleChange}
                                placeholder="628..."
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">Gunakan format internasional tanpa +, contoh: 628123456789</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                                <MapPin size={16} /> Alamat Gudang / Toko
                            </label>
                            <textarea
                                name="warehouse_address"
                                value={config.warehouse_address}
                                onChange={handleChange}
                                rows="3"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-6 right-6 z-10 md:static md:flex md:justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-all disabled:opacity-50"
                    >
                        <Save size={20} />
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>

            </form>
        </div>
    );
}
