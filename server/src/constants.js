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

export const PHOTO_LABELS = ['ASPECT', 'PACKAGING', 'ETIQUETTE'];

export const PHOTO_LABEL_TEXT = {
  ASPECT: 'Aspect du produit',
  PACKAGING: 'Packaging',
  ETIQUETTE: 'Étiquette'
};

// Sensory grid — 12 descriptors across 5 modalities, as defined by R&D.
export const GRILLE = [
  { k: 'couleur', mod: 'Aspect', label: 'Intensité de couleur' },
  { k: 'homog', mod: 'Aspect', label: 'Homogénéité / brillance' },
  { k: 'odeur', mod: 'Odeur', label: 'Intensité olfactive' },
  { k: 'fermete', mod: 'Texture', label: 'Fermeté' },
  { k: 'fondant', mod: 'Texture', label: 'Fondant / onctuosité' },
  { k: 'sucre', mod: 'Goût', label: 'Sucré' },
  { k: 'sale', mod: 'Goût', label: 'Salé' },
  { k: 'acide', mod: 'Goût', label: 'Acide' },
  { k: 'amer', mod: 'Goût', label: 'Amer' },
  { k: 'arome', mod: 'Arôme', label: 'Intensité aromatique' },
  { k: 'persist', mod: 'Finale', label: 'Persistance' },
  { k: 'arriere', mod: 'Finale', label: 'Arrière-goût indésirable' }
];

export const AXES = [
  { k: 'couleur', label: 'Couleur' },
  { k: 'odeur', label: 'Odeur' },
  { k: 'fondant', label: 'Fondant' },
  { k: 'sucre', label: 'Sucré' },
  { k: 'arome', label: 'Arôme' },
  { k: 'persist', label: 'Persist.' }
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

export const JAR_AXES = [
  { k: 'sucre', label: 'Sucré' },
  { k: 'fermete', label: 'Fermeté' }
];

export const JAR_OPTIONS = ['Trop peu', 'Un peu trop peu', 'Juste bien', 'Un peu trop', 'Beaucoup trop'];
