const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * GET /api/users/staff?blockId=X
 * List staff members in a given block (for supervisor assignment dropdown)
 */
router.get('/staff', authorize('SUPERVISOR'), async (req, res) => {
  try {
    const blockId = req.query.blockId || req.user.blockId;

    const staff = await prisma.user.findMany({
      where: {
        role: 'STAFF',
        blockId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(staff);
  } catch (err) {
    console.error('Get staff error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
