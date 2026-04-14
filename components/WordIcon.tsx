import { getEmojiForWord, hasEmoji, colorForWord } from '@/lib/wordEmoji';

type Props = {
  word: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
};

const SIZE_TEXT: Record<NonNullable<Props['size']>, string> = {
  xs: 'text-base',
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-7xl',
  '2xl': 'text-[10rem]',
};

const SIZE_BOX: Record<NonNullable<Props['size']>, string> = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-6 h-6 text-xs',
  md: 'w-9 h-9 text-base',
  lg: 'w-14 h-14 text-2xl',
  xl: 'w-24 h-24 text-4xl',
  '2xl': 'w-40 h-40 text-7xl',
};

export default function WordIcon({ word, size = 'md' }: Props) {
  if (hasEmoji(word)) {
    return <span className={`${SIZE_TEXT[size]} leading-none`}>{getEmojiForWord(word)}</span>;
  }
  const initial = (word.match(/[a-zA-Z]/)?.[0] ?? word[0] ?? '?').toUpperCase();
  const color = colorForWord(word);
  return (
    <span
      className={`${SIZE_BOX[size]} ${color} text-white font-black rounded-full inline-flex items-center justify-center shadow-sm shrink-0`}
    >
      {initial}
    </span>
  );
}
