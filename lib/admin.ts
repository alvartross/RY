import { useEffect, useState } from 'react';

const SESSION_KEY = 'english-kids:admin';
const PIN = '1234';

export function checkPin(input: string): boolean {
  return input === PIN;
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
