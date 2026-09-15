export function serializeSession(s) {
  return {
    id: s.id,
    kind: s.kind,
    name: s.name,
    project: s.project,
    supplier: s.supplier,
    frPassed: s.frPassed,
    comiteDate: s.comiteDate,
    buyerId: s.buyerId,
    buyer: s.buyer
      ? { id: s.buyer.id, firstName: s.buyer.firstName, lastName: s.buyer.lastName, pole: s.buyer.pole }
      : null,
    createdAt: s.createdAt,
    versions: (s.versions || []).map(serializeVersion),
    photos: (s.photos || []).map(serializePhoto),
    price: s.price ? serializePrice(s.price) : null
  };
}

export function serializeVersion(v) {
  return {
    id: v.id,
    sessionId: v.sessionId,
    ver: v.ver,
    code: v.code,
    date: v.date,
    closed: v.closed,
    ingredients: JSON.parse(v.ingredients || '[]'),
    composition: (v.composition || [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((c) => ({
        id: c.id,
        name: c.name,
        dose: c.dose,
        unit: c.unit,
        refSessionId: c.refSessionId
      })),
    grades: (v.grades || []).map(serializeGrade)
  };
}

export function serializeGrade(g) {
  return {
    id: g.id,
    versionId: g.versionId,
    tasterName: g.tasterName,
    submittedById: g.submittedById,
    hedonicRaw: g.hedonicRaw,
    note: g.note,
    profile: JSON.parse(g.profile || '{}'),
    jar: JSON.parse(g.jar || '{}'),
    comment: g.comment,
    createdAt: g.createdAt
  };
}

export function serializePhoto(p) {
  return {
    id: p.id,
    sessionId: p.sessionId,
    url: p.url,
    label: p.label,
    uploadedById: p.uploadedById,
    createdAt: p.createdAt
  };
}

export function serializePrice(p) {
  return {
    id: p.id,
    sessionId: p.sessionId,
    amount: p.amount,
    dose: p.dose,
    unit: p.unit,
    date: p.date,
    byUserId: p.byUserId,
    updatedAt: p.updatedAt
  };
}

export const sessionInclude = {
  buyer: true,
  price: true,
  photos: { orderBy: { createdAt: 'desc' } },
  versions: {
    orderBy: { createdAt: 'asc' },
    include: {
      composition: true,
      grades: { orderBy: { createdAt: 'asc' } }
    }
  }
};
