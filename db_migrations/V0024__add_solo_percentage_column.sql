-- Add solo_percentage column to users table
ALTER TABLE users ADD COLUMN solo_percentage VARCHAR(3) DEFAULT '50';

-- Add comment
COMMENT ON COLUMN users.solo_percentage IS 'Percentage for solo makers (50, 60, 65, or 70)';