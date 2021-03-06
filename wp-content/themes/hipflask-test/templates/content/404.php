
  <section class="wrapper page-content">

    <div class="container">

      <h1><?php echo roots_title(); ?></h1>

      <p>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>

      <p>Please try the following:</p>
      <ul>
        <li>Check your spelling</li>
        <li>Return to the <a href="<?php echo home_url() ?>">home page</a></li>
        <li>Click the <a href="javascript:history.back()">Back</a> button</li>
      </ul>

      <?php get_search_form(); ?>

    </div>

  </section>
