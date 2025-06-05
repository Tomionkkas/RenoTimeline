
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
				'fade-in-slow': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fade-out': {
					'0%': {
						opacity: '1',
						transform: 'translateY(0)'
					},
					'100%': {
						opacity: '0',
						transform: 'translateY(-10px)'
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
				},
				'slide-in-smooth': {
					'0%': {
						opacity: '0',
						transform: 'translateX(-30px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				'scale-smooth': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.95)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				'page-enter': {
					'0%': {
						opacity: '0',
						transform: 'translateY(15px) scale(0.98)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0) scale(1)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.4s ease-in-out',
				'accordion-up': 'accordion-up 0.4s ease-in-out',
				'fade-in': 'fade-in 0.6s ease-in-out',
				'fade-in-slow': 'fade-in-slow 0.8s ease-in-out',
				'fade-out': 'fade-out 0.5s ease-in-out',
				'slide-in': 'slide-in 0.5s ease-in-out',
				'slide-in-smooth': 'slide-in-smooth 0.7s ease-out',
				'scale-smooth': 'scale-smooth 0.5s ease-out',
				'page-enter': 'page-enter 0.7s ease-out'
			},
			backgroundImage: {
				'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				'gradient-accent': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
			},
			transitionDuration: {
				'400': '400ms',
				'600': '600ms',
				'800': '800ms'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
