<?php
/**
 * Plugin Name: Impact Assessment
 * Plugin URI: https://example.com/
 * Description: Sample woocommerce plugin for assessment
 * Version: 0.1
 * Author: Stephen Brown
 * Author URI: https://example.com/
 * Text Domain: impact-assessment
 * Requires Plugins: woocommerce
 * 
 * License: GNU General Public License v3.0
 * License URI: http://www.gnu.org/licenses/gpl-3.0.html
 **/

defined( 'ABSPATH' ) || exit;

// global variables for your plugin
define("WC_Q_ALERT_PATH", plugin_dir_path(__FILE__));
define("WC_Q_ALERT_URL", plugin_dir_url(__FILE__));
define("WC_Q_ALERT_SLUG", "wc-q-alert");

function get_url($file) {
  return WC_Q_ALERT_URL . $file;
}

function get_path($file) {
  return WC_Q_ALERT_PATH . $file;
}

require_once( 'inc/main.php' );