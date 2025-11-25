/**
 * Address normalization utilities for consistent geocoding cache lookups
 */

// Common Australian address abbreviations and their full forms
const ADDRESS_ABBREVIATIONS: Record<string, string> = {
  'st': 'street',
  'str': 'street',
  'rd': 'road',
  'ave': 'avenue',
  'av': 'avenue',
  'dr': 'drive',
  'ct': 'court',
  'crt': 'court',
  'pl': 'place',
  'ln': 'lane',
  'way': 'way',
  'tce': 'terrace',
  'ter': 'terrace',
  'pde': 'parade',
  'cres': 'crescent',
  'cl': 'close',
  'gr': 'grove',
  'gdn': 'garden',
  'gdns': 'gardens',
  'sq': 'square',
  'hwy': 'highway',
  'hway': 'highway',
  'nth': 'north',
  'sth': 'south',
  'e': 'east',
  'w': 'west',
};

/**
 * Normalizes an address string for consistent cache lookups
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes extra spaces
 * - Standardizes common abbreviations
 * - Removes punctuation that doesn't affect geocoding
 * 
 * @param address - The address string to normalize
 * @returns Normalized address string
 */
export function normalizeAddress(address: string): string {
  if (!address) return '';

  let normalized = address
    .toLowerCase()
    .trim()
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Remove common punctuation that doesn't affect geocoding
    .replace(/[.,;:]/g, '')
    // Remove leading/trailing spaces after punctuation removal
    .trim();

  // Split into words to normalize abbreviations
  const words = normalized.split(' ');
  const normalizedWords = words.map(word => {
    // Remove trailing periods from abbreviations
    const cleanWord = word.replace(/\.$/, '');
    // Check if it's a known abbreviation
    return ADDRESS_ABBREVIATIONS[cleanWord] || cleanWord;
  });

  normalized = normalizedWords.join(' ');

  // Final cleanup: remove any remaining extra spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Creates a cache key from an address
 * This is a simple wrapper around normalizeAddress for clarity
 * 
 * @param address - The address string
 * @returns Normalized address suitable for use as a cache key
 */
export function getCacheKey(address: string): string {
  return normalizeAddress(address);
}

