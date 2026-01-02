import React from 'react';
import { cn } from '../../lib/utils';

export default function MobileContainer({ children, className }) {
    return (
        <div className="min-h-screen w-full bg-gray-100 flex justify-center">
            <div className={cn(
                "w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col",
                className
            )}>
                {children}
            </div>
        </div>
    );
}
