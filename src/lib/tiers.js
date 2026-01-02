export const TIERS = [
    {
        level: 1,
        name: 'Starter',
        minSpent: 0,
        discount: 0.10,
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        gradient: 'from-gray-700 to-gray-900',
        textColor: 'text-white',
        benefits: [
            'Diskon Produk 10%'
        ]
    },
    {
        level: 2,
        name: 'Bronze',
        minSpent: 2000000,
        discount: 0.15,
        color: 'text-orange-700',
        bg: 'bg-orange-100',
        gradient: 'from-amber-700 to-orange-900',
        textColor: 'text-amber-100',
        benefits: [
            'Diskon Produk 15%'
        ]
    },
    {
        level: 3,
        name: 'Silver',
        minSpent: 10000000,
        discount: 0.20,
        color: 'text-gray-700',
        bg: 'bg-gray-200',
        gradient: 'from-slate-400 to-slate-600',
        textColor: 'text-white',
        benefits: [
            'Diskon Produk 20%'
        ]
    },
    {
        level: 4,
        name: 'Gold',
        minSpent: 20000000,
        discount: 0.25,
        color: 'text-yellow-700',
        bg: 'bg-yellow-100',
        gradient: 'from-yellow-400 to-yellow-600',
        textColor: 'text-yellow-900',
        benefits: [
            'Diskon Produk 25%'
        ]
    },
    {
        level: 5,
        name: 'Diamond',
        minSpent: 50000000,
        discount: 0.30,
        color: 'text-cyan-700',
        bg: 'bg-cyan-100',
        gradient: 'from-cyan-500 to-blue-600',
        textColor: 'text-white',
        benefits: [
            'Diskon Produk 30%'
        ]
    },
];

export const getTier = (totalSpent = 0, isStarCenter = false) => {
    let effectiveSpent = totalSpent;

    // If user is a Star Center, they get at least Gold tier benefits
    if (isStarCenter) {
        const goldTier = TIERS.find(t => t.name === 'Gold');
        if (goldTier && totalSpent < goldTier.minSpent) {
            effectiveSpent = goldTier.minSpent;
        }
    }

    // Find the highest tier that meets the effectiveSpent requirement
    return TIERS.slice().reverse().find(t => effectiveSpent >= t.minSpent) || TIERS[0];
};


export const getNextTier = (currentLevel) => {
    return TIERS.find(t => t.level === currentLevel + 1) || null;
};

export const calculateDiscountedPrice = (price, tierOrLevel) => {
    let tier;
    if (typeof tierOrLevel === 'number') {
        tier = TIERS.find(t => t.level === tierOrLevel) || TIERS[0];
    } else if (typeof tierOrLevel === 'object' && tierOrLevel !== null) {
        tier = tierOrLevel;
    } else {
        tier = TIERS[0];
    }

    const discountAmount = price * tier.discount;
    const discountedPrice = price - discountAmount;

    return {
        discountedPrice,
        discountAmount,
        discountPercentage: tier.discount * 100
    };
};
