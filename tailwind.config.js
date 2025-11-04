/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Sistema responsive para Trivo
      maxWidth: {
        'app': '640px',        // Contenedor principal de la app
        'app-sm': '480px',     // Contenedor pequeño (modals, formularios estrechos)
        'app-lg': '768px',     // Contenedor grande (tablets)
        'app-xl': '1024px',    // Contenedor extra grande (desktop)
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      aspectRatio: {
        'cover': '390 / 190',  // Aspect ratio para covers de eventos (mantiene proporción del diseño original)
        'card': '4 / 3',       // Para cards de eventos
        'square': '1 / 1',     // Para avatares grandes
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    // Plugin personalizado para componentes responsive de Trivo
    function ({ addComponents }) {
      addComponents({
        // Contenedor principal de la app - reemplaza w-[390px]
        '.app-container': {
          width: '100%',
          maxWidth: '640px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '1rem',
          paddingRight: '1rem',
        },
        // Variante sin padding (para casos que ya tienen padding)
        '.app-container-no-padding': {
          width: '100%',
          maxWidth: '640px',
          marginLeft: 'auto',
          marginRight: 'auto',
        },
        // Contenedor estrecho (modals, formularios)
        '.app-container-narrow': {
          width: '100%',
          maxWidth: '480px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '1rem',
          paddingRight: '1rem',
        },
        // Contenedor ancho (tablets)
        '.app-container-wide': {
          width: '100%',
          maxWidth: '768px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
        },
        // Contenedor full-width en móvil, centrado en desktop
        '.app-container-fluid': {
          width: '100%',
          maxWidth: '100%',
          '@media (min-width: 640px)': {
            maxWidth: '640px',
            marginLeft: 'auto',
            marginRight: 'auto',
          },
        },
      })
    },
  ],
};
