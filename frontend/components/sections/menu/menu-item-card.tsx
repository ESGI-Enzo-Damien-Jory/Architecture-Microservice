import React from 'react';
import {Clock, Star} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import type {MenuItem} from '@/types';

interface MenuItemCardProps {
    item: MenuItem;
    index: number;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({item, index}) => (
    <Card
        className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 group hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/10"
        style={{animationDelay: `${index * 100}ms`}}
    >
        <CardContent className="p-8 text-center">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                {item.image}
            </div>

            <h3 className="text-xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors duration-300">
                {item.name}
            </h3>

            <div className="flex items-center justify-center space-x-1 mb-4">
                <Star className="w-4 h-4 text-amber-400 fill-current"/>
                <span className="text-amber-400 font-semibold">{item.rating}</span>
            </div>

            <div
                className="flex items-center justify-center space-x-2 text-white/60 mb-6 group-hover:text-white/80 transition-colors duration-300">
                <Clock className="w-4 h-4"/>
                <span className="text-sm">{item.time}</span>
            </div>

            <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-emerald-400 group-hover:scale-105 transition-transform duration-300">
          {item.price}
        </span>
                <Button
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                    Ajouter
                </Button>
            </div>
        </CardContent>
    </Card>
);