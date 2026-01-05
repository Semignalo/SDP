import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, increment, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function TestTools() {
    const { userData } = useAuth();
    const [status, setStatus] = useState('');

    const dummyProducts = [
        // 1. Dream Kissed (DK)
        {
            name: "Dream Kissed - 1 Jar (240gr)",
            description: `**Brightening Skin Nutrition Body Cream Dream Kissed Ultimate STARINC**

Dream Kissed adalah "Sleeping Mask" untuk tubuh Anda. Diformulasikan khusus sebagai krim malam dengan tekstur buttery yang kaya nutrisi. Mengandung Aqua Phytoplex 4-in-1 Essential Oil dan Niacinamide konsentrasi tinggi (5%) yang bekerja maksimal saat tubuh beristirahat. Fokus utamanya adalah regenerasi sel kulit mati, perbaikan skin barrier, dan pencerahan mendalam. Sangat efektif untuk memudarkan bekas luka lama yang menghitam.

**Skin Concern:**
Kulit Sangat Kering, Kulit "Badak" (Susah Putih), Bekas Luka (Scars), Stretch Marks, Kulit Kusam.

**Key Benefits:**
• Deep Night Repair: Memperbaiki sel kulit rusak saat tidur.
• Intensive Whitening: Mencerahkan kulit lebih cepat dibanding lotion biasa.
• Scar Fading: Memudarkan bekas luka, koreng, dan gigitan nyamuk.
• Moisture Lock: Mengunci kelembaban hingga lapisan terdalam.

**Key Ingredients:**
• Niacinamide (5%)
• Sunflower Seed Oil, Argan Oil, Canola Oil, Meadowfoam Seed Oil
• Vitamin C, K, E

**Cara Pemakaian:**
Oleskan tebal dan merata pada seluruh tubuh (tangan, kaki, leher) setelah mandi sore atau sesaat sebelum tidur. Pijat lembut pada area yang memiliki bekas luka atau stretch mark.

No. BPOM: NA18220110136`,
            base_price: 222500,
            stock: 100,
            category: "Face & Body Serum",
            image_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=300",
            is_active: true
        },
        {
            name: "Dream Kissed - 1 Tube (50gr)",
            description: `**Brightening Skin Nutrition Body Cream Dream Kissed Ultimate STARINC** (Travel Size)

Lihat deskripsi varian Jar untuk detail lengkap. Praktis dibawa kemana saja.

**Key Benefits:**
• Deep Night Repair
• Intensive Whitening
• Scar Fading
• Moisture Lock

No. BPOM: NA18220110136`,
            base_price: 71500,
            stock: 100,
            category: "Face & Body Serum",
            image_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=300",
            is_active: true
        },
        // 2. Snow Kissed (SK)
        {
            name: "Snow Kissed - 1 Tube (50gr)",
            description: `**Instant Tone Up Body Serum Snow Kissed Seduce STARINC**

Snow Kissed adalah Body Serum yang berfungsi sebagai "tameng" kulit di siang hari. Dengan formula Titanium Dioxide, produk ini memberikan perlindungan fisik terhadap sinar UV A dan UV B. Efek Instant Tone Up memberikan tampilan kulit cerah seketika dalam sekali oles tanpa terlihat abu-abu, sekaligus menutrisi kulit dengan kandungan Aqua Phytoplex.

**Skin Concern:**
Kulit Belang, Sering Terpapar Matahari, Kusam, Warna Kulit Tidak Merata.

**Key Benefits:**
• Instant Brightening: Kulit terlihat setingkat lebih cerah seketika.
• UV Protection: Melindungi dari bahaya sinar matahari.
• Non-Sticky: Cepat meresap dan tidak lengket saat berkeringat.
• Healthy Glow: Memberikan efek kulit sehat berkilau.

**Key Ingredients:**
• Titanium Dioxide (Physical Sunscreen)
• Niacinamide
• Aqua Phytoplex Oils

**Cara Pemakaian:**
Gunakan setiap pagi setelah mandi sebelum beraktivitas.

No. BPOM: NA18220110135`,
            base_price: 60500,
            stock: 100,
            category: "Face & Body Serum",
            image_url: "https://images.unsplash.com/photo-1620917670397-a63ddb71a10d?auto=format&fit=crop&q=80&w=300",
            is_active: true
        },
        {
            name: "Snow Kissed - 1 Botol (230gr)",
            description: `**Instant Tone Up Body Serum Snow Kissed Seduce STARINC** (Big Size)

Lihat deskripsi varian Tube untuk detail lengkap. Kemasan botol pump lebih hemat.

**Key Benefits:**
• Instant Brightening
• UV Protection
• Non-Sticky
• Healthy Glow

No. BPOM: NA18220110135`,
            base_price: 200500,
            stock: 50,
            category: "Face & Body Serum",
            image_url: "https://images.unsplash.com/photo-1620917670397-a63ddb71a10d?auto=format&fit=crop&q=80&w=300",
            is_active: true
        },
        // 3. Confidence Burst (CB)
        {
            name: "Confidence Burst",
            description: `**Deodorizer Serum Spray STARINC**

Confidence Burst bukan sekadar deodoran, melainkan serum perawatan untuk lipatan tubuh. Diformulasikan dengan teknologi Micro-Spray yang partikelnya sangat halus. Mampu membunuh bakteri penyebab bau badan hingga 72 jam sekaligus mencerahkan area lipatan yang gelap.

**Skin Concern:**
Bau Badan, Ketiak Hitam, Chicken Skin.

**Key Benefits:**
• 72H Odor Protection: Bebas bau badan berhari-hari.
• Whitening Folds: Mencerahkan ketiak dan lipatan paha.
• Smoothens Skin: Menghaluskan tekstur kulit pasca cukur.
• Non-Stain: Tidak meninggalkan noda kuning di baju.

**Key Ingredients:**
• Niacinamide, Glutathione, Aloe Vera, Castor Oil, Allantoin.

**Cara Pemakaian:**
Semprotkan 2-3 pump pada ketiak kering setelah mandi.

No. BPOM: NA18220900302`,
            base_price: 162500,
            stock: 50,
            category: "Face & Body Serum",
            image_url: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=300",
            is_active: true
        },
        // 4. C-Star
        {
            name: "C-Star",
            description: `**Brightening Stick Balm with 26% Vitamin C STARINC**

Inovasi serum vitamin C dalam bentuk Stick Balm. Mengandung konsentrasi Vitamin C sangat tinggi (26%) yang stabil. Praktis digunakan kapan saja untuk memberikan efek Instant Glowing ala Korea.

**Skin Concern:**
Wajah Kusam, Flek Hitam, Garis Halus, Make-up susah nempel.

**Key Benefits:**
• High Potency Vit C: Mencerahkan wajah kusam dengan cepat.
• Spot Eraser: Membantu memudarkan flek menahun.
• Make-up Gripping: Membuat foundation/bedak lebih awet.
• Travel Friendly.

**Key Ingredients:**
• Vitamin C 26% (Ascorbic Acid), Oil-Soluble Licorice Extract, Bisabolol.

**Cara Pemakaian:**
Oleskan stick pada wajah yang bersih.

No. BPOM: NA18231900060`,
            base_price: 325500,
            stock: 40,
            category: "Face & Body Serum",
            image_url: "https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?auto=format&fit=crop&q=80&w=300",
            is_active: true
        },
        // 5. Collastar
        {
            name: "Collastar - 5 Sachet (75gr)",
            description: `**Collagen Infusion Drink STARINC**

Minuman serbuk kolagen premium dengan formulasi Tripeptide Collagen dari ikan (3x lebih cepat serap). Dilengkapi dengan L-Glutathione untuk antioksidan master.

**Health & Skin Concern:**
Penuaan Dini, Kulit Kendur, Rambut Rontok, Kuku Rapuh.

**Key Benefits:**
• Skin Elasticity: Mengembalikan kekenyalan kulit.
• Full Body Brightening: Mencerahkan kulit seluruh tubuh.
• Anti-Aging & Joint Health.

**Cara Pemakaian:**
Larutkan 1 sachet dengan 150ml air. Minum 1x sehari malam sebelum tidur.

Izin: MD & Halal MUI`,
            base_price: 144500,
            stock: 30,
            category: "Trio Holistic",
            image_url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=300",
            is_active: true
        },
        {
            name: "Collastar - 15 Sachet (225gr)",
            description: `**Collagen Infusion Drink STARINC** (Big Pack)

Izin: MD & Halal MUI`,
            base_price: 367500,
            stock: 20,
            category: "Trio Holistic",
            image_url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=300",
            is_active: true
        },
        // 6. KickFatt
        {
            name: "KickFatt - 5 Sachet (75gr)",
            description: `**Double Action Weight Management Drink**

Minuman serat rasa buah untuk detoks saluran cerna dan memblokir lemak. Melancarkan BAB tanpa mulas berlebih.

**Key Benefits:**
• Fat Blocker: Mengikat lemak makanan.
• Digestion Detox: Membersihkan usus.
• Metabolism Booster.
• Appetite Control.

**Cara Pemakaian:**
Minum sebelum makan siang atau makan malam.

Izin: BPOM MD`,
            base_price: 150500,
            stock: 50,
            category: "Trio Holistic",
            image_url: "https://images.unsplash.com/photo-1511690656952-34342d5c2895?auto=format&fit=crop&q=80&w=300",
            is_active: true
        },
        {
            name: "KickFatt - 15 Sachet (225gr)",
            description: `**Double Action Weight Management Drink** (Big Pack)

Izin: BPOM MD`,
            base_price: 383500,
            stock: 20,
            category: "Trio Holistic",
            image_url: "https://images.unsplash.com/photo-1511690656952-34342d5c2895?auto=format&fit=crop&q=80&w=300",
            is_active: true
        },
        // 7. Convy
        {
            name: "Convy",
            description: `**Curvaceous Slimming Body Balm**

Hot slimming balm topikal untuk membakar lemak di bawah kulit. Efektif untuk shaping dan memudarkan stretch mark.

**Key Benefits:**
• Targeted Fat Burning: Membakar lemak di area spesifik.
• Cellulite Reduction: Menyamarkan selulit.
• Body Shaping & Skin Tightening.

**Key Ingredients:**
• Capsicum Extract, Caffeine, Centella Asiatica.

**Cara Pemakaian:**
Oleskan pada area berlemak (perut/paha) sebelum olahraga.

No. BPOM: NA`,
            base_price: 209000,
            stock: 60,
            category: "Trio Holistic",
            image_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=300",
            is_active: true
        },
        // 8. Prime Herbs
        {
            name: "Prime Herbs (30 Caps)",
            description: `**Premium Herbal Extract for Health & Recovery**

Suplemen herbal konsentrat tinggi (Manggis & Rosella) untuk booster imun dan pemulihan.

**Key Benefits:**
• Immune Booster.
• Hormonal Balance (Wanita).
• Powerful Antioxidant.
• Anti-Inflammation.

**Cara Pemakaian:**
1-2 kapsul per hari untuk pencegahan.

Izin: BPOM TR`,
            base_price: 393500,
            stock: 40,
            category: "Herbal",
            image_url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=300",
            is_active: true,
            is_promo: true
        },
        {
            name: "Prime Herbs (60 Caps)",
            description: `**Premium Herbal Extract for Health & Recovery** (Big Bottle)

Izin: BPOM TR`,
            base_price: 603500,
            stock: 30,
            category: "Herbal",
            image_url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=300",
            is_active: true,
            is_promo: true
        }
    ];

    const seedProducts = async () => {
        setStatus('Seeding products...');
        try {
            const productsRef = collection(db, "products");
            for (const p of dummyProducts) {
                await addDoc(productsRef, p);
            }
            setStatus('Success! 3 Dummy Products added.');
        } catch (e) {
            console.error(e);
            setStatus('Error: ' + e.message);
        }
    };

    const addSpent = async (amount) => {
        if (!auth.currentUser) return setStatus('Not logged in');

        setStatus(`Adding Rp ${amount} to spent...`);
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
            total_spent: increment(amount)
        });
        setStatus(`Added Rp ${amount}. Tier might update on refresh (logic pending).`);
    };

    const resetAccount = async () => {
        if (!auth.currentUser) return setStatus('Not logged in');
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
            total_spent: 0,
            wallet_balance: 0,
            tier_level: 1
        });
        setStatus('Account reset to Starter (Rp 0).');
    };

    const migrateUsersPhone = async () => {
        setStatus('Starting Migration: Adding random phones to active users...');
        try {
            const usersRef = collection(db, "users");
            const snapshot = await getDocs(usersRef);
            let updatedCount = 0;

            for (const userDoc of snapshot.docs) {
                const userData = userDoc.data();
                // Check if phone is missing or empty
                if (!userData.phone || userData.phone.trim() === "") {
                    // Generate Random Phone: 081 + 8 random digits
                    const randomPhone = "081" + Math.floor(10000000 + Math.random() * 90000000).toString();

                    await updateDoc(doc(db, "users", userDoc.id), {
                        phone: randomPhone
                    });
                    updatedCount++;
                }
            }
            setStatus(`Migration Complete! Updated ${updatedCount} users with random phones.`);
        } catch (e) {
            console.error("Migration Failed:", e);
            setStatus('Migration Failed: ' + e.message);
        }
    };

    return (
        <div className="p-6 pb-24 space-y-6">
            <h1 className="text-2xl font-bold text-red-600">⚠️ Developer Test Tools</h1>
            <p className="text-sm text-gray-500">Halaman ini hanya untuk testing. Jangan dipakai di production.</p>

            <div className="bg-white p-4 rounded-xl shadow border border-gray-200 space-y-4">
                <h2 className="font-bold">1. Product Data</h2>
                <button
                    onClick={seedProducts}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium"
                >
                    Inject Dummy Products (Firestore)
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow border border-gray-200 space-y-4">
                <h2 className="font-bold">2. My Account Simulator</h2>
                <p className="text-xs text-gray-400">Current Spent: {userData?.total_spent}</p>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => addSpent(1000000)}
                        className="bg-green-100 text-green-700 py-2 rounded-lg text-xs font-bold"
                    >
                        + 1 Juta
                    </button>
                    <button
                        onClick={() => addSpent(2500000)}
                        className="bg-green-100 text-green-700 py-2 rounded-lg text-xs font-bold"
                    >
                        + 2.5 Juta (Bronze)
                    </button>
                    <button
                        onClick={() => addSpent(10000000)}
                        className="bg-green-100 text-green-700 py-2 rounded-lg text-xs font-bold"
                    >
                        + 10 Juta (Silver)
                    </button>
                    <button
                        onClick={() => addSpent(50000000)}
                        className="bg-green-100 text-green-700 py-2 rounded-lg text-xs font-bold"
                    >
                        + 50 Juta (Diamond)
                    </button>
                </div>

                <button
                    onClick={resetAccount}
                    className="w-full bg-red-100 text-red-700 py-2 rounded-lg text-sm font-medium mt-2"
                >
                    Reset My Stats to 0
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow border border-gray-200 space-y-4">
                <h2 className="font-bold">3. Data Migration</h2>
                <button
                    onClick={migrateUsersPhone}
                    className="w-full bg-purple-100 text-purple-700 py-2 rounded-lg text-sm font-medium"
                >
                    Migrate: Fill Missing Phones (Random)
                </button>
            </div>

            {status && (
                <div className="fixed bottom-20 left-4 right-4 bg-black text-white p-3 rounded-lg text-xs text-center animate-bounce">
                    {status}
                </div>
            )}
        </div>
    );
}
