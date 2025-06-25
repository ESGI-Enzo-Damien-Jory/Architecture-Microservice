import React from "react";

export interface HeroSlide {
    title: string;
    subtitle: string;
    image: string;
    price: string;
}

export interface MenuItem {
    name: string;
    price: string;
    rating: number;
    time: string;
    image: string;
}

export interface Stat {
    value: string;
    label: string;
    highlight?: boolean;
}

export interface Feature {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
}

export interface NavigationLink {
    href: string;
    label: string;
}

export interface Achievement {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
}

export interface TeamStat {
    value: string;
    label: string;
}

export interface TeamMember {
    name: string;
    role: string;
    speciality: string;
    experience: number;
    stars: number;
    avatar: string;
    description: string;
}