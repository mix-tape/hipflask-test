<?php
// --------------------------------------------------------------------------
//
//  Functions.php
//    Required by Wordpress, keep clean and use only for requires
//
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
//   Include Utilities
// --------------------------------------------------------------------------

foreach (glob(dirname(__FILE__) . "/library/utilities/*.php") as $filename)
{
  include $filename;
}


// --------------------------------------------------------------------------
//   Include Configuration
// --------------------------------------------------------------------------

include_once('library/configuration/cleanup.php');              // Cleanup the markup
include_once('library/configuration/configuration.php');        // Base configuration and constants
include_once('library/configuration/activation.php');           // Theme setup
include_once('library/configuration/assets-enqueue.php');       // Dependency management


// --------------------------------------------------------------------------
//   Include Post Types and Taxonomies
// --------------------------------------------------------------------------

foreach (glob(dirname(__FILE__) . "/library/content-types/*.php") as $filename)
{
  include $filename;
}


// --------------------------------------------------------------------------
//   Include Tweaks
// --------------------------------------------------------------------------

foreach (glob(dirname(__FILE__) . "/library/tweaks/*.php") as $filename)
{
  include $filename;
}
