const { Leave } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { hasPermission } = require('../utils/authz');
const { notify, usersWithPermission } = require('../services/notificationService');
const { wantsPagination, parsePageParams, paginated } = require('../utils/pagination');

// Format court d'une période (ex. « 02/06 → 06/06 »).
function shortRange(start, end) {
  const f = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  return `${f(start)} → ${f(end)}`;
}

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

  // Demande en attente : prévenir les valideurs.
  if (!autoApprove) {
    const reviewers = await usersWithPermission('leave.review');
    await notify({
      users: reviewers,
      type: 'leave_requested',
      title: 'Nouvelle demande de congé',
      body: `${req.user.name} a demandé un congé (${shortRange(startDate, endDate)}).`,
      link: '/leaves',
      exclude: req.user._id,
    });
  }

  res.status(201).json(leave);
});

// GET /leaves — developer : ses congés ; manager/admin : tout, filtrable ?user=&status=.
// Pagination opt-in : avec ?page= renvoie une enveloppe { items, total, … } ;
// sans ?page= renvoie le tableau complet (utilisé par le calendrier d'équipe).
const listLeaves = asyncHandler(async (req, res) => {
  const filter = {};
  if (hasPermission(req, 'leave.review')) {
    if (req.query.user) filter.user = req.query.user;
  } else {
    filter.user = req.user._id;
  }
  if (req.query.status) filter.status = req.query.status;

  const query = () =>
    Leave.find(filter)
      .populate('user', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ startDate: -1 });

  if (wantsPagination(req)) {
    const { page, pageSize, skip } = parsePageParams(req, { defaultLimit: 5 });
    const [items, total] = await Promise.all([
      query().skip(skip).limit(pageSize),
      Leave.countDocuments(filter),
    ]);
    return res.json(paginated(items, total, page, pageSize));
  }

  const leaves = await query();
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

  // Prévenir le demandeur de la décision (sauf s'il se valide lui-même).
  await notify({
    users: [leave.user],
    type: nextStatus === 'approved' ? 'leave_approved' : 'leave_rejected',
    title: nextStatus === 'approved' ? 'Congé approuvé' : 'Congé refusé',
    body: `Votre congé du ${shortRange(leave.startDate, leave.endDate)} a été ${nextStatus === 'approved' ? 'approuvé' : 'refusé'} par ${req.user.name}.`,
    link: '/leaves',
    exclude: req.user._id,
  });

  res.json(leave);
}

// PATCH /leaves/:id/approve  (manager/admin)
const approveLeave = asyncHandler((req, res) => review(req, res, 'approved'));

// PATCH /leaves/:id/reject  (manager/admin)
const rejectLeave = asyncHandler((req, res) => review(req, res, 'rejected'));

module.exports = { createLeave, listLeaves, approveLeave, rejectLeave };
