export const POLES = ['RD', 'MARKETING', 'QUALITE', 'ACHATS'];

export const POLE_LABELS = {
  RD: 'R&D',
  MARKETING: 'Marketing',
  QUALITE: 'Qualité',
  ACHATS: 'Achats'
};

export const SESSION_KINDS = ['INGREDIENT', 'BENCHMARK', 'PRODUIT_COMPLET'];

export const KIND_META = {
  INGREDIENT: {
    label: 'Ingrédient',
    hint: "Un ingrédient évalué seul ou dans une base neutre — le nom est celui de l'ingrédient.",
    nameLabel: "Nom de l'ingrédient"
  },
  BENCHMARK: {
    label: 'Benchmark',
    hint: 'Un produit concurrent ou une référence marché servant de point de comparaison.',
    nameLabel: 'Nom du produit benchmark'
  },
  PRODUIT_COMPLET: {
    label: 'Produit complet',
    hint: 'Une recette finie du pôle, évaluée dans sa version en cours.',
    nameLabel: 'Nom du produit ou de la recette'
  }
};

export const UNITS = ['g', 'kg', 'ml', 'l', 'piece'];

// Benchmark : comment le prix de vente relevé a été observé.
export const PRIX_VENTE_UNITES = ['MENU', 'UNITE'];
export const PRIX_VENTE_UNITE_LABELS = { MENU: 'En menu', UNITE: 'À l’unité' };

export const PHOTO_LABELS = ['ASPECT', 'PACKAGING', 'ETIQUETTE'];

export const PHOTO_LABEL_TEXT = {
  ASPECT: 'Aspect du produit',
  PACKAGING: 'Packaging',
  ETIQUETTE: 'Étiquette'
};

// Food tour — section "Le lieu" : photos du lieu vs de la carte/menu.
export const ENSEIGNE_PHOTO_LABELS = ['LIEU', 'MENU'];
export const ENSEIGNE_PHOTO_LABEL_TEXT = { LIEU: 'Lieu', MENU: 'Carte / Menu' };

// Sensory grid — one slider per broad modality, as defined by R&D.
export const GRILLE = [
  { k: 'visuel', mod: 'Visuel', label: 'Visuel' },
  { k: 'odeur', mod: 'Odeur', label: 'Odeur' },
  { k: 'texture', mod: 'Texture', label: 'Texture' },
  { k: 'gout', mod: 'Goût', label: 'Goût' }
];

export const AXES = [
  { k: 'visuel', label: 'Visuel' },
  { k: 'odeur', label: 'Odeur' },
  { k: 'texture', label: 'Texture' },
  { k: 'gout', label: 'Goût' }
];

export const HED = {
  1: 'Déplaît extrêmement',
  2: 'Déplaît beaucoup',
  3: 'Déplaît modérément',
  4: 'Déplaît légèrement',
  5: 'Ni plaît ni déplaît',
  6: 'Plaît légèrement',
  7: 'Plaît modérément',
  8: 'Plaît beaucoup',
  9: 'Plaît extrêmement'
};
