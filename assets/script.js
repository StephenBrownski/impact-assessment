function WCCartObserver(callback) {

  if (typeof callback !== 'function') {
    throw new TypeError(
      'WCCartObserver requires a callback function.'
    );
  }

  if (
    !window.wp ||
    !window.wp.data ||
    typeof window.wp.data.select !== 'function' ||
    typeof window.wp.data.subscribe !== 'function' ||
    !window.wc ||
    !window.wc.wcBlocksData ||
    !window.wc.wcBlocksData.cartStore
  ) {
    return null;
  }

  const { select, subscribe } = window.wp.data;
  const { cartStore } = window.wc.wcBlocksData;

  const STORAGE_KEY = 'wc_cart_observer_snapshot';

  let hydrated = false;
  let previousItems = null;

  // ------------------------------------------------------------
  // Get current cart snapshot
  // ------------------------------------------------------------

  function getCartSnapshot() {
    const cart = select(cartStore).getCartData();

    if (!cart || !Array.isArray(cart.items)) {
      return new Map();
    }

    return new Map(
      cart.items.map((item) => [
        item.key,
        {
          key: item.key,
          quantity: Number(item.quantity),
          name: item.name || '',
          variation: item.variation || [],
          item
        }
      ])
    );
  }

  // ------------------------------------------------------------
  // Save snapshot across page reloads
  // ------------------------------------------------------------

  function saveSnapshot(snapshot) {
    console.log('in save snapshot');
    const data = {};

    snapshot.forEach((item, key) => {
      data[key] = {
        quantity: item.quantity
      };
    });

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );
  }

  // ------------------------------------------------------------
  // Load snapshot from previous page
  // ------------------------------------------------------------

  function loadSnapshot() {
    const stored = sessionStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return null;
    }

    console.log('in loadsnapshot');

    try {
      const data = JSON.parse(stored);
      const snapshot = new Map();

      Object.entries(data).forEach(([key, value]) => {
        snapshot.set(key, {
          key,
          quantity: Number(value.quantity)
        });
      });

      return snapshot;

    } catch (e) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  // ------------------------------------------------------------
  // Compare two snapshots
  // ------------------------------------------------------------

  function findChanges(previousItems, currentItems) {

    const changes = [];

    currentItems.forEach((currentItem, cartItemKey) => {

      const previousItem = previousItems.get(cartItemKey);

      // New item
      if (!previousItem) {
        changes.push({
          cartItemKey,
          oldQuantity: 0,
          newQuantity: currentItem.quantity,
          item: currentItem.item
        });

        return;
      }

      // Quantity changed
      if (currentItem.quantity !== previousItem.quantity) {
        changes.push({
          cartItemKey,
          oldQuantity: previousItem.quantity,
          newQuantity: currentItem.quantity,
          item: currentItem.item
        });
      }
    });

    return changes;
  }

  // ------------------------------------------------------------
  // Wait for initial cart hydration
  // ------------------------------------------------------------

  function waitForHydration() {

    const state = select(cartStore);

    if (state.hasFinishedResolution?.('getCartData') === false) {
      setTimeout(waitForHydration, 50);
      return;
    }

    const currentItems = getCartSnapshot();

    /*
     * The cart is now hydrated.
     *
     * Check whether we have a snapshot from the previous page.
     */
    const storedItems = loadSnapshot();

    if (storedItems) {
      console.log('Found stored items');
      const changes = findChanges(
        storedItems,
        currentItems
      );

      changes.forEach((change) => {
        callback(change);
      });

      // We have consumed the previous-page snapshot.
      sessionStorage.removeItem(STORAGE_KEY);
    }

    /*
     * The hydrated cart becomes our live baseline.
     */
    previousItems = currentItems;

    hydrated = true;
  }

  // ------------------------------------------------------------
  // Initialize
  // ------------------------------------------------------------

  waitForHydration();

  // ------------------------------------------------------------
  // Subscribe to cart changes
  // ------------------------------------------------------------

  const unsubscribe = subscribe(() => {

    if (!hydrated) {
      return;
    }

    const state = select(cartStore);

    /*
     * Don't inspect the cart while WooCommerce is still
     * processing an item operation.
     */
    if (state.hasPendingItemsOperations?.()) {
      return;
    }

    const currentItems = getCartSnapshot();

    const changes = findChanges(
      previousItems,
      currentItems
    );

    changes.forEach((change) => {
      callback(change);
    });

    /*
     * Update the live baseline.
     */
    previousItems = currentItems;

    /*
     * Keep the latest known cart available across navigation.
     */
    saveSnapshot(currentItems);

  }, cartStore);

  return unsubscribe;
}

(function ($) {
  "use strict";

  $(document).ready(function () {
    const unsubscribe = WCCartObserver(
      function (change) {

        console.log(
          'WooCommerce cart quantity changed:',
          {
            cartItemKey: change.cartItemKey,
            oldQuantity: change.oldQuantity,
            newQuantity: change.newQuantity
          }
        );

        const name = change.item.sku == '' ? 'This product' : change.item.name;

        if (change.oldQuantity == 0) {
          alert(
            name +
            ' was added to cart'
          );
        } else {
          alert(
            name +
            ' quantity changed from ' +
            change.oldQuantity +
            ' to ' +
            change.newQuantity
          );
        }

      }
    );
  });

})(jQuery);