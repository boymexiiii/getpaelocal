-- Automated Savings Plans

CREATE TABLE IF NOT EXISTS public.savings_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('rule', 'roundup', 'fixed', 'custom')),
  rule JSONB,
  amount DECIMAL(15,2),
  frequency TEXT NOT NULL, -- e.g., 'daily', 'weekly', 'monthly', 'on-transaction'
  next_run TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.savings_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.savings_plans(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.savings_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can view their own savings plans" ON public.savings_plans;
CREATE POLICY "Users can view their own savings plans" ON public.savings_plans FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own savings plans" ON public.savings_plans;
CREATE POLICY "Users can insert their own savings plans" ON public.savings_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own savings plans" ON public.savings_plans;
CREATE POLICY "Users can update their own savings plans" ON public.savings_plans FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view their own savings transactions" ON public.savings_transactions;
CREATE POLICY "Users can view their own savings transactions" ON public.savings_transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own savings transactions" ON public.savings_transactions;
CREATE POLICY "Users can insert their own savings transactions" ON public.savings_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own savings transactions" ON public.savings_transactions;
CREATE POLICY "Users can update their own savings transactions" ON public.savings_transactions FOR UPDATE USING (auth.uid() = user_id); 