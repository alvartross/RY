'use client';

import { useEffect, useRef, useState } from 'react';
import { checkPin } from '@/lib/admin';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AdminPinModal({ open, onClose, onSuccess }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPin('');
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const submit = () => {
    if (checkPin(pin)) {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-5xl">🔒</div>
          <h2 className="text-xl font-bold mt-2">관리자 모드</h2>
          <p className="text-sm text-gray-500 mt-1">PIN 4자리를 입력하세요</p>
        </div>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          className={[
            'w-full px-4 py-3 text-center text-2xl tracking-[1em] border-2 rounded-xl focus:outline-none',
            error ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-400',
          ].join(' ')}
        />
        {error && (
          <p className="text-center text-sm text-red-600">PIN이 맞지 않아요</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 font-semibold rounded-xl"
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={pin.length !== 4}
            className="flex-1 px-4 py-3 bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold rounded-xl disabled:opacity-40"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
