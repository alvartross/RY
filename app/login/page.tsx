'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const sb = getSupabase();
    if (!sb) {
      setMessage({ kind: 'err', text: 'Supabase 환경변수가 설정되지 않았어요.' });
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage({ kind: 'err', text: `로그인 실패: ${error.message}` });
        } else {
          setMessage({ kind: 'ok', text: '로그인 성공' });
          router.replace('/');
        }
      } else {
        const { error } = await sb.auth.signUp({ email, password });
        if (error) {
          setMessage({ kind: 'err', text: `가입 실패: ${error.message}` });
        } else {
          setMessage({
            kind: 'ok',
            text: '가입 완료! 메일로 온 확인 링크를 눌러주세요. 그 다음 로그인하시면 됩니다.',
          });
        }
      }
    } finally {
      setBusy(false);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-6 max-w-md space-y-3 text-center">
          <div className="text-5xl">⚙️</div>
          <h1 className="text-xl font-bold">Supabase 설정이 필요해요</h1>
          <p className="text-sm text-gray-600">
            환경변수 <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>를 추가하고 다시 시도해주세요.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50">
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4"
      >
        <header className="text-center">
          <div className="text-5xl">🌈</div>
          <h1 className="text-2xl font-bold mt-2">영어 배우기</h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'login' ? '로그인해서 데이터 동기화' : '새 계정 만들기'}
          </p>
        </header>

        <label className="block">
          <span className="text-sm font-semibold text-gray-700">이메일</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-700">비밀번호 (6자 이상)</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>

        {message && (
          <div
            className={[
              'text-sm rounded-lg px-3 py-2',
              message.kind === 'ok'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700',
            ].join(' ')}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !email || password.length < 6}
          className="w-full px-4 py-3 bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold rounded-lg disabled:opacity-40"
        >
          {busy ? '처리 중…' : mode === 'login' ? '로그인' : '가입하기'}
        </button>

        <div className="text-center text-sm">
          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setMessage(null);
              }}
              className="text-blue-600 hover:underline"
            >
              계정이 없으신가요? 가입하기
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setMessage(null);
              }}
              className="text-blue-600 hover:underline"
            >
              이미 계정이 있으신가요? 로그인
            </button>
          )}
        </div>

        <p className="text-[11px] text-gray-400 text-center leading-relaxed">
          온 가족이 한 계정을 공유하면 모든 기기에서 같은 데이터가 동기화돼요.
        </p>
      </form>
    </main>
  );
}
