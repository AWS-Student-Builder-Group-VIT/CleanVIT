const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/blocks
 * List all blocks (public, needed for signup)
 */
router.get('/', async (req, res) => {
  try {
    const blocks = await prisma.block.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });
    res.json(blocks);
  } catch (err) {
    console.error('Get blocks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
