-- Create RSVPs table
CREATE TABLE rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  cancel_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  cancelled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for RSVP form)
CREATE POLICY "Allow public insert" ON rsvps
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow public read by cancel_token only (for cancellation)
CREATE POLICY "Allow cancel by token" ON rsvps
  FOR UPDATE TO anon
  USING (cancel_token = cancel_token)
  WITH CHECK (true);

-- Allow public select by cancel_token (to show cancellation page)
CREATE POLICY "Allow select by token" ON rsvps
  FOR SELECT TO anon
  USING (true);
