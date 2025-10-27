UPDATE users SET password_hash = encode(sha256('password123'::bytea), 'hex') WHERE email IN ('director@mba-corp.com', 'producer@mba-corp.com', 'operator@mba-corp.com', 'content@mba-corp.com');
