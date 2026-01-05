import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminRoute({ children }) {
    const { currentUser, userData, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-star-dark"></div>
            </div>
        );
    }

    // 1. Must be logged in
    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Must have 'admin' role
    // We check userData?.role
    // You can also add specific email check as a fallback if needed
    if (userData?.role !== 'admin') {
        // Redirect to home if they are logged in but not an admin
        return <Navigate to="/" replace />;
    }

    return children;
}
