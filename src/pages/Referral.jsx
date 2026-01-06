import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Copy, Users, Wallet, Link as LinkIcon, Share2 } from 'lucide-react';
import { formatRupiah } from '../lib/currency';

export default function Referral() {
    const { userData } = useAuth();
    const [downlines, setDownlines] = useState([]);
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!userData?.referral_code || !userData?.uid) return;

            try {
                // 1. Find users who registered using my code
                const qDownlines = query(
                    collection(db, "users"),
                    where("referred_by_code", "==", userData.referral_code)
                );
                const downlineSnap = await getDocs(qDownlines);
                setDownlines(downlineSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // 2. Find commission history
                // Remove orderBy to avoid index issues for now, sort client-side.
                const qCommissions = query(
                    collection(db, "commissions"),
                    where("upline_id", "==", userData.uid)
                );
                const commissionSnap = await getDocs(qCommissions);
                const comms = commissionSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Sort by created_at desc
                comms.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));

                setCommissions(comms);

            } catch (error) {
                console.error("Error fetching referral data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (userData) {
            fetchData();
        }
    }, [userData]);

    const copyToClipboard = () => {
        if (userData?.referral_code) {
            navigator.clipboard.writeText(userData.referral_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const copyLink = () => {
        if (userData?.referral_code) {
            const link = `${window.location.origin}/register?ref=${userData.referral_code}`;
            navigator.clipboard.writeText(link);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        }
    };

    return (
        <div className="p-4 space-y-6 pb-24">
            <h1 className="text-2xl font-bold">Referral Program</h1>

            {/* Wallet Card */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                    <Wallet className="text-gold-500" />
                    <span className="font-medium text-gray-300">Komisi Saat Ini</span>
                </div>
                <h2 className="text-3xl font-bold text-gold-500">{formatRupiah(userData?.wallet_balance || 0)}</h2>
                <p className="text-xs text-gray-400 mt-2">Dapatkan 5% dari setiap belanja temanmu.</p>
            </div>

            {/* Code Card */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
                <p className="text-sm text-gray-500 mb-2">Kode Referral Kamu</p>
                <div
                    onClick={copyToClipboard}
                    className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer active:bg-gray-100 transition"
                >
                    <span className="text-2xl font-bold tracking-widest text-star-dark">
                        {userData?.referral_code || 'LOADING...'}
                    </span>
                    <Copy size={18} className={copied ? "text-green-500" : "text-gray-400"} />
                </div>
                <p className="text-xs text-green-600 mt-2 min-h-[16px]">
                    {copied ? "Berhasil disalin!" : "Ketuk untuk menyalin"}
                </p>
            </div>

            {/* Share Link Card */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
                <p className="text-sm text-gray-500 mb-2">Atau Bagikan Link Pendaftaran</p>
                <div
                    onClick={copyLink}
                    className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer active:bg-blue-100 transition"
                >
                    <LinkIcon size={18} className="text-blue-600" />
                    <span className="font-medium text-blue-700">
                        Salin Link Referral
                    </span>
                    {linkCopied && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full ml-2">Tersalin!</span>}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    Orang yang mendaftar lewat link ini otomatis menjadi downline Anda.
                </p>
            </div>

            {/* Downline List */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Users size={20} className="text-gray-700" />
                    <h3 className="font-bold text-lg">Teman Diajak ({downlines.length})</h3>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {downlines.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                                Belum ada teman yang menggunakan kodemu.
                            </div>
                        ) : (
                            downlines.map(user => (
                                <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-star-dark">{user.name}</p>
                                        <p className="text-xs text-gray-500">Gabung: {user.created_at?.toDate().toLocaleDateString('id-ID') || 'Baru saja'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">Total Belanja</p>
                                        <p className="font-medium text-gold-600">{formatRupiah(user.total_spent || 0)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Commission History */}
            <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                    <Wallet size={20} className="text-gray-700" />
                    <h3 className="font-bold text-lg">Riwayat Komisi</h3>
                </div>

                {commissions.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                        Belum ada riwayat komisi.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {commissions.map((comm) => (
                            <div key={comm.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800">Komisi dari {comm.from_user}</p>
                                    <p className="text-xs text-gray-400">
                                        {comm.created_at?.toDate().toLocaleDateString('id-ID', {
                                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <span className="font-bold text-green-600">+{formatRupiah(comm.amount)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
