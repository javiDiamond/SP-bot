import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Vazirmatn } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import Providers from './providers';
import { routing, localeDirection } from '@/i18n/routing';
import '../../styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
// Persian UI font (Vazirmatn, SIL Open Font License). The CSS variable is only
// referenced from `html[lang="fa"]` rules, so Latin-locale users never
// download the font files.
const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  variable: '--font-vazirmatn',
  display: 'swap',
});

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F3F6FA' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0E15' },
  ],
};

// Runs before hydration: restores the persisted theme without a flash.
const themeInitScript = `(function(){try{var t=localStorage.getItem('wallex-theme');if(t!=='light')t='dark';var r=document.documentElement;r.classList.toggle('dark',t==='dark');r.style.colorScheme=t;}catch(e){document.documentElement.classList.add('dark');}})();`;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const dir = localeDirection[locale];
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${mono.variable} ${vazirmatn.variable}`}
    >
      <body className="font-sans">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
