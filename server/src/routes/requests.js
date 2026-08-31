const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { notifyUser } = require('../utils/notifications');

const router = express.Router();
const prisma = new PrismaClient();

// All request routes require authentication
router.use(authenticate);

/**
 * POST /api/requests
 * Student creates a new cleaning request
 */
router.post('/', authorize('STUDENT'), async (req, res) => {
  try {
    const { cleaningType, comment } = req.body;
    const user = req.user;

    if (!cleaningType) {
      return res.status(400).json({ error: 'cleaningType is required' });
    }

    if (!user.blockId || !user.roomNo) {
      return res.status(400).json({ error: 'Your profile is missing block or room info' });
    }

    const request = await prisma.cleaningRequest.create({
      data: {
        studentId: user.id,
        blockId: user.blockId,
        roomNo: user.roomNo,
        cleaningType,
        comment: comment || null,
        status: 'PENDING',
      },
      include: {
        student: { select: { name: true, regNo: true } },
        block: { select: { name: true } },
        assignedStaff: { select: { name: true } },
      },
    });

    res.status(201).json(request);
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/requests
 * Returns requests filtered by the current user's role:
 * - STUDENT: own requests only
 * - SUPERVISOR: all requests in their block
 * - STAFF: assigned requests only
 */
router.get('/', async (req, res) => {
  try {
    const user = req.user;
    const { status } = req.query;

    let where = {};

    if (user.role === 'STUDENT') {
      where.studentId = user.id;
    } else if (user.role === 'SUPERVISOR') {
      where.blockId = user.blockId;
    } else if (user.role === 'STAFF') {
      where.assignedStaffId = user.id;
    }

    if (status) {
      where.status = status;
    }

    const requests = await prisma.cleaningRequest.findMany({
      where,
      include: {
        student: { select: { name: true, regNo: true, roomNo: true } },
        block: { select: { name: true } },
        assignedStaff: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(requests);
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/requests/:id
 * Get a single request by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const request = await prisma.cleaningRequest.findUnique({
      where: { id: req.params.id },
      include: {
        student: { select: { name: true, regNo: true, roomNo: true } },
        block: { select: { name: true } },
        assignedStaff: { select: { name: true } },
        parentRequest: { select: { id: true, status: true, createdAt: true } },
        reRaisedRequests: { select: { id: true, status: true, createdAt: true } },
      },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (err) {
    console.error('Get request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/requests/:id/assign
 * Supervisor assigns a staff member to a request
 */
router.patch('/:id/assign', authorize('SUPERVISOR'), async (req, res) => {
  try {
    const { staffId } = req.body;

    if (!staffId) {
      return res.status(400).json({ error: 'staffId is required' });
    }

    const request = await prisma.cleaningRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.blockId !== req.user.blockId) {
      return res.status(403).json({ error: 'Request is not in your block' });
    }

    if (request.status !== 'PENDING' && request.status !== 'ASSIGNED') {
      return res.status(400).json({ error: `Cannot assign request in ${request.status} status` });
    }

    // Verify staff exists and is in same block
    const staff = await prisma.user.findFirst({
      where: { id: staffId, role: 'STAFF', blockId: req.user.blockId },
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found in your block' });
    }

    const updated = await prisma.cleaningRequest.update({
      where: { id: req.params.id },
      data: {
        assignedStaffId: staffId,
        assignedAt: new Date(),
        status: 'ASSIGNED',
      },
      include: {
        student: { select: { name: true, regNo: true } },
        block: { select: { name: true } },
        assignedStaff: { select: { name: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Assign request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/requests/:id/start
 * Staff marks request as in-progress
 */
router.patch('/:id/start', authorize('STAFF'), async (req, res) => {
  try {
    const request = await prisma.cleaningRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.assignedStaffId !== req.user.id) {
      return res.status(403).json({ error: 'This request is not assigned to you' });
    }

    if (request.status !== 'ASSIGNED') {
      return res.status(400).json({ error: `Cannot start request in ${request.status} status` });
    }

    const updated = await prisma.cleaningRequest.update({
      where: { id: req.params.id },
      data: { status: 'IN_PROGRESS' },
      include: {
        student: { select: { name: true, regNo: true } },
        block: { select: { name: true } },
        assignedStaff: { select: { name: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Start request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/requests/:id/complete
 * Staff marks request as completed
 */
router.patch('/:id/complete', authorize('STAFF'), async (req, res) => {
  try {
    const request = await prisma.cleaningRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.assignedStaffId !== req.user.id) {
      return res.status(403).json({ error: 'This request is not assigned to you' });
    }

    if (!['ASSIGNED', 'IN_PROGRESS'].includes(request.status)) {
      return res.status(400).json({ error: `Cannot complete request in ${request.status} status` });
    }

    const updated = await prisma.cleaningRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        resolutionType: 'COMPLETED',
        resolvedAt: new Date(),
      },
      include: {
        student: { select: { name: true, regNo: true } },
        block: { select: { name: true } },
        assignedStaff: { select: { name: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Complete request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/requests/:id/fail
 * Staff marks request as failed with reason and optional photo
 */
router.patch('/:id/fail', authorize('STAFF'), async (req, res) => {
  try {
    const { resolutionNote, resolutionPhotoUrl } = req.body;

    if (!resolutionNote) {
      return res.status(400).json({ error: 'Reason (resolutionNote) is required' });
    }

    const request = await prisma.cleaningRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.assignedStaffId !== req.user.id) {
      return res.status(403).json({ error: 'This request is not assigned to you' });
    }

    if (!['ASSIGNED', 'IN_PROGRESS'].includes(request.status)) {
      return res.status(400).json({ error: `Cannot fail request in ${request.status} status` });
    }

    const updated = await prisma.cleaningRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'FAILED',
        resolutionType: 'FAILED',
        resolutionNote,
        resolutionPhotoUrl: resolutionPhotoUrl || null,
        resolvedAt: new Date(),
      },
      include: {
        student: { select: { name: true, regNo: true } },
        block: { select: { name: true } },
        assignedStaff: { select: { name: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Fail request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/requests/:id/close
 * Student confirms cleaning is done
 */
router.patch('/:id/close', authorize('STUDENT'), async (req, res) => {
  try {
    const request = await prisma.cleaningRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.studentId !== req.user.id) {
      return res.status(403).json({ error: 'This is not your request' });
    }

    if (request.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only close a completed request' });
    }

    const updated = await prisma.cleaningRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'CLOSED',
        studentConfirmedAt: new Date(),
      },
      include: {
        student: { select: { name: true, regNo: true } },
        block: { select: { name: true } },
        assignedStaff: { select: { name: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Close request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/requests/:id/reraise
 * Student re-raises a failed request as a new PENDING request
 */
router.post('/:id/reraise', authorize('STUDENT'), async (req, res) => {
  try {
    const original = await prisma.cleaningRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!original) {
      return res.status(404).json({ error: 'Original request not found' });
    }

    if (original.studentId !== req.user.id) {
      return res.status(403).json({ error: 'This is not your request' });
    }

    if (original.status !== 'FAILED') {
      return res.status(400).json({ error: 'Can only re-raise a failed request' });
    }

    const newRequest = await prisma.cleaningRequest.create({
      data: {
        studentId: req.user.id,
        blockId: original.blockId,
        roomNo: original.roomNo,
        cleaningType: original.cleaningType,
        comment: req.body.comment || original.comment,
        status: 'PENDING',
        parentRequestId: original.id,
      },
      include: {
        student: { select: { name: true, regNo: true } },
        block: { select: { name: true } },
        assignedStaff: { select: { name: true } },
      },
    });

    res.status(201).json(newRequest);
  } catch (err) {
    console.error('Re-raise request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
