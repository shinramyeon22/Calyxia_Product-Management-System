-- Create User table
CREATE TABLE "user" (
    user_id VARCHAR(50) NOT NULL PRIMARY KEY,           -- e.g. email or username
    password VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL,                     -- SUPERADMIN, ADMIN, STAFF, etc.
    firstname VARCHAR(30),
    lastname VARCHAR(30),
    email VARCHAR(100),
    record_status CHAR(1) DEFAULT 'A' CHECK (record_status IN ('A','I')),  -- Active/Inactive
    stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Module table (screens/features in the system)
CREATE TABLE module (
    module_id VARCHAR(10) NOT NULL PRIMARY KEY,
    module_name VARCHAR(50) NOT NULL,
    description VARCHAR(100),
    record_status CHAR(1) DEFAULT 'A',
    stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Rights table (what actions are allowed)
CREATE TABLE rights (
    right_id VARCHAR(10) NOT NULL PRIMARY KEY,
    right_name VARCHAR(30) NOT NULL,          -- e.g. VIEW, CREATE, EDIT, DELETE, APPROVE
    description VARCHAR(100),
    record_status CHAR(1) DEFAULT 'A',
    stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction table: which user has access to which module
CREATE TABLE user_module (
    user_id VARCHAR(50) NOT NULL REFERENCES "user"(user_id),
    module_id VARCHAR(10) NOT NULL REFERENCES module(module_id),
    PRIMARY KEY (user_id, module_id)
);

-- Junction table: specific rights per user-module combination
CREATE TABLE UserModule_Rights (
    user_id VARCHAR(50) NOT NULL REFERENCES "user"(user_id),
    module_id VARCHAR(10) NOT NULL REFERENCES module(module_id),
    right_id VARCHAR(10) NOT NULL REFERENCES rights(right_id),
    has_access BOOLEAN DEFAULT TRUE,          -- or CHAR(1) 'Y'/'N'
    PRIMARY KEY (user_id, module_id, right_id)
);

-- Optional: Add record_status and stamp to existing tables if needed
ALTER TABLE product 
ADD COLUMN record_status CHAR(1) DEFAULT 'A' CHECK (record_status IN ('A','I')),
ADD COLUMN stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE priceHist 
ADD COLUMN record_status CHAR(1) DEFAULT 'A' CHECK (record_status IN ('A','I')),
ADD COLUMN stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;







-- Insert SUPERADMIN user (as mentioned)
INSERT INTO "user" (user_id, password, user_type, firstname, lastname, email, record_status)
VALUES ('jcesperanza@neu.edu.ph', 
        '$2a$12$somehashedpasswordhere',   -- replace with a real hashed password (use bcrypt etc.)
        'SUPERADMIN', 
        'Jeremias', 
        'Esperanza', 
        'jcesperanza@neu.edu.ph', 
        'A');

-- Example Modules (add more as needed for your app)
INSERT INTO module (module_id, module_name, description) VALUES
('EMP', 'Employee Management', 'CRUD for employees'),
('CUST', 'Customer Management', 'CRUD for customers'),
('SALES', 'Sales Transactions', 'Create/View sales'),
('PROD', 'Product & Pricing', 'Manage products and price history'),
('REPORT', 'Reports', 'All reports module');

-- Example Rights
INSERT INTO rights (right_id, right_name, description) VALUES
('VIEW', 'View', 'Can view records'),
('CREATE', 'Create', 'Can create new records'),
('EDIT', 'Edit', 'Can update records'),
('DELETE', 'Delete', 'Can delete records'),
('APPROVE', 'Approve', 'Can approve transactions');
-- Give SUPERADMIN access to all modules with all rights
INSERT INTO user_module (user_id, module_id)
SELECT 'jcesperanza@neu.edu.ph', module_id FROM module;

INSERT INTO UserModule_Rights (user_id, module_id, right_id, has_access)
SELECT um.user_id, um.module_id, r.right_id, TRUE
FROM user_module um
CROSS JOIN rights r
WHERE um.user_id = 'jcesperanza@neu.edu.ph';
