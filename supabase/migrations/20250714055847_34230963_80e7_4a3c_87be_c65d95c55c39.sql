-- Create storage buckets for KYC documents and profile images (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'kyc-documents') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES ('kyc-documents', 'kyc-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-images') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);
    END IF;
END $$;

-- Create storage policies for KYC documents (private - users can only access their own)
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON storage.objects;
CREATE POLICY "Users can view their own KYC documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload their own KYC documents" ON storage.objects;
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own KYC documents" ON storage.objects;
CREATE POLICY "Users can update their own KYC documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own KYC documents" ON storage.objects;
CREATE POLICY "Users can delete their own KYC documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Admins can view all KYC documents" ON storage.objects;
CREATE POLICY "Admins can view all KYC documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'kyc-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- Create storage policies for profile images (public but user-controlled)
DROP POLICY IF EXISTS "Profile images are publicly accessible" ON storage.objects;
CREATE POLICY "Profile images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
CREATE POLICY "Users can upload their own profile images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
CREATE POLICY "Users can update their own profile images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
CREATE POLICY "Users can delete their own profile images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create otps table for storing one-time passwords (OTP) for email/SMS verification
CREATE TABLE IF NOT EXISTS public.otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms')),
  purpose TEXT NOT NULL, -- e.g., 'login', 'transaction', 'kyc', etc.
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

-- Index for quick lookup (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_otps_user_id') THEN
        CREATE INDEX idx_otps_user_id ON public.otps(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_otps_code') THEN
        CREATE INDEX idx_otps_code ON public.otps(code);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_otps_expires_at') THEN
        CREATE INDEX idx_otps_expires_at ON public.otps(expires_at);
    END IF;
END $$;

-- Add role field to profiles for RBAC
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
-- Optionally, add an index for role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- RLS: Only admins can update other users' wallets and profiles
DROP POLICY IF EXISTS "Admins can update any wallet" ON public.wallets;
CREATE POLICY "Admins can update any wallet" ON public.wallets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);