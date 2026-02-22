-- Table des licenses
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_key VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  hardware_id VARCHAR(255),
  max_activations INTEGER DEFAULT 1,
  current_activations INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  activated_at TIMESTAMP,
  expires_at TIMESTAMP,
  last_validated_at TIMESTAMP,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT valid_plan CHECK (plan IN ('monthly', 'annual', 'lifetime')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'expired', 'suspended', 'cancelled'))
);

CREATE INDEX idx_licenses_email ON licenses(email);
CREATE INDEX idx_licenses_key ON licenses(license_key);
CREATE INDEX idx_licenses_hardware ON licenses(hardware_id);
CREATE INDEX idx_licenses_status ON licenses(status);

-- Table des validations (logs)
CREATE TABLE license_validations (
  id SERIAL PRIMARY KEY,
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  validated_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  hardware_id VARCHAR(255),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_validations_license ON license_validations(license_id);
CREATE INDEX idx_validations_date ON license_validations(validated_at DESC);

-- Table des activations (historique)
CREATE TABLE license_activations (
  id SERIAL PRIMARY KEY,
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  hardware_id VARCHAR(255) NOT NULL,
  activated_at TIMESTAMP DEFAULT NOW(),
  deactivated_at TIMESTAMP,
  device_info JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) DEFAULT 'active'
);

-- Vue pour statistiques
CREATE VIEW license_stats AS
SELECT
  plan,
  status,
  COUNT(*) AS count,
  SUM(CASE WHEN activated_at IS NOT NULL THEN 1 ELSE 0 END) AS activated_count,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400) AS avg_age_days
FROM licenses
GROUP BY plan, status;
