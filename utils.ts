
export const parseNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  
  // Convert to string, replace comma with dot, and parse
  const sanitized = String(value).replace(',', '.');
  const parsed = parseFloat(sanitized);
  
  return isNaN(parsed) ? 0 : parsed;
};
