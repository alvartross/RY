-- 영유 복습 앱 DB 스키마
-- Supabase 대시보드 → SQL Editor에서 전체 붙여넣기 → Run

-- 1) lessons: 날짜별 수업 (Circle/Phonics/Journeys)
create table if not exists public.lessons (
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- 2) profiles: 이름·이모지·총 포인트
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '꼬마 영어쟁이',
  emoji text not null default '🧒',
  total_points integer not null default 0,
  updated_at timestamptz not null default now()
);

-- 3) daily_scores: 일별 카테고리 획득 포인트
create table if not exists public.daily_scores (
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  review integer not null default 0,
  phonics integer not null default 0,
  listening integer not null default 0,
  writing integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- 4) history: 포인트 이벤트 로그
create table if not exists public.history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  category text not null,
  delta integer not null,
  note text,
  at bigint not null
);
create index if not exists history_user_at_idx on public.history (user_id, at desc);

-- 5) word_stages: Word Game 스테이지 클리어 기록
create table if not exists public.word_stages (
  user_id uuid not null references auth.users(id) on delete cascade,
  stage_id text not null,
  points integer not null,
  cleared_at timestamptz not null default now(),
  primary key (user_id, stage_id)
);

-- 6) visits: 방문 기록 (오늘 / 최근)
create table if not exists public.visits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  previous text,
  current text not null,
  updated_at timestamptz not null default now()
);

-- RLS 활성화
alter table public.lessons enable row level security;
alter table public.profiles enable row level security;
alter table public.daily_scores enable row level security;
alter table public.history enable row level security;
alter table public.word_stages enable row level security;
alter table public.visits enable row level security;

-- RLS 정책: 자기 데이터만 읽고 쓰기 가능
drop policy if exists "own lessons" on public.lessons;
create policy "own lessons" on public.lessons
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own daily_scores" on public.daily_scores;
create policy "own daily_scores" on public.daily_scores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own history" on public.history;
create policy "own history" on public.history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own word_stages" on public.word_stages;
create policy "own word_stages" on public.word_stages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own visits" on public.visits;
create policy "own visits" on public.visits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 신규 가입 시 profiles 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
