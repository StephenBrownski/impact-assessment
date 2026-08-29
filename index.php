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

// global variables for your plugin
define("MY_PLUGIN_PATH", plugin_dir_path(__FILE__));
define("MY_PLUGIN_URL", plugin_dir_url(__FILE__));
define("MY_PLUGIN_SLUG", "my-plugin");

require_once MY_PLUGIN_PATH . "inc/admin.php";

register_activation_hook(__FILE__, "setup_db");

function setup_db() {
    // database setup code
}

function get_url($file) {
    return MY_PLUGIN_URL . $file;
}

function get_path($file) {
    return MY_PLUGIN_PATH . $file;
}

function enqueue_my_styles() {
    wp_enqueue_style("atc-styles", get_url("assets/style.css"), array(), filemtime(get_path("assets/style.css")));
}

function enqueue_my_scripts() {
    wp_enqueue_script("atc-scripts", get_url("assets/script.js"), array("jquery"), filemtime(get_path("assets/script.js")));
}

add_action("wp_enqueue_scripts", "enqueue_my_styles");
add_action("wp_enqueue_scripts", "enqueue_my_scripts");