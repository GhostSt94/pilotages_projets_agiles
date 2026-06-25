const {
  computeCapacityBreakdown,
  eachDay,
  toUtcMidnight,
  clampRange,
} = require('../capacityService');

// Repères : 2025-06-02 = lundi … 2025-06-06 = vendredi, 07-08 = week-end.
const SPRINT = { _id: 's1', name: 'Sprint test', status: 'active', startDate: '2025-06-02', endDate: '2025-06-06' };

function member(over = {}) {
  return {
    _id: 'u1',
    name: 'Dev Un',
    email: 'u1@test.ma',
    role: 'developer',
    dailyCapacityHours: 6,
    workingDays: [1, 2, 3, 4, 5],
    ...over,
  };
}

describe('helpers de dates', () => {
  test('toUtcMidnight normalise à minuit UTC', () => {
    const d = toUtcMidnight('2025-06-02T15:30:00.000Z');
    expect(d.toISOString()).toBe('2025-06-02T00:00:00.000Z');
  });

  test('eachDay énumère les jours bornes incluses', () => {
    const days = eachDay('2025-06-02', '2025-06-06');
    expect(days).toHaveLength(5);
    expect(days[0].toISOString().slice(0, 10)).toBe('2025-06-02');
    expect(days[4].toISOString().slice(0, 10)).toBe('2025-06-06');
  });

  test('clampRange renvoie l’intersection, ou null sans chevauchement', () => {
    const a = toUtcMidnight('2025-06-01');
    const b = toUtcMidnight('2025-06-10');
    const c = toUtcMidnight('2025-06-05');
    const d = toUtcMidnight('2025-06-20');
    expect(clampRange(a, b, c, d)).toEqual({ start: c, end: b });
    const far = toUtcMidnight('2025-07-01');
    expect(clampRange(a, b, far, d)).toBeNull();
  });
});

describe('computeCapacityBreakdown', () => {
  test('capacité de base : 5 jours ouvrés × 6 h = 30 h', () => {
    const r = computeCapacityBreakdown({ sprint: SPRINT, members: [member()], leaves: [], tasks: [] });
    expect(r.availableCapacityHours).toBe(30);
    expect(r.members[0].workingDays).toBe(5);
    expect(r.members[0].availableDays).toBe(5);
    expect(r.committedHours).toBe(0);
    expect(r.overload).toBe(false);
  });

  test('charge engagée, utilisation et reste', () => {
    const r = computeCapacityBreakdown({
      sprint: SPRINT,
      members: [member()],
      leaves: [],
      tasks: [{ estimate: 12 }, { estimate: 8 }],
    });
    expect(r.committedHours).toBe(20);
    expect(r.remainingHours).toBe(10);
    expect(r.utilizationRate).toBe(67); // round(20/30*100)
    expect(r.taskCount).toBe(2);
  });

  test('surcharge quand la charge dépasse la capacité', () => {
    const r = computeCapacityBreakdown({
      sprint: SPRINT,
      members: [member()],
      leaves: [],
      tasks: [{ estimate: 40 }],
    });
    expect(r.overload).toBe(true);
    expect(r.overloadHours).toBe(10);
  });

  test('un congé approuvé réduit les jours disponibles', () => {
    const leaves = [{ _id: 'l1', user: 'u1', type: 'vacation', status: 'approved', startDate: '2025-06-02', endDate: '2025-06-03' }];
    const r = computeCapacityBreakdown({ sprint: SPRINT, members: [member()], leaves, tasks: [] });
    expect(r.members[0].leaveDays).toBe(2);
    expect(r.members[0].availableDays).toBe(3);
    expect(r.availableCapacityHours).toBe(18); // 3 × 6
  });

  test('deux congés qui se chevauchent ne comptent pas deux fois', () => {
    const leaves = [
      { _id: 'l1', user: 'u1', type: 'vacation', status: 'approved', startDate: '2025-06-02', endDate: '2025-06-03' },
      { _id: 'l2', user: 'u1', type: 'sick', status: 'approved', startDate: '2025-06-03', endDate: '2025-06-04' },
    ];
    const r = computeCapacityBreakdown({ sprint: SPRINT, members: [member()], leaves, tasks: [] });
    expect(r.members[0].leaveDays).toBe(3); // lun, mar, mer — pas 4
    expect(r.members[0].availableDays).toBe(2);
  });

  test('chevauchement partiel : seuls les jours ouvrés dans le sprint comptent', () => {
    // Congé du ven. 30/05 au mar. 03/06 : seuls lun 02 et mar 03 sont dans le sprint.
    const leaves = [{ _id: 'l1', user: 'u1', type: 'vacation', status: 'approved', startDate: '2025-05-30', endDate: '2025-06-03' }];
    const r = computeCapacityBreakdown({ sprint: SPRINT, members: [member()], leaves, tasks: [] });
    expect(r.members[0].leaveDays).toBe(2);
    expect(r.members[0].availableDays).toBe(3);
  });

  test('les week-ends ne sont pas comptés comme jours ouvrés', () => {
    const sprint = { ...SPRINT, endDate: '2025-06-08' }; // lun → dim
    const r = computeCapacityBreakdown({ sprint, members: [member()], leaves: [], tasks: [] });
    expect(r.members[0].workingDays).toBe(5); // samedi/dimanche exclus
  });

  test('les congés non approuvés (pending/rejected) sont ignorés', () => {
    const leaves = [
      { _id: 'l1', user: 'u1', type: 'vacation', status: 'pending', startDate: '2025-06-02', endDate: '2025-06-03' },
      { _id: 'l2', user: 'u1', type: 'vacation', status: 'rejected', startDate: '2025-06-04', endDate: '2025-06-05' },
    ];
    const r = computeCapacityBreakdown({ sprint: SPRINT, members: [member()], leaves, tasks: [] });
    expect(r.members[0].leaveDays).toBe(0);
    expect(r.availableCapacityHours).toBe(30);
  });

  test('workingDays personnalisés (4 jours/sem) pris en compte', () => {
    const r = computeCapacityBreakdown({ sprint: SPRINT, members: [member({ workingDays: [1, 2, 3, 4] })], leaves: [], tasks: [] });
    expect(r.members[0].workingDays).toBe(4); // vendredi non travaillé
    expect(r.availableCapacityHours).toBe(24);
  });

  test('capacité nulle → utilizationRate null (pas de division par zéro)', () => {
    const r = computeCapacityBreakdown({ sprint: SPRINT, members: [], leaves: [], tasks: [{ estimate: 5 }] });
    expect(r.availableCapacityHours).toBe(0);
    expect(r.utilizationRate).toBeNull();
    expect(r.overload).toBe(true);
  });

  test('somme sur plusieurs membres', () => {
    const members = [member({ _id: 'u1', dailyCapacityHours: 6 }), member({ _id: 'u2', dailyCapacityHours: 4 })];
    const r = computeCapacityBreakdown({ sprint: SPRINT, members, leaves: [], tasks: [] });
    expect(r.availableCapacityHours).toBe(50); // 30 + 20
    expect(r.members).toHaveLength(2);
  });
});
