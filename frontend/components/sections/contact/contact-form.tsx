import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, User, Mail, MessageSquare } from 'lucide-react';

export const ContactForm: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Logique de soumission du formulaire
        console.log('Form submitted:', formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 transition-all duration-500 hover:bg-white/8">
            <h3 className="text-2xl font-bold text-white mb-6 transition-colors duration-300 hover:text-emerald-400">
                Envoyez-nous un message
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Input */}
                <div className="space-y-2">
                    <label className="text-white/80 text-sm font-medium flex items-center space-x-2">
                        <User className="w-4 h-4 text-emerald-400" />
                        <span>Nom complet</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500 focus:bg-white/15 transition-all duration-300"
                        placeholder="Votre nom"
                        required
                    />
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                    <label className="text-white/80 text-sm font-medium flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-emerald-400" />
                        <span>Email</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500 focus:bg-white/15 transition-all duration-300"
                        placeholder="votre@email.com"
                        required
                    />
                </div>

                {/* Subject Select */}
                <div className="space-y-2">
                    <label className="text-white/80 text-sm font-medium flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>Sujet</span>
                    </label>
                    <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:bg-white/15 transition-all duration-300"
                        required
                    >
                        <option value="" className="bg-black text-white">Choisissez un sujet</option>
                        <option value="reservation" className="bg-black text-white">Réservation</option>
                        <option value="menu" className="bg-black text-white">Questions sur le menu</option>
                        <option value="partenariat" className="bg-black text-white">Partenariat</option>
                        <option value="feedback" className="bg-black text-white">Commentaires</option>
                        <option value="autre" className="bg-black text-white">Autre</option>
                    </select>
                </div>

                {/* Message Textarea */}
                <div className="space-y-2">
                    <label className="text-white/80 text-sm font-medium">
                        Message
                    </label>
                    <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500 focus:bg-white/15 transition-all duration-300 resize-none"
                        placeholder="Partagez-nous votre message..."
                        required
                    />
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                    <Send className="w-5 h-5 mr-2" />
                    Envoyer le message
                </Button>
            </form>
        </div>
    );
};