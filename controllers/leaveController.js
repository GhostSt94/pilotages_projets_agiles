const { Leave } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { hasPermission } = require('../utils/authz');

// POST /leaves — déclaration par tout utilisateur authentifié (pour lui-même).
const createLeave = asyncHandler(async (req, res) => {
  const { type, startDate, endDate, reason, user } = req.body;

  if (new Date(endDate) < new Date(startDate)) {
    throw ApiError.badRequest('La date de fin doit être postérieure à la date de début.');
  }

  // Seuls manager/admin peuvent déclarer un congé pour quelqu'un d'autre.
  let targetUser = req.user._id;
  if (user && String(user) !== String(req.user._id)) {
    if (!hasPermission(req, 'leave.review')) {
      throw ApiError.forbidden('Vous ne pouvez déclarer un congé que pour vous-même.');
    }
    targetUser = user;
  }

  // Un utilisateur pouvant valider les congés (leave.review) insère directement
  // un congé approuvé ; les autres créent une demande à valider.
  const autoApprove = hasPermission(req, 'leave.review');

  const leave = await Leave.create({
    user: targetUser,
    type,
    startDate,
    endDate,
    reason,
    status: autoApprove ? 'approved' : 'pending',
    ...(autoApprove ? { reviewedBy: req.user._id, reviewedAt: new Date() } : {}),
  });
  res.status(201).json(leave);
});

// GET /leaves — developer : ses congés ; manager/admin : tout, filtrable ?user=&status=.
const listLeaves = asyncHandler(async (req, res) => {
  const filter = {};
  if (hasPermission(req, 'leave.review')) {
    if (req.query.user) filter.user = req.query.user;
    if (req.query.status) filter.status = req.query.status;
  } else {
    filter.user = req.user._id;
    if (req.query.status) filter.status = req.query.status;
  }

  const leaves = await Leave.find(filter)
    .populate('user', 'name email')
    .populate('reviewedBy', 'name email')
    .sort({ startDate: -1 });
  res.json(leaves);
});

// Transition d'état d'un congé.
async function review(req, res, nextStatus) {
  const leave = await Leave.findById(req.params.id);
  if (!leave) throw ApiError.notFound('Congé introuvable.');

  if (leave.status !== 'pending') {
    throw ApiError.badRequest(`Ce congé a déjà été traité (statut : ${leave.status}).`);
  }

  leave.status = nextStatus;
  leave.reviewedBy = req.user._id;
  leave.reviewedAt = new Date();
  await leave.save();
  res.json(leave);
}

// PATCH /leaves/:id/approve  (manager/admin)
const approveLeave = asyncHandler((req, res) => review(req, res, 'approved'));

// PATCH /leaves/:id/reject  (manager/admin)
const rejectLeave = asyncHandler((req, res) => review(req, res, 'rejected'));

module.exports = { createLeave, listLeaves, approveLeave, rejectLeave };
