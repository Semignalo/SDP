import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { formatRupiah } from '../../lib/currency';
import { getTier } from '../../lib/tiers';
import { Search, Shield, ShieldCheck, MapPin } from 'lucide-react';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        try {
            const snap = await getDocs(collection(db, "users"));
            const usersList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setUsers(usersList);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleStarCenter = async (user) => {
        const newValue = !user.is_star_center;
        if (!confirm(`Ubah status Star Center untuk user ${user.name} menjadi ${newValue ? 'AKTIF' : 'NON-AKTIF'}?`)) return;

        try {
            await updateDoc(doc(db, "users", user.id), {
                is_star_center: newValue
            });
            // Update local state
            setUsers(users.map(u => u.id === user.id ? { ...u, is_star_center: newValue } : u));
        } catch (err) {
            alert("Gagal update user: " + err.message);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.referral_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manajemen Users & Star Center</h1>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-2">
                <Search className="text-gray-400" />
                <input
                    type="text"
                    placeholder="Cari nama, email, atau kode referral..."
                    className="flex-1 outline-none text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-medium text-gray-500">User Info</th>
                            <th className="p-4 font-medium text-gray-500">Stats</th>
                            <th className="p-4 font-medium text-gray-500">Tier / Role</th>
                            <th className="p-4 font-medium text-gray-500">Referral</th>
                            <th className="p-4 font-medium text-gray-500">Star Center?</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="5" className="p-4 text-center">Tidak ada user ditemukan.</td></tr>
                        ) : (
                            filteredUsers.map((user) => {
                                const currentTier = getTier(user.total_spent || 0, user.is_star_center);
                                return (
                                    <tr key={user.id} className="hover:bg-gray-50">

                                        <td className="p-4">
                                            <p className="font-bold text-gray-800">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                            <p className="text-xs text-gray-400 font-mono mt-1">{user.id}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs">
                                                <p className="text-gray-500">Total Belanja:</p>
                                                <p className="font-bold text-gray-800">{formatRupiah(user.total_spent || 0)}</p>
                                                <p className="text-gray-500 mt-1">Wallet:</p>
                                                <p className="font-bold text-green-600">{formatRupiah(user.wallet_balance || 0)}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentTier.bg} ${currentTier.color}`}>
                                                {currentTier.name}
                                            </span>
                                            <div className="mt-2 text-xs text-gray-500 capitalize">{user.role}</div>
                                        </td>
                                        <td className="p-4 font-mono text-xs">
                                            <div className="bg-gray-100 px-2 py-1 rounded w-fit">
                                                {user.referral_code || '-'}
                                            </div>
                                            {user.referred_by_code && (
                                                <div className="text-gray-400 mt-1">
                                                    Upline: {user.referred_by_code}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => toggleStarCenter(user)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${user.is_star_center
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                    : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {user.is_star_center ? <ShieldCheck size={16} /> : <Shield size={16} />}
                                                <span className="text-xs font-bold">
                                                    {user.is_star_center ? 'Center Aktif' : 'User Biasa'}
                                                </span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
