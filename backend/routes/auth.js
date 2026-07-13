const express = require('express');
const router = express.Router();

// POST /api/auth/verify-role
// Verifies role + password combo against env vars
router.post('/verify-role', (req, res) => {
  const { role, employeeIndex, password } = req.body;

  if (role === 'admin') {
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
    if (password === adminPass) {
      return res.json({
        success: true,
        role: 'admin',
        name: process.env.OWNER_NAME || 'Admin',
        email: '',
      });
    } else {
      return res.status(401).json({ success: false, error: 'Invalid admin password' });
    }
  }

  if (role === 'employee') {
    const idx = parseInt(employeeIndex);
    if (!idx || idx < 1 || idx > 5) {
      return res.status(400).json({ success: false, error: 'Invalid employee selection' });
    }
    const empPass = process.env[`EMPLOYEE_${idx}_PASSWORD`] || `emp${idx}pass`;
    const empName = process.env[`EMPLOYEE_${idx}_NAME`] || `Employee ${idx}`;
    if (password === empPass) {
      return res.json({
        success: true,
        role: 'employee',
        name: empName,
        email: '',
        employeeIndex: idx,
      });
    } else {
      return res.status(401).json({ success: false, error: 'Invalid employee password' });
    }
  }

  return res.status(400).json({ success: false, error: 'Invalid role' });
});

// GET /api/auth/employees
// Returns list of configured employee names (no passwords)
router.get('/employees', (req, res) => {
  const employees = [];
  for (let i = 1; i <= 5; i++) {
    const name = process.env[`EMPLOYEE_${i}_NAME`] || `Employee ${i}`;
    employees.push({ index: i, name });
  }
  res.json(employees);
});

// GET /api/auth/config
// Returns public config for frontend (GOOGLE_CLIENT_ID, BUSINESS_NAME)
router.get('/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    businessName: process.env.BUSINESS_NAME || 'BakeFlow',
    businessPhone: process.env.BUSINESS_PHONE || '',
  });
});

module.exports = router;
