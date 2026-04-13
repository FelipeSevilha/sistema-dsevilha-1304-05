
/*
  # Criação dos usuários padrão do sistema

  ## O que este migration faz:
  - Cria os 4 usuários padrão via Supabase Auth
  - Insere perfis correspondentes na tabela user_profiles
  - Felipe Sevilha e Wanessa Castro: role admin
  - Robson Moreno e Roberta Moreno: role vendedor

  ## Senha padrão: 123456
*/

DO $$
DECLARE
  v_id uuid;
BEGIN
  -- Felipe Sevilha (admin)
  SELECT id INTO v_id FROM auth.users WHERE email = 'financeiro@dsevilha.com.br';
  IF v_id IS NULL THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      aud, role, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_id, 'c81fc48c-f473-49f7-8314-05ab0629aaf3',
      financeiro@dsevilha.com.br',
      crypt('12qwaszx', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}', '{"name":"Felipe Sevilha"}',
      now(), now(), 'authenticated', 'authenticated', '', '', '', ''
    );
    INSERT INTO user_profiles (id, name, role, ativo) VALUES (v_id, 'Felipe Sevilha', 'admin', true);
  ELSIF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = v_id) THEN
    INSERT INTO user_profiles (id, name, role, ativo) VALUES (v_id, 'Felipe Sevilha', 'admin', true);
  END IF;

  -- Wanessa Castro (admin)
  SELECT id INTO v_id FROM auth.users WHERE email = 'comercial@dsevilha.com.br';
  IF v_id IS NULL THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      aud, role, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_id, 'd918aafc-dc3f-4463-88c6-6175ebb79a8b',
      'comercial@dsevilha.com.br',
      crypt('wan12qwaszx', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}', '{"name":"Wanessa Castro"}',
      now(), now(), 'authenticated', 'authenticated', '', '', '', ''
    );
    INSERT INTO user_profiles (id, name, role, ativo) VALUES (v_id, 'Wanessa Castro', 'admin', true);
  ELSIF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = v_id) THEN
    INSERT INTO user_profiles (id, name, role, ativo) VALUES (v_id, 'Wanessa Castro', 'admin', true);
  END IF;

  -- Robson Moreno (vendedor)
  SELECT id INTO v_id FROM auth.users WHERE email = 'robson@graficadesevilha.com.br';
  IF v_id IS NULL THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      aud, role, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_id, '00000000-0000-0000-0000-000000000000',
      'robson@graficadesevilha.com.br',
      crypt('123456', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}', '{"name":"Robson Moreno"}',
      now(), now(), 'authenticated', 'authenticated', '', '', '', ''
    );
    INSERT INTO user_profiles (id, name, role, ativo) VALUES (v_id, 'Robson Moreno', 'vendedor', true);
  ELSIF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = v_id) THEN
    INSERT INTO user_profiles (id, name, role, ativo) VALUES (v_id, 'Robson Moreno', 'vendedor', true);
  END IF;

  -- Roberta Moreno (vendedor)
  SELECT id INTO v_id FROM auth.users WHERE email = 'roberta@graficadesevilha.com.br';
  IF v_id IS NULL THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      aud, role, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_id, '00000000-0000-0000-0000-000000000000',
      'roberta@graficadesevilha.com.br',
      crypt('123456', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}', '{"name":"Roberta Moreno"}',
      now(), now(), 'authenticated', 'authenticated', '', '', '', ''
    );
    INSERT INTO user_profiles (id, name, role, ativo) VALUES (v_id, 'Roberta Moreno', 'vendedor', true);
  ELSIF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = v_id) THEN
    INSERT INTO user_profiles (id, name, role, ativo) VALUES (v_id, 'Roberta Moreno', 'vendedor', true);
  END IF;

END $$;
