export const formatPrice = (price: number | { duration: number; unit: string; price: number }[]) => {
  if (typeof price === 'number') {
    return `$${Number(price).toFixed(2)}`;
  }

  if (!Array.isArray(price) || price.length === 0) {
    return '$0.00';
  }

  return price.map(({ duration, unit, price: amount }) => 
    `${duration} ${unit} - $${Number(amount).toFixed(2)}`
  ).join(', ');
};