const { ActivityLog } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, parsePageParams, paginated } = require('../utils/pagination');

// GET /activity — journal d'audit paginé (activity.view).
// Filtres : ?type= (entityType), ?q= (résumé), ?project=, ?actor=, ?from=, ?to=.
const listActivity = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.type) filter.entityType = req.query.type;
  if (req.query.project) filter.project = req.query.project;
  if (req.query.actor) filter.actor = req.query.actor;
  if (req.query.q && req.query.q.trim()) {
    filter.summary = new RegExp(escapeRegex(req.query.q.trim()), 'i');
  }

  // Plage de dates sur createdAt (`to` borné à la fin de journée).
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) {
      const to = new Date(req.query.to);
      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
  }

  const { page, pageSize, skip } = parsePageParams(req, { defaultLimit: 15 });
  const [items, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('actor', 'name email')
      .populate('project', 'name key')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
    ActivityLog.countDocuments(filter),
  ]);

  res.json(paginated(items, total, page, pageSize));
});

module.exports = { listActivity };
