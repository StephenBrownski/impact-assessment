<?php

defined( 'ABSPATH' ) || exit;

if (!class_exists( 'WCQuantityAlert')) :
/**
 * Core class
 */
class WCQuantityAlert {
  /**
   * The single instance of the class.
   */
  protected static $_instance = null;

  /**
   * Constructor.
   */
  protected function __construct() {
    $this->init();
  }

  /**
   * Main Extension Instance.
   */
  public static function instance() {
    if (is_null(self::$_instance)) {
      self::$_instance = new self();
    }

    return self::$_instance;
  }

  /**
   * Cloning is forbidden.
   */
  public function __clone() {
    wc_doing_it_wrong(__FUNCTION__, 'Cloning is forbidden.', '1.0');
  }

  /**
   * Unserializing instances of this class is forbidden.
   */
  public function __wakeup() {
    wc_doing_it_wrong(__FUNCTION__, 'Wakeup is forbidden.', '1.0');
  }

  /**
   * Function for getting everything set up and ready to run.
   */
  private function init() {
    require_once WC_Q_ALERT_PATH . 'inc/Admin.php';

    function enqueue_my_styles() {
      wp_enqueue_style("atc-styles", get_url("assets/style.css"), array(), filemtime(get_path("assets/style.css")));
    }

    // Ensure that wp-data and wc-blocks-data-store are explicitly required.
    // This will allow a single observer to fire anywhere.
    function enqueue_my_scripts() {
      wp_enqueue_script(
        "atc-scripts",
        get_url("assets/script.js"),
        array("jquery", "wp-data", "wc-blocks-data-store"),
        '1.0.0',
        true
      );
    }

    add_action("wp_enqueue_scripts", "enqueue_my_styles");
    add_action("wp_enqueue_scripts", "enqueue_my_scripts");
  }
}
endif;

add_action( 'woocommerce_init', 'WCQuantityAlertInitialize' );

function WCQuantityAlertInitialize() {
	// Custom code here. WooCommerce is active and initialized...
  $GLOBALS['wc_quantity_alert'] = WCQuantityAlert::instance();
}
