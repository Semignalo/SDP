import { Home, ShoppingBag, ShoppingCart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";

export default function BottomNav() {
    const location = useLocation();
    const path = location.pathname;

    const navItems = [
        { name: "Home", icon: Home, path: "/" },
        { name: "Katalog", icon: ShoppingBag, path: "/catalog" },
        { name: "Cart", icon: ShoppingCart, path: "/cart" }, // You might want a badge here later
        { name: "Profile", icon: User, path: "/profile" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="w-full max-w-md bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pointer-events-auto pb-safe">
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = path === item.path;

                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200",
                                    isActive ? "text-gold-500" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Icon
                                    size={24}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={cn("transition-transform duration-200", isActive && "scale-110")}
                                />
                                <span className="text-[10px] font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
