/**
 * Utility functions for inventory calculations.
 */

/**
 * Calculates the dynamically remaining available quantity of an item
 * based on its total available stock and what is currently selected in request rows.
 *
 * @param {string|number} itemId - The ID of the item being requested.
 * @param {Array} availableItems - Array of all items fetched from the backend (must contain item_total_id and available_quantity).
 * @param {Array} requestRows - Array of current request row objects (must contain item_id and quantity).
 * @param {number} [currentIndex=-1] - The index of the current row being edited to exclude it from the calculation.
 * @returns {number} The remaining available quantity.
 */
export const calculateRemainingQuantity = (itemId, availableItems, requestRows, currentIndex = -1) => {
  const baseAvail = availableItems.find(i => i.item_total_id == itemId)?.available_quantity || 0;
  let otherSelected = 0;
  requestRows.forEach((row, i) => {
    if (row.item_id == itemId && i !== currentIndex) {
      otherSelected += parseInt(row.quantity) || 0;
    }
  });
  return baseAvail - otherSelected;
};
