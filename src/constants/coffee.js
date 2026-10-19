export const USUAL_VARIETIES = [
  { id: 'arabica', es: 'Arábica', en: 'Arabica' },
  { id: 'robusta', es: 'Robusta', en: 'Robusta' },
  { id: 'liberica', es: 'Libérica', en: 'Liberica' },
  { id: 'excelsa', es: 'Excelsa', en: 'Excelsa' }
];

export const SUGGESTED_VARIETIES_DATALIST = [
  'Arábica',
  'Arabica',
  'Robusta',
  'Libérica',
  'Liberica',
  'Excelsa',
  'Bourbon',
  'Geisha',
  'Pink Bourbon',
  'Caturra',
  'Castillo',
  'Typica',
  'SL28',
  'SL34',
  'Pacamara',
  'Ethiopian Heirloom',
  'Catuaí',
  'Sidra',
  'Wush Wush',
  'Java',
  'Maragogype'
];

export const USUAL_PROCESSES = [
  { id: 'natural', es: 'Natural', en: 'Natural' },
  { id: 'washed', es: 'Lavado', en: 'Washed' },
  { id: 'honey', es: 'Honey', en: 'Honey' },
  { id: 'anaerobic', es: 'Anaeróbico', en: 'Anaerobic' },
  { id: 'carbonic', es: 'Maceración Carbónica', en: 'Carbonic Maceration' },
  { id: 'koji', es: 'Koji', en: 'Koji' }
];

export const SUGGESTED_PROCESSES_DATALIST = [
  'Natural',
  'Lavado',
  'Washed',
  'Honey',
  'Anaeróbico',
  'Anaerobic',
  'Maceración Carbónica',
  'Carbonic Maceration',
  'Koji',
  'Láctico',
  'Lactic',
  'Thermal Shock',
  'Doble Fermentación',
  'Double Fermentation',
  'Yeast Fermentation',
  'White Honey',
  'Yellow Honey',
  'Red Honey',
  'Black Honey'
];

export const COFFEE_METHODS = [
  { id: 'Espresso', es: 'Espresso', en: 'Espresso' },
  { id: 'Moka', es: 'Moka', en: 'Moka' },
  { id: 'Filtro', es: 'Filtro', en: 'Filter' },
  { id: 'Aeropress', es: 'Aeropress', en: 'Aeropress' },
  { id: 'Prensa Francesa', es: 'Prensa Francesa', en: 'French Press' },
  { id: 'Cold Brew', es: 'Cold Brew', en: 'Cold Brew' }
];

export const POPULAR_COUNTRIES = [
  'Colombia',
  'Etiopía',
  'Kenia',
  'Guatemala',
  'Costa Rica',
  'Brasil',
  'Panamá',
  'Perú'
];

export const SUGGESTED_FLAVORS = [
  'Floral',
  'Frutal',
  'Cítrico',
  'Chocolate',
  'Caramelo',
  'Frutos Rojos',
  'Jazmín',
  'Melocotón',
  'Nuez',
  'Miel',
  'Especiado',
  'Vainilla'
];

/**
 * Checks if a given value matches a localized option (either es, en, or id)
 */
export const isOptionSelected = (currentVal, option) => {
  if (!currentVal || !option) return false;
  const normalized = String(currentVal).trim().toLowerCase();
  return (
    normalized === option.es.toLowerCase() ||
    normalized === option.en.toLowerCase() ||
    normalized === option.id.toLowerCase()
  );
};
