-- Brew V2 — Tables for LinkedIn 360 cockpit
-- Run this migration after schema.sql

-- Weekly declarations per pillar
CREATE TABLE IF NOT EXISTS public.brew_weeks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  week_start date NOT NULL,
  pillar_id integer NOT NULL CHECK (pillar_id BETWEEN 1 AND 4),
  published boolean DEFAULT false,
  reactions_rh integer DEFAULT 0,
  reactions_n1 integer DEFAULT 0,
  reactions_peers integer DEFAULT 0,
  reactions_other integer DEFAULT 0,
  signal_text text,
  dms_generated integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start, pillar_id)
);

ALTER TABLE public.brew_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own brew_weeks" ON public.brew_weeks
  FOR ALL USING (auth.uid() = user_id);

-- Instructions from Brew to Forge (regeneration requests)
CREATE TABLE IF NOT EXISTS public.brew_instructions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  pillar_id integer NOT NULL CHECK (pillar_id BETWEEN 1 AND 4),
  target_dilts_level integer NOT NULL CHECK (target_dilts_level BETWEEN 1 AND 6),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.brew_instructions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own brew_instructions" ON public.brew_instructions
  FOR ALL USING (auth.uid() = user_id);
