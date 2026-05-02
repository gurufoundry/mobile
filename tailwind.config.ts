import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        paper: 'var(--paper)',
        'paper-2': 'var(--paper-2)',
        coral: 'var(--coral)',
        acid: 'var(--acid)',
        plum: 'var(--plum)',
        sky: 'var(--sky)',
      },
      fontFamily: {
        sans: ['Inter Tight', 'ui-sans-serif', 'system-ui'],
        display: ['Fraunces', 'ui-serif', 'Georgia'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
