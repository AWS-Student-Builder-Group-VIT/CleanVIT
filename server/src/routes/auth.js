const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/signup
 * Student-only registration
 */
router.post('/signup', async (req, res) => {
  try {
    const { name, regNo, password, blockId, roomNo } = req.body;

    // Validate required fields
    if (!name || !regNo || !password || !blockId || !roomNo) {
      return res.status(400).json({ error: 'All fields are required: name, regNo, password, blockId, roomNo' });
    }

    // Check if regNo already exists
    const existing = await prisma.user.findUnique({ where: { regNo } });
    if (existing) {
      return res.status(409).json({ error: 'Registration number already in use' });
    }

    // Verify block exists
    const block = await prisma.block.findUnique({ where: { id: blockId } });
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        role: 'STUDENT',
        name,
        regNo,
        passwordHash,
        blockId,
        roomNo,
      },
      include: { block: true },
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        regNo: user.regNo,
        blockId: user.blockId,
        blockName: user.block?.name,
        roomNo: user.roomNo,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Login for all roles — students use regNo, staff/supervisors use email
 */
router.post('/login', async (req, res) => {
  try {
    const { regNo, email, password, blockId } = req.body;

    if (!password || (!regNo && !email)) {
      return res.status(400).json({ error: 'Provide (regNo or email) and password' });
    }

    let user;
    if (regNo) {
      user = await prisma.user.findUnique({
        where: { regNo },
        include: { block: true },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { email },
        include: { block: true },
      });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (['STAFF', 'SUPERVISOR'].includes(user.role)) {
      if (!blockId) {
        return res.status(400).json({ error: 'Please select your block to login' });
      }
      if (user.blockId !== blockId) {
        return res.status(403).json({ error: 'You are not assigned to this block. Access denied.' });
      }
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        regNo: user.regNo,
        email: user.email,
        blockId: user.blockId,
        blockName: user.block?.name,
        roomNo: user.roomNo,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile from JWT
 */
router.get('/me', authenticate, async (req, res) => {
  const user = req.user;
  res.json({
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      regNo: user.regNo,
      email: user.email,
      blockId: user.blockId,
      blockName: user.block?.name,
      roomNo: user.roomNo,
    },
  });
});

module.exports = router;
