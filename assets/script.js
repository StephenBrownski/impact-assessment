function WCCartObserver(callback) {

  if (typeof callback !== 'function') {
    throw new TypeError(
      'WCCartObserver requires a callback function.'
    );
  }

  // Ensure cart is ready to work with.
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

  const { dispatch } = window.wp.data;

  // This forces the cart to be refreshed on a page load.
  // Fixes issue with single product page add to cart.
  dispatch(cartStore).invalidateResolutionForStore();

  // We will be storing the last updated cart in localstorage.
  // This is used to allow for alerting a change from a
  // classic form submit that refreshes the page.
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
  // Store only the necessary information in session storage
  // ------------------------------------------------------------
  function serializeSnapshot(snapshot) {
    const data = {};

    snapshot.forEach((item, key) => {
      data[key] = {
        quantity: item.quantity
      };
    });

    return data;
  }

  // ------------------------------------------------------------
  // Save the previous cart state
  // ------------------------------------------------------------

  function savePreviousSnapshot(snapshot) {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        serializeSnapshot(snapshot)
      )
    );
  }

  // ------------------------------------------------------------
  // Load the previous cart state
  // ------------------------------------------------------------

  function loadPreviousSnapshot() {
    const stored = sessionStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return null;
    }

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
    } catch (error) {
      sessionStorage.removeItem(STORAGE_KEY);

      return null;
    }
  }

  // ------------------------------------------------------------
  // Compare snapshots
  // ------------------------------------------------------------

  function findChanges(previousItems, currentItems) {
    const changes = [];

    if (!previousItems || !currentItems) {
      return changes;
    }

    // Detect additions and quantity changes.
    currentItems.forEach((currentItem, cartItemKey) => {
      const previousItem =
        previousItems.get(cartItemKey);

      // Item didn't exist before - added
      if (!previousItem) {
        changes.push({
          cartItemKey,
          oldQuantity: 0,
          newQuantity: currentItem.quantity,
          item: currentItem.item
        });

        return;
      }

      // Existing item changed quantity.
      if (currentItem.quantity !== previousItem.quantity) {
        changes.push({
          cartItemKey,
          oldQuantity: previousItem.quantity,
          newQuantity: currentItem.quantity,
          item: currentItem.item
        });
      }
    });

    // Detect removals. Need to loop over previous
    previousItems.forEach((previousItem, cartItemKey) => {
      if (!currentItems.has(cartItemKey)) {
        changes.push({
          cartItemKey,
          oldQuantity: previousItem.quantity,
          newQuantity: 0,
          item: previousItem.item
        });
      }

    });

    return changes;
  }

  // ------------------------------------------------------------
  // Initial hydration
  // ------------------------------------------------------------

  function waitForHydration() {
    const state = select(cartStore);

    if (state.hasFinishedResolution?.('getCartData') === false) {
      setTimeout(waitForHydration, 50);
      return;
    }

    const currentItems = getCartSnapshot();

    /*
     * Was there a cart snapshot from before this page load?
     */
    const storedItems = loadPreviousSnapshot();

    if (storedItems) {
      const changes = findChanges(
        storedItems,
        currentItems
      );

      // Alert only a single item when multiple are added
      callback(changes[0]);

      /*
       * We've consumed the cross-page snapshot.
       */
      sessionStorage.removeItem(STORAGE_KEY);
    }

    /*
     * The hydrated cart is now our live baseline.
     */
    previousItems = currentItems;

    hydrated = true;
  }

  waitForHydration();

  // ------------------------------------------------------------
  // Live cart subscription
  // ------------------------------------------------------------

  const unsubscribe = subscribe(() => {
    if (!hydrated) {
      return;
    }

    const state = select(cartStore);

    /*
     * Don't inspect intermediate cart states.
     */
    if (state.hasPendingItemsOperations?.()) {
      return;
    }

    const currentItems = getCartSnapshot();

    const changes = findChanges(
      previousItems,
      currentItems
    );

    // Alert only a single item when multiple are added
    callback(changes[0]);

    /*
     * Update our in-memory baseline.
     */
    previousItems = currentItems;

  }, cartStore);

  // ------------------------------------------------------------
  // Before submitting add to cart, preserve the current baseline.
  // ------------------------------------------------------------


  // This is a special case for the default single product page.
  // I hate that I needed a dom selector but didn't want to rely
  // on a "beforeunload" event that doesn't have wide support.
  jQuery('form.cart').on('submit', function () {
    if (!hydrated || !previousItems) {
      return;
    }

    if (!sessionStorage.getItem(STORAGE_KEY)) {
      savePreviousSnapshot(previousItems);
    }

  });

  return unsubscribe;
}

(function ($) {
  "use strict";

  $(document).ready(function () {
    const unsubscribe = WCCartObserver(
      function (change) {
        // Condition alert string for missing product sku.
        const name = change.item.sku == '' ? 'This product' : change.item.name;

        // Conditions for addition, removal, and simple change.
        if (change.oldQuantity == 0) {
          alert(name + ' was added to cart');
        } else if (change.newQuantity == 0) {
          alert(name + ' was removed from the cart');
        } else {
          alert(name + ' quantity changed from ' + change.oldQuantity + ' to ' + change.newQuantity);
        }
      }
    );
  });

})(jQuery);