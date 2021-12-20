<!-- Google Ad (Displayanzeige): horizontal-1 -->
<ins class="adsbygoogle mb-5"
     style="display:block"
     data-ad-client="ca-pub-3885670015316130"
     data-ad-slot="5128488466"
     data-ad-format="auto"
     data-adtest="on"
     data-full-width-responsive="true">
</ins>

<!-- Google Ad (Displayanzeige): horizontal-2 -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-3885670015316130"
     data-ad-slot="7284712660"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>

// manage uncaught execeptions
// ---------------------------------------------------------------------
// window.onerror = function (msg, url, line) {
//    alert("Message : " + msg );
//    alert("url : " + url );
//    alert("Line number : " + line );
// }

// From www.freeformatter.com
// -----------------------------------------------------------------------------
<script type="text/javascript">
  window.googletag = window.googletag || {};
  window.googletag.cmd = window.googletag.cmd || [];
  window.googletag.cmd.push(function() {
    window.googletag.pubads().enableAsyncRendering();
    window.googletag.pubads().disableInitialLoad();
  });
  (adsbygoogle=window.adsbygoogle||[]).pauseAdRequests=1;

  __tcfapi("addEventListener", 2, function(tcData, success) {
    if (success && tcData.unicLoad  === true) {
      if(!window._initAds) {
        window._initAds = true;
        var script = document.createElement('script');
        script.async = true;
        script.setAttribute('data-ad-client', 'ca-pub-2485708030241382');
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        document.head.appendChild(script);
      }
    }
  });
</script>

++++
<!-- insert Google Ad (Displayanzeige): horizontal-2, adSlot="5128488466" -->
<div class="5128488466 mb-5">
  <ins class="adsbygoogle"
    style="display: block;"
    data-ad-client="ca-pub-3885670015316130"
    data-ad-slot="5128488466"
    data-ad-format="auto"
    data-adtest="on"
    data-full-width-responsive="true">
  </ins>
</div>
++++

<!-- insert Google Ad (In-Article-Anzeige): in-article-1, adSlot="7522184684" -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3885670015316130"
     crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-layout="in-article"
     data-ad-format="fluid"
     data-ad-client="ca-pub-3885670015316130"
     data-ad-slot="7522184684"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>



++++
<script>

  $(document).ready(function() {
    var logger              = log4javascript.getLogger('j1.google.ads');
    var autoHideOnUnfilled  = false;

    var dependencies_met_page_ready = setInterval (function (options) {
      if ( j1.getState() === 'finished' ) {

        // monitor for state changes on the ad
        // ---------------------------------------------------------------------
        $('.adsbygoogle').attrchange({
          trackValues: true,
          callback: function (event) {
            if (event.newValue === 'unfilled') {
              var elm = event.target.dataset;
              if (elm.adClient) {
                logger.warn('\n' + 'initialized ad detected as: ' + event.newValue);
                if (autoHideOnUnfilled) {
                  logger.info('\n' + ' hide ad for slot: ' + elm.adSlot);
                  $('.' + elm.adSlot ).hide();
                }
              }
            }
          }
        });

        // manage uncaught execeptions
        // ---------------------------------------------------------------------
        // window.onerror = function (msg, url, line) {
        //    alert("Message : " + msg );
        //    alert("url : " + url );
        //    alert("Line number : " + line );
        // }

        logger.info('\n' + 'initialize Google Ad on slot: ' + '5128488466');
        (adsbygoogle = window.adsbygoogle || []).push({});

        clearInterval(dependencies_met_page_ready);
      }
   });

  });

</script>
++++
