const { Notification } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /notifications?page=&limit=&unread=  — mes notifications (paginées) + compteur non lues.
const listNotifications = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.read = false;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);

  res.json({ items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)), unreadCount });
});

// GET /notifications/count — nombre de notifications non lues (pour la pastille).
const getUnreadCount = asyncHandler(async (req, res) => {
  const unread = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ unread });
});

// PATCH /notifications/:id/read — marquer une notification comme lue.
const markRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notif) throw ApiError.notFound('Notification introuvable.');
  notif.read = true;
  await notif.save();
  res.json(notif);
});

// PATCH /notifications/read-all — tout marquer comme lu.
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
  res.json({ ok: true });
});

module.exports = { listNotifications, getUnreadCount, markRead, markAllRead };
