import {

  Geist_Mono,
  Inter,
  Fraunces,
  Tajawal,
  Almarai
} from 'next/font/google';

import { cn } from './utils';



const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
});

const fontEnBase = Inter({
  subsets: ['latin'],
  variable: '--font-en-base'
});

const fontEnTitle = Fraunces({
  subsets: ['latin'],
  variable: '--font-en-title'
});

const fontArBase = Tajawal({
  subsets: ['arabic'],
  weight: ['200', '300', '400', '500', '700', '800', '900'],
  variable: '--font-ar-base'
});

const fontArTitle = Almarai({
  subsets: ['arabic'],
  weight: ['300', '400', '700', '800'],
  variable: '--font-ar-title'
});

export const fontVariables = cn(
  fontMono.variable,
  fontEnBase.variable,
  fontEnTitle.variable,
  fontArBase.variable,
  fontArTitle.variable
);
