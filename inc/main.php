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
    require_once WC_Q_ALERT_PATH . 'inc/Main.php';
  }
}
endif;
