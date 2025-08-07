-- Migration: Add route capacity and competitor tables
-- Author: System
-- Date: 2025-08-07

-- Route Capacity Configuration table
CREATE TABLE IF NOT EXISTS route_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_code VARCHAR(10) NOT NULL,
  origin_airport VARCHAR(3) NOT NULL,
  destination_airport VARCHAR(3) NOT NULL,
  route_name VARCHAR(100) NOT NULL,
  carrier_code VARCHAR(3) NOT NULL,
  carrier_name VARCHAR(50) NOT NULL,
  aircraft_type VARCHAR(10) NOT NULL,
  seats_per_flight INTEGER NOT NULL,
  daily_flights INTEGER NOT NULL,
  weekly_frequency INTEGER NOT NULL,
  active_flag BOOLEAN DEFAULT true,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Route Competitive Carriers table
CREATE TABLE IF NOT EXISTS route_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_code VARCHAR(10) NOT NULL,
  carrier_code VARCHAR(3) NOT NULL,
  carrier_name VARCHAR(50) NOT NULL,
  market_share_pct DECIMAL(5,2),
  avg_price DECIMAL(8,2),
  daily_capacity INTEGER,
  competitive_position VARCHAR(20),
  active_flag BOOLEAN DEFAULT true,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_route_capacity_route_code ON route_capacity(route_code);
CREATE INDEX IF NOT EXISTS idx_route_capacity_effective_dates ON route_capacity(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_route_competitors_route_code ON route_competitors(route_code);
CREATE INDEX IF NOT EXISTS idx_route_competitors_carrier ON route_competitors(carrier_code);

-- Add comments
COMMENT ON TABLE route_capacity IS 'Detailed capacity configuration for each route by carrier';
COMMENT ON TABLE route_competitors IS 'Competitive carrier mapping and market share data by route';