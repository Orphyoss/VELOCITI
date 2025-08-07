-- Add competitive pricing data table based on infare_webfare_fact structure
CREATE TABLE IF NOT EXISTS competitive_pricing (
  id SERIAL PRIMARY KEY,
  market_key INTEGER NOT NULL,
  snapshot_date_key INTEGER NOT NULL,
  dptr_date_key INTEGER NOT NULL,
  dptr_time_key INTEGER NOT NULL,
  outbnd_booking_class_cd VARCHAR(10),
  outbnd_fare_basis VARCHAR(20),
  observation_tm_key INTEGER,
  outbnd_flt_nbr INTEGER,
  price_excl_tax_amt DECIMAL(10,2),
  price_incl_tax_amt DECIMAL(10,2),
  tax_amt DECIMAL(10,2),
  currency_key INTEGER,
  carr_key INTEGER,
  carr_airline_code VARCHAR(10),
  carr_airline_name VARCHAR(255),
  price_outbnd_amt DECIMAL(10,2),
  price_inbnd_amt DECIMAL(10,2),
  is_tax_incl_flg VARCHAR(50),
  search_class VARCHAR(50),
  estimated_cos VARCHAR(50),
  saver_sellup DECIMAL(10,2),
  expected_fare_basis TEXT,
  saver_price DECIMAL(10,2),
  main_price DECIMAL(10,2),
  flt_nbr INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Add indexes for better query performance
  INDEX idx_carr_airline_code (carr_airline_code),
  INDEX idx_market_key (market_key),
  INDEX idx_snapshot_date_key (snapshot_date_key),
  INDEX idx_price_incl_tax_amt (price_incl_tax_amt),
  INDEX idx_search_class (search_class)
);

-- Add route mapping table to connect market_key to actual routes
CREATE TABLE IF NOT EXISTS route_markets (
  id SERIAL PRIMARY KEY,
  market_key INTEGER UNIQUE NOT NULL,
  origin_airport VARCHAR(3) NOT NULL,
  destination_airport VARCHAR(3) NOT NULL,
  route_code VARCHAR(10) NOT NULL,
  market_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_route_code (route_code),
  INDEX idx_market_key (market_key)
);

-- Insert sample route mappings for EasyJet routes
INSERT INTO route_markets (market_key, origin_airport, destination_airport, route_code, market_name) VALUES
(274, 'LGW', 'BCN', 'LGW-BCN', 'London Gatwick to Barcelona'),
(306, 'LGW', 'AMS', 'LGW-AMS', 'London Gatwick to Amsterdam'),
(419, 'LGW', 'CDG', 'LGW-CDG', 'London Gatwick to Paris Charles de Gaulle'),
(345, 'LGW', 'MAD', 'LGW-MAD', 'London Gatwick to Madrid'),
(461, 'LGW', 'FCO', 'LGW-FCO', 'London Gatwick to Rome Fiumicino'),
(369, 'LGW', 'MXP', 'LGW-MXP', 'London Gatwick to Milan Malpensa'),
(370, 'LGW', 'ZUR', 'LGW-ZUR', 'London Gatwick to Zurich');