-- Migration: add is_pro flag to existing users table
-- Run this once in your Supabase SQL editor (https://supabase.com/dashboard → SQL Editor)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false;
