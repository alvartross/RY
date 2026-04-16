'use client';

import { useEffect } from 'react';
import { getTheme, applyTheme } from '@/lib/theme';

export default function ThemeInit() {
  useEffect(() => {
    applyTheme(getTheme());
  }, []);
  return null;
}
