import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, query, where, deleteDoc } from 'firebase/firestore';
import { formatRupiah } from '../../lib/currency';
import { getTier } from '../../lib/tiers';
import { Search, Shield, ShieldCheck, MapPin, X, User, DollarSign, Users, Trash2, Edit2, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal & Selection State
    const [selectedUser, setSelectedUser] = useState(null);
    const [upline, setUpline] = useState(null);
    const [downlines, setDownlines] = useState([]);
    const [loadingNetwork, setLoadingNetwork] = useState(false);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    // Confirmation Modal State
    const [confirmation, setConfirmation] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'info' // info | danger
    });

    const { addToast } = useToast();

    const fetchUsers = async () => {
        try {
            const snap = await getDocs(collection(db, "users"));
            const usersList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setUsers(usersList);
        } catch (err) {
            console.error(err);
            addToast("Gagal mengambil data user.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Fetch Network Data (Upline & Downline)
    useEffect(() => {
        if (!selectedUser) return;

        const fetchNetwork = async () => {
            setLoadingNetwork(true);
            setUpline(null);
            setDownlines([]);

            try {
                // 1. Fetch Upline
                if (selectedUser.referred_by_code) {
                    const uplineQuery = query(collection(db, "users"), where("referral_code", "==", selectedUser.referred_by_code));
                    const uplineSnap = await getDocs(uplineQuery);
                    if (!uplineSnap.empty) {
                        setUpline({ id: uplineSnap.docs[0].id, ...uplineSnap.docs[0].data() });
                    }
                }

                // 2. Fetch Downlines
                if (selectedUser.referral_code) {
                    const downlineQuery = query(collection(db, "users"), where("referred_by_code", "==", selectedUser.referral_code));
                    const downlineSnap = await getDocs(downlineQuery);
                    setDownlines(downlineSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                }
            } catch (error) {
                console.error("Error fetching network:", error);
            } finally {
                setLoadingNetwork(false);
            }
        };

        fetchNetwork();
        // Reset edit form when user changes
        setEditForm({
            name: selectedUser.name || '',
            email: selectedUser.email || '',
            phone: selectedUser.phone || '',
            role: selectedUser.role || 'user',
            wallet_balance: selectedUser.wallet_balance || 0,
            is_star_center: selectedUser.is_star_center || false,
            dob: selectedUser.dob || '',
            referred_by_code: selectedUser.referred_by_code || ''
        });
        setIsEditing(false);

    }, [selectedUser]);


    const toggleStarCenter = (user, e) => {
        e?.stopPropagation(); // Prevent row click
        const newValue = !user.is_star_center;

        setConfirmation({
            isOpen: true,
            title: newValue ? 'Aktifkan Star Center' : 'Non-aktifkan Star Center',
            message: `Apakah Anda yakin ingin mengubah status ${user.name} menjadi ${newValue ? 'Star Center (AKTIF)' : 'User Biasa'}?`,
            type: 'info',
            onConfirm: async () => {
                try {
                    await updateDoc(doc(db, "users", user.id), {
                        is_star_center: newValue
                    });
                    // Update local state
                    setUsers(users.map(u => u.id === user.id ? { ...u, is_star_center: newValue } : u));
                    if (selectedUser?.id === user.id) {
                        setSelectedUser(prev => ({ ...prev, is_star_center: newValue }));
                    }
                    addToast(`Status user berhasil diubah menjadi ${newValue ? 'Center Active' : 'User Biasa'}`, 'success');
                } catch (err) {
                    addToast("Gagal update user: " + err.message, 'error');
                }
                setConfirmation(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleSaveEdit = async () => {
        try {
            await updateDoc(doc(db, "users", selectedUser.id), {
                ...editForm,
                wallet_balance: Number(editForm.wallet_balance)
            });

            // Update local state
            const updatedUser = { ...selectedUser, ...editForm, wallet_balance: Number(editForm.wallet_balance) };
            setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
            setSelectedUser(updatedUser);
            setIsEditing(false);
            addToast("Data user berhasil diperbarui!", "success");
        } catch (error) {
            console.error(error);
            addToast("Gagal menyimpan data: " + error.message, "error");
        }
    };

    const handleDeleteUser = () => {
        setConfirmation({
            isOpen: true,
            title: 'Hapus User Permanen',
            message: `PERINGATAN: Anda akan menghapus user ${selectedUser.name} secara permanen. Data yang dihapus tidak dapat dikembalikan. Lanjutkan?`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteDoc(doc(db, "users", selectedUser.id));
                    setUsers(users.filter(u => u.id !== selectedUser.id));
                    setSelectedUser(null);
                    addToast("User telah dihapus permanen.", "success");
                } catch (error) {
                    console.error(error);
                    addToast("Gagal menghapus user: " + error.message, "error");
                }
                setConfirmation(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const performConfirm = async () => {
        if (confirmation.onConfirm) {
            await confirmation.onConfirm();
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.referral_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 relative">
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
                                    <tr
                                        key={user.id}
                                        onClick={() => setSelectedUser(user)}
                                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                                    >

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
                                        <td className="p-4 flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedUser(user);
                                                }}
                                                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors border border-gray-200"
                                                title="Lihat Detail"
                                            >
                                                <User size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleStarCenter(user, e);
                                                }}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all relative z-10 ${user.is_star_center
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

            {/* CUSTOM CONFIRMATION MODAL */}
            {confirmation.isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                    ></div>

                    {/* Modal Content */}
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className={`p-6 text-center ${confirmation.type === 'danger' ? 'bg-red-50' : 'bg-white'}`}>
                            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${confirmation.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmation.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{confirmation.message}</p>
                        </div>
                        <div className="p-4 bg-gray-50 flex gap-3">
                            <button
                                onClick={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                                className="flex-1 py-2.5 px-4 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={performConfirm}
                                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-white shadow-md transition-transform active:scale-95 ${confirmation.type === 'danger'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                Ya, Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* USER DETAIL MODAL */}
            {selectedUser && (
                <div className="fixed inset-0 z-[999] flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedUser(null)}
                    />

                    {/* Slide-over Panel */}
                    <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">

                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    {isEditing ? 'Edit User' : selectedUser.name}
                                    {!isEditing && (
                                        <span className={`text-xs px-2 py-1 rounded-full ${selectedUser.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {selectedUser.role}
                                        </span>
                                    )}
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">UID: {selectedUser.id}</p>
                            </div>
                            <div className="flex gap-2">
                                {!isEditing ? (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            title="Edit Data"
                                        >
                                            <Edit2 size={20} />
                                        </button>
                                        <button
                                            onClick={handleDeleteUser}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                            title="Hapus Akun"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleSaveEdit}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                            title="Simpan"
                                        >
                                            <Save size={20} />
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition"
                                            title="Batal"
                                        >
                                            <X size={20} />
                                        </button>
                                    </>
                                )}
                                <button onClick={() => setSelectedUser(null)} className="p-2 text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Content Scrollable Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* 1. PERSONAL DATA */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <User size={16} /> Data Diri
                                </h3>
                                {isEditing ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500">Nama Lengkap</label>
                                            <input
                                                className="w-full border p-2 rounded-lg"
                                                value={editForm.name}
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500">Email</label>
                                            <input
                                                className="w-full border p-2 rounded-lg bg-gray-100"
                                                value={editForm.email}
                                                disabled // Email usually hard to change in Firebase auth without reverification
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500">No. Telepon</label>
                                            <input
                                                className="w-full border p-2 rounded-lg"
                                                value={editForm.phone}
                                                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500">Role</label>
                                            <select
                                                className="w-full border p-2 rounded-lg"
                                                value={editForm.role}
                                                onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500">Tanggal Lahir</label>
                                            <input
                                                type="date"
                                                className="w-full border p-2 rounded-lg"
                                                value={editForm.dob}
                                                onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="font-medium">{selectedUser.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Telepon</p>
                                            <p className="font-medium">{selectedUser.phone || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Bergabung</p>
                                            <p className="font-medium detail-date">
                                                {selectedUser.created_at?.seconds ? new Date(selectedUser.created_at.seconds * 1000).toLocaleDateString('id-ID') : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Tanggal Lahir</p>
                                            <p className="font-medium">
                                                {selectedUser.dob ? new Date(selectedUser.dob).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Status</p>
                                            <p className="font-medium">{selectedUser.is_star_center ? 'Star Center' : 'User Biasa'}</p>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <hr />

                            {/* 2. FINANCIAL STATS */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <DollarSign size={16} /> Keuangan & Tier
                                </h3>
                                {isEditing ? (
                                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-4">
                                        <label className="text-xs font-bold text-gray-500">Wallet Balance (Rp)</label>
                                        <input
                                            type="number"
                                            className="w-full border p-2 rounded-lg mt-1"
                                            value={editForm.wallet_balance}
                                            onChange={e => setEditForm({ ...editForm, wallet_balance: e.target.value })}
                                        />
                                        <p className="text-xs text-yellow-700 mt-2">⚠️ Hati-hati mengubah saldo user secara manual.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white border rounded-xl p-4 text-center">
                                            <p className="text-xs text-gray-500 mb-1">Total Belanja</p>
                                            <p className="font-bold text-lg text-gray-800">{formatRupiah(selectedUser.total_spent || 0)}</p>
                                        </div>
                                        <div className="bg-white border rounded-xl p-4 text-center">
                                            <p className="text-xs text-gray-500 mb-1">Wallet</p>
                                            <p className="font-bold text-lg text-green-600">{formatRupiah(selectedUser.wallet_balance || 0)}</p>
                                        </div>
                                        <div className="bg-white border rounded-xl p-4 text-center">
                                            <p className="text-xs text-gray-500 mb-1">Current Tier</p>
                                            <div className="flex justify-center">
                                                {(() => {
                                                    const t = getTier(selectedUser.total_spent || 0, selectedUser.is_star_center);
                                                    return <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.bg} ${t.color}`}>{t.name}</span>;
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <hr />

                            {/* 3. NETWORK / JARINGAN */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Users size={16} /> Jaringan Referral
                                </h3>

                                <div className="space-y-6">
                                    {/* UPLINE */}
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 mb-2">UPLINE (Yang Mengajak)</p>

                                        {isEditing ? (
                                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                                                <label className="text-xs font-bold text-gray-500">Kode Referral Upline</label>
                                                <input
                                                    type="text"
                                                    className="w-full border p-2 rounded-lg mt-1 bg-white"
                                                    placeholder="Masukkan Kode Referral Upline"
                                                    value={editForm.referred_by_code}
                                                    onChange={e => setEditForm({ ...editForm, referred_by_code: e.target.value })}
                                                />
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Kosongkan jika tidak ada upline (Organic). Pastikan kode valid.
                                                </p>
                                            </div>
                                        ) : loadingNetwork ? (
                                            <div className="text-sm text-gray-400 animate-pulse">Checking upline...</div>
                                        ) : upline ? (
                                            <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-100 transition" onClick={() => setSelectedUser(upline)}>
                                                <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold">
                                                    {upline.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{upline.name}</p>
                                                    <p className="text-xs text-gray-500">{upline.email} (Code: {upline.referral_code})</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-lg">
                                                User ini tidak mendaftar lewat referral siapapun (Organic / Admin).
                                                <br />
                                                <span className="text-xs">Referred By Code: {selectedUser.referred_by_code || 'None'}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* DOWNLINE */}
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <p className="text-xs font-bold text-gray-500">DOWNLINE (Yang Diajak)</p>
                                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{downlines.length} Orang</span>
                                        </div>

                                        {loadingNetwork ? (
                                            <div className="text-sm text-gray-400 animate-pulse">Loading downlines...</div>
                                        ) : downlines.length > 0 ? (
                                            <div className="border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-gray-50 text-gray-500 text-xs">
                                                        <tr>
                                                            <th className="p-3">Nama</th>
                                                            <th className="p-3">Total Belanja</th>
                                                            <th className="p-3">Tanggal Join</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {downlines.map(dl => (
                                                            <tr key={dl.id} onClick={() => setSelectedUser(dl)} className="hover:bg-gray-50 cursor-pointer">
                                                                <td className="p-3 font-medium">{dl.name}</td>
                                                                <td className="p-3 text-green-600">{formatRupiah(dl.total_spent || 0)}</td>
                                                                <td className="p-3 text-gray-500 text-xs">
                                                                    {dl.created_at?.seconds ? new Date(dl.created_at.seconds * 1000).toLocaleDateString() : '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-400 italic bg-gray-50 p-8 text-center rounded-lg border border-dashed">
                                                Belum memiliki downline.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
