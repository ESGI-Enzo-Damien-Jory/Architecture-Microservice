import React from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CONTACT_METHODS = [
    {
        icon: Phone,
        title: "Téléphone",
        value: "+33 1 23 45 67 89",
        description: "Lun-Dim : 11h30 - 22h30",
        action: "tel:+33123456789"
    },
    {
        icon: Mail,
        title: "Email",
        value: "contact@ams-restaurant.fr",
        description: "Réponse sous 24h",
        action: "mailto:contact@ams-restaurant.fr"
    },
    {
        icon: MapPin,
        title: "Adresse",
        value: "123 Avenue des Champs-Élysées",
        description: "75008 Paris, France",
        action: "https://maps.google.com"
    }
] as const;

const OPENING_HOURS = [
    { day: "Lundi - Jeudi", hours: "11h30 - 22h30" },
    { day: "Vendredi - Samedi", hours: "11h30 - 23h30" },
    { day: "Dimanche", hours: "12h00 - 21h30" }
] as const;

export const ContactInfo: React.FC = () => (
    <div className="space-y-8">
        {/* Contact Methods */}
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-6 transition-colors duration-300 hover:text-emerald-400">
                Nos coordonnées
            </h3>

            {CONTACT_METHODS.map(({ icon: Icon, title, value, description, action }, index) => (
                <a
                    key={title}
                    href={action}
                    className="block bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 transition-all duration-500 hover:bg-white/10 hover:border-emerald-500/30 hover:scale-105 group"
                    style={{ animationDelay: `${index * 150}ms` }}
                >
                    <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white mb-1 transition-colors duration-300 group-hover:text-emerald-400">
                                {title}
                            </h4>
                            <p className="text-white/90 font-medium mb-1 transition-colors duration-300 group-hover:text-white">
                                {value}
                            </p>
                            <p className="text-white/60 text-sm transition-colors duration-300 group-hover:text-white/80">
                                {description}
                            </p>
                        </div>
                    </div>
                </a>
            ))}
        </div>

        {/* Opening Hours */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center space-x-3 mb-4">
                <Clock className="w-6 h-6 text-emerald-400" />
                <h4 className="text-lg font-bold text-white">Horaires d&apos;ouverture</h4>
            </div>

            <div className="space-y-3">
                {OPENING_HOURS.map(({ day, hours }) => (
                    <div key={day} className="flex justify-between items-center">
                        <span className="text-white/80">{day}</span>
                        <span className="text-emerald-400 font-semibold">{hours}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
            <h4 className="text-lg font-bold text-white">Actions rapides</h4>

            <div className="grid grid-cols-2 gap-4">
                <Button
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105"
                >
                    <Phone className="w-4 h-4 mr-2" />
                    Appeler
                </Button>

                <Button
                    variant="outline"
                    className="border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105"
                >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                </Button>
            </div>
        </div>

        {/* Emergency Note */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <p className="text-amber-200 text-sm">
                <strong>Livraisons urgentes :</strong> Pour les commandes de dernière minute,
                appelez-nous directement au +33 1 23 45 67 89
            </p>
        </div>
    </div>
);