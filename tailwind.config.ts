import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: 'var(--color-primary-50)',
                    100: 'var(--color-primary-100)',
                    500: 'var(--color-primary-500)',
                    600: 'var(--color-primary-600)',
                    700: 'var(--color-primary-700)',
                },
                brand: {
                    teal: '#00657d',
                    pink: '#B00555',
                    yellow: '#F7AE00',
                },
            },
            fontFamily: {
                barlow: ['var(--font-playfair)', 'serif'],
                sans: ['var(--font-playfair)', 'sans-serif'], // Apply globally as per user request (based on demo)
            },
            boxShadow: {
                'card': '0 4px 16px rgba(0, 0, 0, 0.08)',
                'card-hover': '0 10px 30px rgba(0, 0, 0, 0.12)',
                'floating': '0 6px 20px rgba(0, 0, 0, 0.08)',
            },
        },
    },
    plugins: [],
} satisfies Config;
