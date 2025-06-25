import React from 'react';
import {MapPin, Phone} from 'lucide-react';
import {Logo} from '../header/logo';

export const Footer: React.FC = () => (
    <footer className="bg-black/40 backdrop-blur-xl py-16 px-6 border-t border-white/10 relative">
        <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
                <div className="space-y-6">
                    <Logo/>
                    <p className="text-white/70 leading-relaxed transition-colors duration-300 hover:text-white/90">
                        Pionnier de la gastronomie rapide premium, AMS révolutionne votre façon de savourer.
                    </p>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-6">Contact</h4>
                    <ul className="space-y-4 text-white/70">
                        <li className="flex items-center space-x-3 transition-colors duration-300 hover:text-emerald-400">
                            <Phone className="w-4 h-4 text-emerald-400"/>
                            <span>+33 1 23 45 67 89</span>
                        </li>
                        <li className="flex items-center space-x-3 transition-colors duration-300 hover:text-emerald-400">
                            <span className="text-emerald-400">📧</span>
                            <span>contact@ams-restaurant.fr</span>
                        </li>
                        <li className="flex items-start space-x-3 transition-colors duration-300 hover:text-emerald-400">
                            <MapPin className="w-4 h-4 text-emerald-400 mt-1"/>
                            <span>123 Avenue des Champs-Élysées<br/>75008 Paris</span>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-6">Horaires</h4>
                    <ul className="space-y-3 text-white/70">
                        <li className="transition-colors duration-300 hover:text-white">
                            Lundi - Jeudi: 11h30 - 22h30
                        </li>
                        <li className="transition-colors duration-300 hover:text-white">
                            Vendredi - Samedi: 11h30 - 23h30
                        </li>
                        <li className="transition-colors duration-300 hover:text-white">
                            Dimanche: 12h00 - 21h30
                        </li>
                    </ul>

                    <div className="mt-8">
                        <h5 className="text-white font-semibold mb-4">Suivez-nous</h5>
                        <div className="flex space-x-4">
                            {['IG', 'FB'].map((social) => (
                                <div
                                    key={social}
                                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-emerald-500 transition-all duration-300 cursor-pointer hover:scale-110 hover:shadow-lg"
                                >
                                    <span className="text-white text-sm font-semibold">{social}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-white/10 mt-12 pt-8 text-center">
                <p className="text-white/60 transition-colors duration-300 hover:text-white/80">
                    &copy; 2025 AMS Artisan Meals. Tous droits réservés.
                </p>
            </div>
        </div>
    </footer>
);