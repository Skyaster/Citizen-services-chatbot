-- Citizen Services Chatbot - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Citizens table
CREATE TABLE IF NOT EXISTS citizens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(15) UNIQUE,
  name VARCHAR(100),
  city VARCHAR(100),
  ward VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grievances table
CREATE TABLE IF NOT EXISTS grievances (
  id SERIAL PRIMARY KEY,
  grievance_id VARCHAR(20) UNIQUE NOT NULL,
  citizen_id UUID REFERENCES citizens(id),
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  landmark VARCHAR(200),
  photo_url TEXT,
  status VARCHAR(20) DEFAULT 'New',
  assigned_department VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications table (for certificates and licenses)
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  application_id VARCHAR(20) UNIQUE NOT NULL,
  citizen_id UUID REFERENCES citizens(id),
  type VARCHAR(50) NOT NULL, -- 'certificate' or 'license'
  subtype VARCHAR(50) NOT NULL, -- 'birth_certificate', 'shop_license', etc.
  details JSONB DEFAULT '{}',
  documents JSONB DEFAULT '[]',
  status VARCHAR(30) DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bills table (for demo purposes)
CREATE TABLE IF NOT EXISTS bills (
  id SERIAL PRIMARY KEY,
  consumer_number VARCHAR(20) NOT NULL,
  bill_type VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'unpaid',
  late_fee DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table (for chat history)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  citizen_id UUID REFERENCES citizens(id),
  messages JSONB DEFAULT '[]',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_grievances_citizen ON grievances(citizen_id);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_grievance_id ON grievances(grievance_id);
CREATE INDEX IF NOT EXISTS idx_applications_citizen ON applications(citizen_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_application_id ON applications(application_id);
CREATE INDEX IF NOT EXISTS idx_bills_consumer ON bills(consumer_number);

-- Insert sample bill data for demo
INSERT INTO bills (consumer_number, bill_type, amount, due_date, status) VALUES
  ('1234567890', 'electricity', 2450.00, '2024-12-31', 'unpaid'),
  ('9876543210', 'electricity', 1850.00, '2025-01-05', 'unpaid'),
  ('5555555555', 'water', 650.00, '2024-12-28', 'unpaid'),
  ('PROP123456', 'property_tax', 12500.00, '2025-03-31', 'unpaid')
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Public read access for bills (for demo)
CREATE POLICY "Allow public read access on bills"
  ON bills FOR SELECT
  USING (true);

-- Public insert access for grievances and applications (for demo)
CREATE POLICY "Allow public insert on grievances"
  ON grievances FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read on grievances"
  ON grievances FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on applications"
  ON applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read on applications"
  ON applications FOR SELECT
  USING (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_citizens_updated_at
  BEFORE UPDATE ON citizens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grievances_updated_at
  BEFORE UPDATE ON grievances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
