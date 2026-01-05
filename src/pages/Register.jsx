import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        dob: '',
        password: '',
        referralCode: '', // Upstream/Upline code
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const generateReferralCode = (name) => {
        // Simple logic: First 3 letters of name + random 4 alphanum
        const prefix = name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
        const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}${suffix}`;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Generate own referral code
            const myReferralCode = generateReferralCode(formData.name);

            // 3. Create User Document in Firestore
            // Note: We are not validating the 'upstream' referral code yet (Phase 2)
            // But we save it to the DB as 'referred_by_code' for now.
            // Ideally we should look up the uid of the upline, but for now just storing the code string or null.

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: formData.name,
                email: formData.email,
                role: "user",
                phone: formData.phone,
                dob: formData.dob,
                referral_code: myReferralCode,
                referred_by_code: formData.referralCode || null, // Temporary field until we do lookup
                referred_by_uid: null, // Logic to find uid from code will be added later or via Cloud Function
                tier_level: 1, // Starter
                total_spent: 0,
                wallet_balance: 0,
                is_star_center: false,
                created_at: serverTimestamp(),
            });

            // 4. Redirect
            navigate('/');

        } catch (err) {
            console.error(err);
            setError(err.message || 'Gagal mendaftar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 flex flex-col justify-center min-h-[80vh]">
            <h1 className="text-3xl font-bold text-star-dark mb-2">Buat Akun</h1>
            <p className="text-gray-500 mb-8">Daftar dan dapatkan diskon member</p>

            <form onSubmit={handleRegister} className="space-y-4">
                {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                    <input
                        name="name"
                        type="text"
                        required
                        className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-gold-500 transition"
                        placeholder="Ex: Budi Santoso"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        name="email"
                        type="email"
                        required
                        className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-gold-500 transition"
                        placeholder="nama@email.com"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                    <input
                        name="phone"
                        type="tel"
                        required
                        className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-gold-500 transition"
                        placeholder="08123456789"
                        value={formData.phone}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                    <input
                        name="dob"
                        type="date"
                        required
                        className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-gold-500 transition"
                        value={formData.dob}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                        name="password"
                        type="password"
                        required
                        className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-gold-500 transition"
                        placeholder="Minimal 6 karakter"
                        value={formData.password}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode Referral (Opsional)</label>
                    <input
                        name="referralCode"
                        type="text"
                        className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-gold-500 transition"
                        placeholder="Punya kode teman?"
                        value={formData.referralCode}
                        onChange={handleChange}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gold-500 text-white rounded-xl font-bold mt-4 shadow-lg hover:bg-gold-600 transition disabled:opacity-50"
                >
                    {loading ? 'Memproses...' : 'Daftar Sekarang'}
                </button>
            </form>

            <p className="text-center mt-6 text-gray-500 text-sm">
                Sudah punya akun? <Link to="/login" className="text-gold-600 font-bold hover:underline">Masuk</Link>
            </p>
        </div>
    );
}
