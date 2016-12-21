<?php
// --------------------------------------------------------------------------
//
//   Cleaner walker for wp_nav_menu()
//
// --------------------------------------------------------------------------

class NavWalker extends \Walker_Nav_Menu {
  private $cpt; // Boolean, is current post a custom post type
  private $archive; // Stores the archive page for current URL

  public function __construct() {
    add_filter('nav_menu_css_class', array($this, 'cssClasses'), 10, 2);
    add_filter('nav_menu_item_id', '__return_null');
    $cpt           = get_post_type();
    $this->cpt     = in_array($cpt, get_post_types(array('_builtin' => false)));
    $this->archive = get_post_type_archive_link($cpt);
  }

  public function checkCurrent($classes) {
    return preg_match('/(current[-_])|active/', $classes);
  }

  function start_lvl(&$output, $depth = 0, $args = []) {
    $output .= "\n<ul class=\"" . $args->menu->slug . "-sub-menu\">\n";
  }

  public function display_element($element, &$children_elements, $max_depth, $depth = 0, $args, &$output) {

    $element->is_subitem = ((!empty($children_elements[$element->ID]) && (($depth + 1) < $max_depth || ($max_depth === 0))));

    $element->classes[] = $args[0]->menu->slug . '-menu-item';

    if ($element->is_subitem) {
      foreach ($children_elements[$element->ID] as $child) {
        if ($child->current_item_parent || url_compare($this->archive, $child->url)) {
          $element->classes[] = 'menu-item--active';
        }
      }
    }

    $element->is_active = strpos($this->archive, $element->url);

    if ($element->is_active) {
      $element->classes[] = 'menu-item--active';
    }

    parent::display_element($element, $children_elements, $max_depth, $depth, $args, $output);
  }

  public function cssClasses($classes, $item) {
    $slug = sanitize_title($item->title);


    // Remove cruft classes

    $classes = preg_replace('/^((menu|page)[-_\w+]+)+/', '', $classes);


    // Add default classes

    $classes[] = 'menu-item--' . $slug;


    // Check if this is the current menu item, replace with simple class

    if (preg_grep('/(current(-menu-|[-_]page[-_])(item|parent|ancestor))/', $classes)) {

      $classes = preg_replace('/(current(-menu-|[-_]page[-_])(item|parent|ancestor))/', '', $classes);
      $classes[] = 'menu-item--active';

    }


    // Add active class to archive parent if current page is a single of that type

    if ($this->cpt) {
      $classes = str_replace('current_page_parent', '', $classes);

      if (url_compare($this->archive, $item->url)) {
        $classes[] = 'menu-item--active';
      }
    }


    // Filter out duplicates

    $classes = array_unique($classes);

    return array_filter($classes, function ($element) {
      $element = trim($element);
      return !empty($element);
    });
  }

}

// --------------------------------------------------------------------------
//   Clean up wp_nav_menu_args
// --------------------------------------------------------------------------

function nav_menu_args($args = '') {
  $nav_menu_args = [];
  $nav_menu_args['container'] = false;
  $nav_menu_args['fallback_cb'] = false;


  // Set wrapper class name to be menu slug

  $menu_name = $args['theme_location'];
  $locations = get_nav_menu_locations();
  $menu_id = $locations[ $menu_name ] ;
  $menu = wp_get_nav_menu_object($menu_id);

  $nav_menu_args['items_wrap'] = '<ul class="%2$s">%3$s</ul>';
  $nav_menu_args['menu_class'] = $menu->slug;


  // Remove the id="" on nav menu items

  $nav_menu_args['walker'] = new NavWalker();

  return array_merge($args, $nav_menu_args);
}

add_filter('wp_nav_menu_args', __NAMESPACE__ . '\\nav_menu_args');
add_filter('nav_menu_item_id', '__return_null');
