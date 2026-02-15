
-- Tethers table first
CREATE TABLE public.tethers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pair_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tethers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tether" ON public.tethers FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create tether" ON public.tethers FOR INSERT
WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can update tether to join" ON public.tethers FOR UPDATE
USING (user2_id IS NULL)
WITH CHECK (auth.uid() = user2_id);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  signature_color TEXT NOT NULL DEFAULT '#53B8E8',
  current_status TEXT CHECK (char_length(current_status) <= 20),
  status_set_at TIMESTAMP WITH TIME ZONE,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  push_subscription JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Tethered partner can view profile" ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tethers
    WHERE (user1_id = auth.uid() AND user2_id = profiles.user_id)
       OR (user2_id = auth.uid() AND user1_id = profiles.user_id)
  )
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
