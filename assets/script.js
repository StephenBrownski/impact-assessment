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
    // Exit if we don't have what we need.
    return null;
  }

  const { select, subscribe } = window.wp.data;
  const { cartStore } = window.wc.wcBlocksData;

  let hydrated = false;
  let previousItems = null;

  function waitForHydration() {
    const state = select(cartStore);
    console.log(hydrated);
    if (state.hasPendingItemsOperations()) {
      setTimeout(waitForHydration, 50);
      console.log('not hydrated');
      return;
    }

    previousItems = getCartSnapshot();
    hydrated = true;
  }

  // Establish the initial cart snapshot only after hydration.
  waitForHydration();

  // Maps cart data into a more readable output
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
          id: Number(item.id),
          quantity: Number(item.quantity),
          name: item.name || '',
          variation: item.variation || [],
          item
        }
      ])
    );
  }

  // Get initial state of cart
  previousItems = getCartSnapshot();

  // Subscribe to cart changes. Compare snapshots rather than assuming
  // a 'change' is something we care about.
  const unsubscribe = subscribe(() => {
    if (!hydrated) {
      // Don't listen if the cart hasn't been hydrated.
      return;
    }
    const currentItems = getCartSnapshot();

    // Compares current cart to the prev snapshot
    currentItems.forEach((currentItem, cartItemKey) => {
      const previousItem = previousItems.get(cartItemKey);
      const previousQuantity = previousItem ? previousItem.quantity : 0

      if (currentItem.quantity === previousQuantity) {
        // Quantity matches. Move on.
        return;
      }

      callback({
        cartItemKey: cartItemKey,
        oldQuantity: previousQuantity,
        newQuantity: currentItem.quantity,
        item: currentItem.item
      });
    });

    // Update snapshot after a comparison
    previousItems = currentItems;
  }, cartStore);

  return unsubscribe;
}

(function ($) {
  "use strict";

  // javascript code here. i.e.: $(document).ready( function(){} ); 
  $(document).ready(function ($) {
    const unsubscribe = WCCartObserver(
      function (change) {
        console.log('WooCommerce cart quantity changed:', {
          cartItemKey: change.cartItemKey,
          oldQuantity: change.oldQuantity,
          newQuantity: change.newQuantity
        });

        // Custom handling if sku is not defined.
        let name = change.item.sku == '' ? "This product" : change.item.name

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