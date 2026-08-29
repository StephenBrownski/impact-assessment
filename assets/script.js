jQuery(document).ready(function ($) {
  // add custom JS code

  $(document.body).on('added_to_cart wc-blocks_added_to_cart', async (e, fragments, cart_hash, $button) => {
    console.log('Added.');
  });



  $(document.body).on('removed_from_cart wc-blocks_removed_from_cart', async (e, fragments, cart_hash, $button) => {
    console.log('Removed.');
  });
});