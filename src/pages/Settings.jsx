import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { updatePassword, updateProfile, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'; // Added signOut handled by AuthContext
import { doc, updateDoc } from 'firebase/firestore';
import { Save, Lock, User, Phone, Mail, Camera, AlertCircle, ArrowLeft, LogOut, X, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
    const { userData, currentUser, logout } = useAuth();
    const navigate = useNavigate();

    // States for Profile Form
    const [profileData, setProfileData] = useState({
        name: '',
        phone: '',
        email: '',
        photo_url: ''
    });

    // States for Password Modal
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    // States for Logout Modal
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Loading & Status
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [modalStatus, setModalStatus] = useState({ type: '', msg: '' });

    useEffect(() => {
        if (userData) {
            setProfileData(prev => ({
                ...prev,
                name: userData.name || '',
                phone: userData.phone || '',
                email: currentUser?.email || userData.email || '',
                photo_url: userData.photo_url || ''
            }));
        }
    }, [userData, currentUser]);

    // Handle Profile Inputs
    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    // Handle Password Inputs
    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    // 1. Save Profile Data Only
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', msg: '' });

        const user = auth.currentUser;
        if (!user) return;

        try {
            // Update Firestore
            const updates = {
                name: profileData.name,
                phone: profileData.phone,
                photo_url: profileData.photo_url
            };
            await updateDoc(doc(db, "users", user.uid), updates);

            // Update Auth Profile
            await updateProfile(user, {
                displayName: profileData.name,
                photoURL: profileData.photo_url
            });

            setStatus({ type: 'success', msg: 'Data profil berhasil disimpan!' });
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', msg: 'Gagal menyimpan profil.' });
        } finally {
            setLoading(false);
        }
    };

    // 2. Change Password Logic
    const submitPasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setModalStatus({ type: '', msg: '' });

        const user = auth.currentUser;

        if (passwordData.new_password !== passwordData.confirm_password) {
            setModalStatus({ type: 'error', msg: 'Konfirmasi password tidak cocok.' });
            setLoading(false);
            return;
        }

        try {
            // Re-authenticate
            const credential = EmailAuthProvider.credential(user.email, passwordData.current_password);
            await reauthenticateWithCredential(user, credential);

            // Update Password
            await updatePassword(user, passwordData.new_password);

            setModalStatus({ type: 'success', msg: 'Password berhasil diubah!' });

            // Reset and Close
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            setTimeout(() => {
                setShowPasswordModal(false);
                setModalStatus({ type: '', msg: '' });
            }, 1500);

        } catch (error) {
            console.error(error);
            if (error.code === 'auth/wrong-password') {
                setModalStatus({ type: 'error', msg: 'Password saat ini salah.' });
            } else if (error.code === 'auth/requires-recent-login') {
                setModalStatus({ type: 'error', msg: 'Sesi habis. Login ulang diperlukan.' });
            } else if (error.code === 'auth/weak-password') {
                setModalStatus({ type: 'error', msg: 'Password terlalu lemah (min. 6 karakter).' });
            } else {
                setModalStatus({ type: 'error', msg: 'Gagal mengubah password.' });
            }
        } finally {
            setLoading(false);
        }
    };

    // 3. Logout Logic
    const confirmLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to logout", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 relative">
            {/* Header */}
            <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-gray-800">Pengaturan Akun</h1>
            </div>

            <div className="p-4 max-w-lg mx-auto space-y-6">

                {status.msg && (
                    <div className={`p-4 rounded-xl text-sm flex items-center gap-2 shadow-sm ${status.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                        <AlertCircle size={18} /> {status.msg}
                    </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

                    {/* Photo URL */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Foto Profil</label>
                        <div className="flex flex-col items-center gap-4 mb-4">
                            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                                {profileData.photo_url ? (
                                    <img src={profileData.photo_url} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-gray-300" />
                                )}
                            </div>
                            <div className="relative w-full">
                                <Camera size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="url"
                                    name="photo_url"
                                    value={profileData.photo_url}
                                    onChange={handleProfileChange}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gold-500 outline-none text-sm transition-all"
                                    placeholder="Tempel URL foto disini..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Nama Lengkap</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={profileData.name}
                                    onChange={handleProfileChange}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gold-500 outline-none text-sm font-medium"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Nomor Telepon</label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    value={profileData.phone}
                                    onChange={handleProfileChange}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gold-500 outline-none text-sm font-medium"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={profileData.email}
                                    disabled
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 outline-none text-sm cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-star-dark text-white font-bold py-3.5 rounded-xl hover:bg-black transition shadow-lg hover:shadow-xl disabled:opacity-70 flex items-center justify-center gap-2 transform active:scale-[0.98]"
                        >
                            {loading ? 'Menyimpan...' : <><Save size={18} /> Simpan Data</>}
                        </button>
                    </div>
                </form>

                {/* Change Password Button */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 p-2 rounded-full text-yellow-700">
                            <Lock size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800">Password & Keamanan</p>
                            <p className="text-xs text-gray-500">Ubah password akun anda</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-lg transition"
                    >
                        Ubah Password
                    </button>
                </div>

                {/* Logout Button Zone */}
                <div className="pt-4 border-t border-gray-200">
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full py-3.5 text-red-600 font-bold bg-red-50 rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} /> Keluar dari Akun
                    </button>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* 1. Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h3 className="font-bold text-lg flex items-center gap-2"><Key size={18} /> Ubah Password</h3>
                            <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                        </div>

                        <form onSubmit={submitPasswordChange} className="p-6 space-y-4">
                            {modalStatus.msg && (
                                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${modalStatus.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                    <AlertCircle size={16} /> {modalStatus.msg}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Password Saat Ini</label>
                                <input
                                    type="password"
                                    name="current_password"
                                    required
                                    value={passwordData.current_password}
                                    onChange={handlePasswordChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-gold-500 outline-none text-sm bg-gray-50 focus:bg-white transition"
                                    placeholder="Masukkan password lama"
                                />
                            </div>

                            <div className="pt-2">
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Password Baru</label>
                                <input
                                    type="password"
                                    name="new_password"
                                    required
                                    value={passwordData.new_password}
                                    onChange={handlePasswordChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-gold-500 outline-none text-sm bg-gray-50 focus:bg-white transition"
                                    placeholder="Minimal 6 karakter"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Konfirmasi Password</label>
                                <input
                                    type="password"
                                    name="confirm_password"
                                    required
                                    value={passwordData.confirm_password}
                                    onChange={handlePasswordChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-gold-500 outline-none text-sm bg-gray-50 focus:bg-white transition"
                                    placeholder="Ulangi password baru"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-star-dark text-white font-bold py-3 rounded-xl hover:bg-black transition shadow-lg flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? 'Memproses...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LogOut size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Konfirmasi Keluar</h3>
                            <p className="text-gray-500 text-sm">Apakah Anda yakin ingin keluar dari akun Anda?</p>
                        </div>
                        <div className="flex border-t border-gray-100">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 py-4 text-gray-600 font-bold hover:bg-gray-50 transition border-r border-gray-100"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="flex-1 py-4 text-red-600 font-bold hover:bg-red-50 transition"
                            >
                                Ya, Keluar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

