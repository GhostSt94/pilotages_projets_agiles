const { Sprint, Project, Task, Leave } = require('../models');
const ApiError = require('../utils/ApiError');

// --- Helpers de dates (en UTC pour éviter les décalages de fuseau) ---

// Normalise une date à minuit UTC.
function toUtcMidnight(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Clé jour stable pour dédoublonner ("YYYY-MM-DD").
function dayKey(date) {
  return toUtcMidnight(date).toISOString().slice(0, 10);
}

// Itère chaque jour calendaire de [start, end] inclus.
function eachDay(start, end) {
  const days = [];
  const cur = toUtcMidnight(start);
  const last = toUtcMidnight(end);
  while (cur <= last) {
    days.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

// Intersection [start, end] de deux intervalles, ou null si pas de chevauchement.
function clampRange(aStart, aEnd, bStart, bEnd) {
  const start = aStart > bStart ? aStart : bStart;
  const end = aEnd < bEnd ? aEnd : bEnd;
  if (start > end) return null;
  return { start, end };
}

/**
 * Cœur de calcul **pur** de la capacité d'un sprint (sans accès base de données).
 * Toute l'arithmétique métier sensible est ici pour être testable en isolation.
 *
 * @param {object}   params
 * @param {object}   params.sprint   { _id?, name?, status?, startDate, endDate }
 * @param {object[]} params.members  [{ _id, name, email, role, dailyCapacityHours, workingDays }]
 * @param {object[]} params.leaves   congés [{ _id, user|user._id, type, startDate, endDate, status }]
 *                                    (filtrés ici sur `approved` + chevauchement du sprint)
 * @param {object[]} params.tasks    tâches du sprint [{ estimate }]
 * @returns {object} détail complet de la capacité.
 */
function computeCapacityBreakdown({ sprint, members = [], leaves = [], tasks = [] }) {
  const sprintStart = toUtcMidnight(sprint.startDate);
  const sprintEnd = toUtcMidnight(sprint.endDate);
  const sprintDays = eachDay(sprintStart, sprintEnd);

  // Congés approuvés chevauchant la période, regroupés par utilisateur.
  const leavesByUser = new Map();
  for (const leave of leaves) {
    if (leave.status !== 'approved') continue;
    const ls = toUtcMidnight(leave.startDate);
    const le = toUtcMidnight(leave.endDate);
    if (ls > sprintEnd || le < sprintStart) continue; // pas de chevauchement
    const key = String(leave.user?._id || leave.user);
    if (!leavesByUser.has(key)) leavesByUser.set(key, []);
    leavesByUser.get(key).push(leave);
  }

  const memberDetails = members.map((member) => {
    const workingDays = member.workingDays && member.workingDays.length
      ? member.workingDays
      : [1, 2, 3, 4, 5];

    // Ensemble des jours ouvrés du membre dans le sprint.
    const workingDayKeys = new Set();
    for (const day of sprintDays) {
      if (workingDays.includes(day.getUTCDay())) {
        workingDayKeys.add(dayKey(day));
      }
    }
    const workingDayCount = workingDayKeys.size;

    // Jours de congé (ouvrés) couverts, dédoublonnés en cas de congés se chevauchant.
    const offDayKeys = new Set();
    const memberLeaves = leavesByUser.get(String(member._id)) || [];
    const absences = [];
    for (const leave of memberLeaves) {
      const overlap = clampRange(
        toUtcMidnight(leave.startDate),
        toUtcMidnight(leave.endDate),
        sprintStart,
        sprintEnd
      );
      if (!overlap) continue;
      let leaveWorkingDays = 0;
      for (const day of eachDay(overlap.start, overlap.end)) {
        const k = dayKey(day);
        if (workingDayKeys.has(k) && !offDayKeys.has(k)) {
          offDayKeys.add(k);
          leaveWorkingDays += 1;
        }
      }
      absences.push({
        leaveId: leave._id,
        type: leave.type,
        startDate: leave.startDate,
        endDate: leave.endDate,
        workingDaysOff: leaveWorkingDays,
      });
    }

    const leaveDays = offDayKeys.size;
    const availableDays = Math.max(0, workingDayCount - leaveDays);
    const availableHours = availableDays * (member.dailyCapacityHours || 0);

    return {
      user: {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        dailyCapacityHours: member.dailyCapacityHours,
      },
      workingDays: workingDayCount,
      leaveDays,
      availableDays,
      availableHours,
      absences,
    };
  });

  const availableCapacityHours = memberDetails.reduce((sum, m) => sum + m.availableHours, 0);
  const committedHours = tasks.reduce((sum, t) => sum + (t.estimate || 0), 0);

  const overload = committedHours > availableCapacityHours;
  const utilizationRate = availableCapacityHours > 0
    ? Math.round((committedHours / availableCapacityHours) * 100)
    : null;

  return {
    sprint: {
      _id: sprint._id,
      name: sprint.name,
      status: sprint.status,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
    },
    unit: 'hours',
    availableCapacityHours,
    committedHours,
    remainingHours: availableCapacityHours - committedHours,
    utilizationRate, // en %
    overload,
    overloadHours: overload ? committedHours - availableCapacityHours : 0,
    taskCount: tasks.length,
    members: memberDetails,
  };
}

/**
 * Calcule la capacité d'un sprint : charge les données puis délègue à
 * `computeCapacityBreakdown`. Pour chaque membre du projet, sur la période :
 *   - jours travaillés (selon workingDays)
 *   - moins les jours couverts par ses congés approuvés chevauchant le sprint
 *   => jours disponibles × dailyCapacityHours = capacité du membre.
 *
 * @returns {Promise<object>} détail complet de la capacité.
 */
async function computeSprintCapacity(sprintId) {
  const sprint = await Sprint.findById(sprintId);
  if (!sprint) throw ApiError.notFound('Sprint introuvable.');

  const project = await Project.findById(sprint.project).populate(
    'members',
    'name email role dailyCapacityHours workingDays'
  );
  if (!project) throw ApiError.notFound('Projet du sprint introuvable.');

  const sprintStart = toUtcMidnight(sprint.startDate);
  const sprintEnd = toUtcMidnight(sprint.endDate);

  const members = project.members || [];
  const memberIds = members.map((m) => m._id);

  // Congés approuvés des membres chevauchant la période du sprint.
  const leaves = await Leave.find({
    user: { $in: memberIds },
    status: 'approved',
    startDate: { $lte: sprintEnd },
    endDate: { $gte: sprintStart },
  }).populate('user', 'name');

  // Charge engagée : tâches du sprint (estimations).
  const tasks = await Task.find({ sprint: sprint._id }).select('estimate status');

  return computeCapacityBreakdown({ sprint, members, leaves, tasks });
}

module.exports = {
  computeSprintCapacity,
  // exportés pour réutilisation/tests
  computeCapacityBreakdown,
  eachDay,
  toUtcMidnight,
  clampRange,
};
