import React from 'react';
import {Menu, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Logo} from './logo';
import {useToggle} from '@/hooks';
import {NAVIGATION_LINKS} from '@/constants';

export const Navigation: React.FC = () => {
    const [isMenuOpen, toggleMenu] = useToggle(false);

    return (
        <nav className="fixed w-full z-50 bg-black/80 backdrop-blur-xl border-b border-emerald-500/20">
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex justify-between items-center py-6">
                    <Logo/>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-12">
                        {NAVIGATION_LINKS.map(({href, label}) => (
                            <a
                                key={href}
                                href={href}
                                className="text-white/80 hover:text-emerald-400 transition-colors font-medium"
                            >
                                {label}
                            </a>
                        ))}
                        <Button
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-2.5 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg">
                            Commander
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white transition-transform duration-200 hover:scale-110"
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div
                    className="md:hidden bg-black/95 backdrop-blur-xl border-t border-emerald-500/20 animate-in slide-in-from-top duration-300">
                    <div className="px-6 py-8 space-y-6">
                        {NAVIGATION_LINKS.map(({href, label}) => (
                            <a
                                key={href}
                                href={href}
                                className="block text-white/80 hover:text-emerald-400 transition-colors text-lg"
                                onClick={toggleMenu}
                            >
                                {label}
                            </a>
                        ))}
                        <Button
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-full transition-all duration-300 hover:shadow-lg">
                            Commander
                        </Button>
                    </div>
                </div>
            )}
        </nav>
    );
};