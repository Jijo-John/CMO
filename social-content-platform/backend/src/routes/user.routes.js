const express = require('express');
const router = express.Router();

// Placeholder route - user routes are in business.routes.js
// This file exists for modular structure

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'User management is handled through business endpoints.',
    endpoints: {
      getMembers: 'GET /api/businesses/:businessId/members',
      inviteUser: 'POST /api/businesses/:businessId/invite',
      updateRole: 'PUT /api/businesses/:businessId/users/:userId/role',
      removeUser: 'DELETE /api/businesses/:businessId/users/:userId',
    },
  });
});

module.exports = router;
