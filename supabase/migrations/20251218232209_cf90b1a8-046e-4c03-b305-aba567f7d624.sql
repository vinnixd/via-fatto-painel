-- Change invite token from 32 bytes (64 chars) to 8 bytes (16 chars)
ALTER TABLE public.invites 
ALTER COLUMN token SET DEFAULT encode(extensions.gen_random_bytes(8), 'hex');