
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: '#25292e',
				foreground: '#ffffff',
				primary: {
					DEFAULT: '#3b82f6',
					foreground: '#ffffff'
				},
				secondary: {
					DEFAULT: '#1e293b',
					foreground: '#ffffff'
				},
				destructive: {
					DEFAULT: '#ef4444',
					foreground: '#ffffff'
				},
				muted: {
					DEFAULT: '#374151',
					foreground: '#d1d5db'
				},
				accent: {
					DEFAULT: '#6366f1',
					foreground: '#ffffff'
				},
				popover: {
					DEFAULT: '#1f2937',
					foreground: '#ffffff'
				},
				card: {
					DEFAULT: '#1f2937',
					foreground: '#ffffff'
				},
				sidebar: {
					DEFAULT: '#1e293b',
					foreground: '#ffffff',
					primary: '#3b82f6',
					'primary-foreground': '#ffffff',
					accent: '#374151',
					'accent-foreground': '#ffffff',
					border: '#374151',
					ring: '#3b82f6'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in': {
					'0%': {
						opacity: '0',
						transform: 'translateX(-100%)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-in': 'slide-in 0.3s ease-out'
			},
			backgroundImage: {
				'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				'gradient-accent': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
