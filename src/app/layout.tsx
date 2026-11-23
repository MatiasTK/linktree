import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const display = Bricolage_Grotesque({
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

const mono = JetBrains_Mono({
  variable: '--font-mono-ui',
  weight: ['400', '500', '700'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'My Links',
    template: '%s | My Links',
  },
  description: 'All my important links in one place',
  openGraph: {
    title: 'My Links',
    description: 'All my important links in one place',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Links',
    description: 'All my important links in one place',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ecebe7' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1c1e' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${display.variable} ${mono.variable} antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
