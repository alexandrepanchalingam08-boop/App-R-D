export function serializeSession(s) {
  return {
    id: s.id,
    kind: s.kind,
    name: s.name,
    project: s.project,
    supplier: s.supplier,
    frPassed: s.frPassed,
    comiteDate: s.comiteDate,
    prixVenteResto: s.prixVenteResto || '',
    prixVenteUber: s.prixVenteUber || '',
    prixVenteUnite: s.prixVenteUnite || '',
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
    procede: v.procede || '',
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

export function serializeFoodTour(ft) {
  return {
    id: ft.id,
    lieu: ft.lieu,
    date: ft.date,
    createdAt: ft.createdAt,
    enseignes: (ft.enseignes || []).map(serializeEnseigne)
  };
}

export function serializeEnseigne(e) {
  return {
    id: e.id,
    foodTourId: e.foodTourId,
    name: e.name,
    keyLearnings: e.keyLearnings || '',
    createdAt: e.createdAt,
    photos: (e.photos || []).map(serializeEnseignePhoto),
    products: (e.products || []).map(serializeProduct)
  };
}

export function serializeEnseignePhoto(p) {
  return { id: p.id, enseigneId: p.enseigneId, url: p.url, label: p.label, createdAt: p.createdAt };
}

export function serializeProduct(p) {
  return {
    id: p.id,
    enseigneId: p.enseigneId,
    name: p.name,
    comment: p.comment || '',
    createdAt: p.createdAt,
    photos: (p.photos || []).map((ph) => ({ id: ph.id, productId: ph.productId, url: ph.url, createdAt: ph.createdAt }))
  };
}

export const foodTourInclude = {
  enseignes: {
    orderBy: { order: 'asc' },
    include: {
      photos: { orderBy: { createdAt: 'asc' } },
      products: {
        orderBy: { order: 'asc' },
        include: { photos: { orderBy: { createdAt: 'asc' } } }
      }
    }
  }
};
