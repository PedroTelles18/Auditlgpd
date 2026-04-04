# Root Layout Fix for Dark Mode

Add this to your existing root layout.tsx in frontend/src/app/layout.tsx:

```tsx
import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Apply dark mode BEFORE React hydrates to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var p = JSON.parse(localStorage.getItem('privyon_prefs') || '{}');
            if (p.darkMode) document.documentElement.classList.add('dark');
          } catch(e) {}
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```
