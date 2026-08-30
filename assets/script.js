function initJsCart($) {
  // For javascript-based events. Happens on plp ajax add to cart and minicart.

  $(document.body).on('wc-blocks_added_to_cart added_to_cart', async (e) => {
    console.log(e);
    console.log('Cart changed');
  });

  $(document.body).on('removed_from_cart removing_from_cart', async (e) => {
    console.log('Removed');
  });
}

function initReactCart() {
  try {
    wp;
  } catch {
    // Exits if wp is not defined - not on cart page.
    return;
  }
  // Tie into remove item react hooks.
  wp.hooks.addAction(
    'experimental__woocommerce_blocks-cart-remove-item',
    'test',
    ({ product }) => {
      const key = product.key;
      const unsubscribe = wp.data.subscribe(() => {
        const isPendingDelete = wp.data.select('wc/store/cart').isItemPendingDelete(key);
        // Conditional name on missing sku
        const name = product.sku == '' ? 'This product' : product.name;
        let prev = product.quantity;
        if (!isPendingDelete) {
          alert(name + " has been removed from cart.");
          unsubscribe();
        }
      }, 'wc/store/cart');
    }
  );

  wp.hooks.addAction(
    'experimental__woocommerce_blocks-cart-set-item-quantity',
    'test',
    ({ product, quantity }) => {
      const key = product.key;
      const unsubscribe = wp.data.subscribe(() => {
        const isPendingQuantity = wp.data.select('wc/store/cart').isItemPendingQuantity(key);
        // Conditional name on missing sku
        const name = product.sku == '' ? 'This product' : product.name;
        let prev = product.quantity;
        if (!isPendingQuantity) {
          alert(name + " quantity changed from " + prev + " to " + quantity);
          unsubscribe();
        }
      }, 'wc/store/cart');
    }
  );
}

jQuery(document).ready(function ($) {
  initJsCart($);
  initReactCart();
});