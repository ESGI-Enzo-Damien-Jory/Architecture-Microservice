import React from 'react';
import {ChefHat} from 'lucide-react';

interface LogoProps {
    className?: string;
}

export const Logo: React.FC<LogoProps> = ({className = ""}) => (
    <div className={`flex items-center space-x-4 ${className}`}>
        <div
            className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <ChefHat className="w-7 h-7 text-white"/>
        </div>
        <div>
            <div className="text-2xl font-bold text-white tracking-tight">AMS</div>
            <div className="text-xs text-emerald-400 font-medium tracking-widest">ARTISAN MEALS</div>
        </div>
    </div>
);