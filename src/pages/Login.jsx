import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous error
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check Role
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists() && docSnap.data().role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError('Gagal login. Periksa email dan password.');
        }
    };

    return (
        <div className="p-6 flex flex-col justify-center min-h-[80vh]">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-star-dark mb-2">Welcome Back</h1>
                <p className="text-gray-500">Masuk untuk melanjutkan belanja</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition"
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                        type="password"
                        className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    className="w-full h-12 bg-star-dark text-white rounded-xl font-bold hover:bg-black transition shadow-lg mt-4"
                >
                    Masuk
                </button>
            </form>



            <p className="text-center mt-6 text-gray-500 text-sm">
                Belum punya akun? <Link to="/register" className="text-gold-600 font-bold hover:underline">Daftar</Link>
            </p>
        </div>
    );
}
