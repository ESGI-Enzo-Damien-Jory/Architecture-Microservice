import React from 'react';
import {ArrowRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {MenuItemCard} from './menu-item-card';
import {MENU_ITEMS} from '@/constants';

export const MenuSection: React.FC = () => (
    <section id="menu" className="py-20 px-6 relative">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-5xl font-bold text-white mb-6 transition-all duration-500 hover:text-emerald-400">
                    Notre <span className="text-emerald-400">Sélection</span>
                </h2>
                <p className="text-xl text-white/70 max-w-2xl mx-auto transition-colors duration-300 hover:text-white/90">
                    Des créations culinaires d&apos;exception, pensées pour vous surprendre
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {MENU_ITEMS.map((item, index) => (
                    <MenuItemCard key={item.name} item={item} index={index}/>
                ))}
            </div>

            <div className="text-center mt-16">
                <Button
                    size="lg"
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-12 py-4 text-lg rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl backdrop-blur-sm group"
                >
                    Voir la carte complète
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1"/>
                </Button>
            </div>
        </div>
    </section>
);