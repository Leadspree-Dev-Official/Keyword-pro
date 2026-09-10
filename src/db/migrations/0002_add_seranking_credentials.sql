ALTER TABLE public.keyword_pro_api_credentials
  ADD COLUMN IF NOT EXISTS seranking_api_key text;
