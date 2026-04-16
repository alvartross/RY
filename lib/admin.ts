import { useEffect, useState } from 'react';

const SESSION_KEY = 'english-kids:admin';
const PIN_KEY = 'english-kids:adminPin';
const DEFAULT_PIN = '1234';

function getStoredPin(): string {
  if (typeof window === 'undefined') return DEFAULT_PIN;
  return window.localStorage.getItem(PIN_KEY) ?? DEFAULT_PIN;
}

export function checkPin(input: string): boolean {
  return input === getStoredPin();
}

export function changePin(currentPin: string, newPin: string): { ok: boolean; error?: string } {
  if (!checkPin(currentPin)) return { ok: false, error: '현재 PIN이 맞지 않아요' };
  if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) return { ok: false, error: 'PIN은 숫자 4자리여야 해요' };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PIN_KEY, newPin);
  }
  return { ok: true };
}

export function getCurrentPin(): string {
  return getStoredPin();
}

export function useAdmin(): { isAdmin: boolean; enter: () => void; exit: () => void } {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsAdmin(window.sessionStorage.getItem(SESSION_KEY) === '1');
  }, []);

  const enter = () => {
    window.sessionStorage.setItem(SESSION_KEY, '1');
    setIsAdmin(true);
  };
  const exit = () => {
    window.sessionStorage.removeItem(SESSION_KEY);
    setIsAdmin(false);
  };

  return { isAdmin, enter, exit };
}
