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
