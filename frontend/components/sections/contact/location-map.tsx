import React from 'react';
import { MapPin, Navigation, Car, Train } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TRANSPORT_OPTIONS = [
    {
        icon: Train,
        title: "Métro",
        description: "Stations Charles de Gaulle-Étoile ou George V",
        color: "text-blue-400"
    },
    {
        icon: Car,
        title: "Voiture",
        description: "Parking disponible à 100m",
        color: "text-green-400"
    },
    {
        icon: Navigation,
        title: "GPS",
        description: "123 Avenue des Champs-Élysées, 75008 Paris",
        color: "text-purple-400"
    }
] as const;

export const LocationMap: React.FC = () => (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Map Placeholder */}
            <div className="relative">
                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-2xl h-80 flex items-center justify-center border border-emerald-500/20">
                    <div className="text-center">
                        <MapPin className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                        <h4 className="text-2xl font-bold text-white mb-2">AMS Restaurant</h4>
                        <p className="text-white/70">Champs-Élysées, Paris</p>
                        <Button
                            className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-full transition-all duration-300 hover:scale-105"
                        >
                            Voir sur Google Maps
                        </Button>
                    </div>
                </div>

                {/* Interactive overlay */}
                <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button
                        size="lg"
                        className="bg-white/90 text-emerald-600 hover:bg-white font-semibold px-8 py-3 rounded-full transition-all duration-300 hover:scale-105 shadow-xl"
                    >
                        <Navigation className="w-5 h-5 mr-2" />
                        Obtenir l&apos;itinéraire
                    </Button>
                </div>
            </div>

            {/* Transport Info */}
            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6 transition-colors duration-300 hover:text-emerald-400">
                    Comment nous rejoindre
                </h3>

                <div className="space-y-4">
                    {TRANSPORT_OPTIONS.map(({ icon: Icon, title, description, color }, index) => (
                        <div
                            key={title}
                            className="bg-white/5 rounded-xl p-4 border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-emerald-500/30 group"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-start space-x-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white/10 transition-transform duration-300 group-hover:scale-110`}>
                                    <Icon className={`w-5 h-5 ${color}`} />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-1 transition-colors duration-300 group-hover:text-emerald-400">
                                        {title}
                                    </h4>
                                    <p className="text-white/70 text-sm transition-colors duration-300 group-hover:text-white/90">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Additional Info */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mt-6">
                    <h5 className="text-emerald-400 font-semibold mb-2">Informations pratiques</h5>
                    <ul className="text-white/80 text-sm space-y-1">
                        <li>• Accès PMR disponible</li>
                        <li>• Zone de livraison dans un rayon de 5km</li>
                        <li>• Service voiturier sur demande</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);