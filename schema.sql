-- NextAuth Core Tables
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image TEXT
);

CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE (provider, "providerAccountId")
);

CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE verification_token (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- App Data Tables
CREATE TABLE exercise (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  muscle_group TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE workouts (
  id SERIAL PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sets (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id INTEGER REFERENCES exercise(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  reps INTEGER NOT NULL
);

CREATE TABLE weightlog (
  id SERIAL PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT NOW(),
  weight NUMERIC NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);