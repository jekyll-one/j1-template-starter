---
regenerate:                             true
---

{% capture cache %}

{% comment %}
 # -----------------------------------------------------------------------------
 # ~/assets/themes/j1/adapter/js/speak2me.js
 # Liquid template to adapt the Speak2Me module
 #
 # Product/Info:
 # https://jekyll.one
 # Copyright (C) 2023, 2024 Juergen Adams
 #
 # J1 Template is licensed under the MIT License.
 # For details, see: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
 # -----------------------------------------------------------------------------
 # Test data:
 #  {{ liquid_var | debug }}
 #  speak2me_options:  {{ speak2me_options | debug }}
 # -----------------------------------------------------------------------------
{% endcomment %}

{% comment %} Liquid procedures
-------------------------------------------------------------------------------- {% endcomment %}

{% comment %} Set global settings
-------------------------------------------------------------------------------- {% endcomment %}
{% assign environment       = site.environment %}
{% assign asset_path        = "/assets/themes/j1" %}

{% comment %} Process YML config data
================================================================================ {% endcomment %}

{% comment %} Set config files
-------------------------------------------------------------------------------- {% endcomment %}
{% assign template_config    = site.data.j1_config %}
{% assign blocks             = site.data.blocks %}
{% assign modules            = site.data.modules %}

{% comment %} Set config data (settings only)
-------------------------------------------------------------------------------- {% endcomment %}
{% assign speak2me_defaults = modules.defaults.speak2me.defaults %}
{% assign speak2me_settings = modules.speak2me.settings %}

{% comment %} Set config options (settings only)
-------------------------------------------------------------------------------- {% endcomment %}
{% assign speak2me_options  = speak2me_defaults | merge: speak2me_settings %}

{% comment %} Variables
-------------------------------------------------------------------------------- {% endcomment %}
{% assign comments          = speak2me_options.enabled %}

{% comment %} Detect prod mode
-------------------------------------------------------------------------------- {% endcomment %}
{% assign production = false %}
{% if environment == 'prod' or environment == 'production' %}
  {% assign production = true %}
{% endif %}

/*
 # -----------------------------------------------------------------------------
 # ~/assets/themes/j1/adapter/js/speak2me.js
 # J1 Adapter for the speak2me module
 #
 # Product/Info:
 # https://jekyll.one
 #
 # Copyright (C) 2023, 2024 Juergen Adams
 #
 # J1 Template is licensed under the MIT License.
 # For details, see: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
 # -----------------------------------------------------------------------------
 # NOTE: Wave styles defind in /assets/data/panel.html, key 'wave'
 # -----------------------------------------------------------------------------
 #  Adapter generated: {{site.time}}
 # -----------------------------------------------------------------------------
*/

/* Further reading
  https://dev.to/jankapunkt/cross-browser-speech-synthesis-the-hard-way-and-the-easy-way-353
  https://github.com/jankapunkt/easy-speech
*/

// -----------------------------------------------------------------------------
// ESLint shimming
// -----------------------------------------------------------------------------
/* eslint indent: "off"                                                       */
// -----------------------------------------------------------------------------
'use strict';
j1.adapter.speak2me = (function (j1, window) {

{% comment %} Set global variables
-------------------------------------------------------------------------------- {% endcomment %}
var environment       = '{{environment}}';
var cookie_names      = j1.getCookieNames();
var user_state        = j1.readCookie(cookie_names.user_state);
var state             = 'not_started';
var isFirefox         = /Firefox/i.test(navigator.userAgent);
var chrome            = /chrome/i.test( navigator.userAgent );
var isEdge            = /Edg/i.test(navigator.userAgent);
var isOpera           = /OPR/i.test(navigator.userAgent);
var isSafari          = /Safari/i.test(navigator.userAgent);
var isAvast           = /Avast/i.test(navigator.userAgent);
var isChrome          = ((chrome) && (!isEdge));
var ttsDisabled       = false;
var mobilesDisabled   = false;
var browsersDisabled  = [];
var isMobile          = (window.orientation !== undefined) ? true :false;       // NOTE: window.orientation is DEPRECATED
// var isMobile       = (screen.orientation.type == 'portrait-secondary') ? true : false;

// synthetic puase
var isPaused            = false;
var lastSpokenChunk     = false;
var lastScrollPosition  = false;

var frontmatterOptions;
var speak2meDefaults;
var speak2meSettings;
var speak2meOptions;
var speak2meModal;
var _this;
var logger;
var logText;
var chromeWorkaround;
var chromeWorkaroundPause
var chromeWorkaroundResume;
var $buttonPause;
var $buttonResume;

let isRunning = true;
let intervalId;

const scrollBehavior      = 'smooth';

// -----------------------------------------------------------------------------
// global event handler
// -----------------------------------------------------------------------------
var Events = {
  documentReady: function (onDocumentReady) {
    if (document.readyState !== 'loading') {
      onDocumentReady();
    } else {
      document.addEventListener('DOMContentLoaded', onDocumentReady);
    }
  }
};

  // ---------------------------------------------------------------------------
  // Main object
  // ---------------------------------------------------------------------------
  return {

    // -------------------------------------------------------------------------
    // global helper functions
    // -------------------------------------------------------------------------
    //
    // See: https://gist.github.com/carloscabo/0ec69aaa42216c7f12efd861e110cb8b
    // function isSafariIos() {
    //   var is_ios    = /iP(ad|od|hone)/i.test(window.navigator.userAgent);
    //   var is_safari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
    //
    //   if (is_ios && is_safari) {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // };

    // -------------------------------------------------------------------------
    // init()
    // adapter initializer
    // -------------------------------------------------------------------------
    init: function (options) {

      // -----------------------------------------------------------------------
      // Default module settings
      // -----------------------------------------------------------------------
      var settings = $.extend({
        module_name: 'j1.adapter.speak2me',
        generated:   '{{site.time}}'
      }, options);

      // -----------------------------------------------------------------------
      // Global variable settings
      // -----------------------------------------------------------------------

      // create settings object from frontmatter
      //
      frontmatterOptions = options != null ? $.extend({}, options) : {};

      // create settings object from module options
      //
      speak2meDefaults = $.extend({}, {{speak2me_defaults | replace: 'nil', 'null' | replace: '=>', ':' }});
      speak2meSettings = $.extend({}, {{speak2me_settings | replace: 'nil', 'null' | replace: '=>', ':' }});
      speak2meOptions  = $.extend(true, {}, speak2meDefaults, speak2meSettings, frontmatterOptions);

      ttsDisabled      = (speak2meOptions.tts == "false") ? true : false;
      mobilesDisabled  = (speak2meOptions.mobilesDisabled == "false") ? true : false;
      browsersDisabled = speak2meOptions.browsersDisabled;

      _this  = j1.adapter.speak2me;
      logger = log4javascript.getLogger('j1.adapter.speak2me');

      _this.setState('started');
      logger.debug('\n' + 'state: ' + _this.getState());
      logger.info('\n' + 'module is being initialized');

      // -----------------------------------------------------------------------
      // initializer
      // -----------------------------------------------------------------------
      var dependencies_met_page_ready = setInterval (function (options) {
        var pageState     = $('#no_flicker').css("display");
        var pageVisible   = (pageState == 'block') ? true : false;
        var atticFinished = (j1.adapter.attic.getState() == 'finished') ? true: false;

        if (j1.getState() === 'finished' && pageVisible && atticFinished) {

          if (mobilesDisabled && isMobile) {
            console.log('module speak2me is disabled for mobile browsers');
            logger.warn('\n' + 'module speak2me is disabled for mobile browsers');
            $('#quickLinksSpeakButton').hide();
            clearInterval(dependencies_met_page_ready);
            return;
          }

          var operaDisabled = (browsersDisabled.includes('Opera')) ? true : false;
          if (operaDisabled && isOpera) {
            console.log('module speak2me is disabled for the Opera browser');
            logger.warn('\n' + 'module speak2me is disabled for the Opera browser');
            $('#quickLinksSpeakButton').hide();
            clearInterval(dependencies_met_page_ready);
            return;
          }

          var firefoxDisabled = (browsersDisabled.includes('Firefox')) ? true : false;
          if (firefoxDisabled && isFirefox) {
            console.log('module speak2me is disabled for the Firefox browser');
            logger.warn('\n' + 'module speak2me is disabled for the Firefox browser');
            $('#quickLinksSpeakButton').hide();
            clearInterval(dependencies_met_page_ready);
            return;
          }

          // Avast Secure Browser always disabled
          //
          var avastDisabled = (browsersDisabled.includes('Avast')) ? true : false;
          if (avastDisabled && isAvast) {
            console.log('module speak2me is not supported for the Avast Secure browser');
            logger.warn('\n' + 'module speak2me is disabled for the Avast Secure browser');
            $('#quickLinksSpeakButton').hide();
            clearInterval(dependencies_met_page_ready);
            return;
          }

          var safariDisabled = (browsersDisabled.includes('Safari')) ? true : false;
          if (safariDisabled && !isChrome && isSafari) {
            console.log('module speak2me is disabled for the Safari browser');
            logger.warn('\n' + 'module speak2me is disabled for the Safari browser');
            $('#quickLinksSpeakButton').hide();
            clearInterval(dependencies_met_page_ready);
            return;
          }

          if (ttsDisabled) {
            logger.debug('\n' + 'tts detected: disabled');
            $('#quickLinksSpeakButton').hide();
            clearInterval(dependencies_met_page_ready);
            return;
          } else {
            speak2meModal = document.createElement('div');
            speak2meModal.id = speak2meOptions.dialogContainerID;
            speak2meModal.style.display = 'none';

            speak2meModal.setAttribute('class', 'modal fade');
            speak2meModal.setAttribute('tabindex', '-1');
            speak2meModal.setAttribute('role', 'dialog');
            speak2meModal.setAttribute('aria-labelledby', speak2meOptions.dialogContainerID);
            document.body.append(speak2meModal);

            // -------------------------------------------------------------------
            // data loader
            // -------------------------------------------------------------------
            j1.loadHTML ({
              xhr_container_id:   'speak2me_container',
              xhr_data_path:      '/assets/data/speak2me/index.html',
              xhr_data_element:   'speak2me-modal-data' },
              'j1.adapter.speak2me',
              'null'
            );
          }

          // -------------------------------------------------------------------
          // on 'show'
          // -------------------------------------------------------------------
          $('#speak2me_container').on('show.bs.modal', function () {
            _this.create('#voiceSelector');
          }); // END modal on 'show'

          // -------------------------------------------------------------------
          // on 'shown'
          // -------------------------------------------------------------------
          $('#speak2me_container').on('shown.bs.modal', function () {
            this.$buttonSpeak = $('#speak_button');
            this.$buttonStop  = $('#stop_button');

            // setup workaround for chromium based browsers
            // to enable infinite speech output
            //
            this.$buttonSpeak.click(function () {
              if (isChrome) {
                logger.info('\n' + 'speak: setup pause workaround for chromium based browsers');
                chromeWorkaround = setInterval(function () {
                  var isSpeaking  = $().speak2me('isSpeaking');

                  logger.info('\n' + 'speak: isSpeaking|isPaused: ' + isSpeaking + '|' + isPaused);
                  if (isSpeaking) {
                    $().speak2me('pause').speak2me('resume');
                    logger.info('\n' + 'speak: send pause-resumed');
                  } else {
                    $().speak2me('resume');
                    logger.info('\n' + 'speak: send resumed');
                  }

                }, speak2meOptions.chrome_pause_resume_cycle);
              }
            });

            // stop workaround for chromium based browsers
            //
            this.$buttonStop.click(function () {
              logger.info('\n' + 'speak: remove pause workaround for chromium based browsers');
              // wait 3 sec to make sure speech output is stopped
              setTimeout (function() {
                var isSpeaking  = $().speak2me('isSpeaking');
                var isPaused    = $().speak2me('isPaused');

                // remove pause indication
                $('.mdib-speaker').removeClass('md-orange');

                if (!isSpeaking && !isPaused) {
                  clearInterval(chromeWorkaround);
                }
              }, 3000);
            });

          }); // END modal on 'shown'

          // -------------------------------------------------------------------
          // on 'hidden' (close)
          // -------------------------------------------------------------------
          $('#speak2me_container').on('hidden.bs.modal', function () {
            //
            // do something here
            //
          }); // END modal on 'hidden'

          _this.setState('finished');
          logger.debug('\n' + 'state: ' + _this.getState());
          logger.info('\n' + 'module initialization finished');

          clearInterval(dependencies_met_page_ready);
        }
      }, 10);

    }, // END init

    // -------------------------------------------------------------------------
    // create()
    // create a HTML select element for all (valid) voices found
    // -------------------------------------------------------------------------
    create: function (obj) {
      var isSelectEmpty = ($('#voiceSelect').length == 1) ? false: true;
      var numVoices;

      // create select element (#voiceSelect) if not already exist
      if (isSelectEmpty) {
        numVoices = $().speak2me('getVoices', obj, 'Select a voice');

        // delete select element (#voiceSelect) if no valid voiuces found
        if (numVoices === 0) {
          $(obj).remove();
        }
      }
    }, // END create

    // -------------------------------------------------------------------------
    // showDialog()
    // display the tts settings dialog
    // -------------------------------------------------------------------------
    showDialog: function () {
      logger.debug('\n' + "showDialog");

      $('#speak2me_container').modal({
        backdrop: 'static',
        keyboard: false
      });

      $('#speak2me_container').modal('show');
    }, // END showDialog

    // -------------------------------------------------------------------------
    // update()
    // update the value to the right of the input sliders
    // -------------------------------------------------------------------------
    update: function (obj, value) {
      var n = parseFloat(value).toFixed(1)
      $(obj).parent().find('span').text(n);
    }, // END update

    // -------------------------------------------------------------------------
    // speak()
    // calls the 'speak' functiion of the converter
    // -------------------------------------------------------------------------
    speak: function (obj) {
      // Get the parameter values from the input sliders
      //
      var rate    = parseFloat(document.getElementById('rate').value);
      var pitch   = parseFloat(document.getElementById('pitch').value);
      var volume  = parseFloat(document.getElementById('volume').value);

      // Note: Function calls can be perfromed individually or
      // chained together as demonstrated below
      //
      $(obj).speak2me('rate', rate).speak2me('pitch', pitch).speak2me('volume', volume);

      // $(obj).speak2me('ignore', 'h2','h3');

      var paused;
      if (!lastSpokenChunk) {
        paused = false;
      } else {
        paused = true;
      }

      var speaker = $(obj).speak2me('speak', {
        isPaused: paused,
        lastChunk: lastSpokenChunk,
        lastScrollPosition: lastScrollPosition,
      });

      // set speak indication;
      $('.mdib-speaker').addClass('mdib-spin');

      $('#stop_button').show();
      $('#pause_button').show();

      // hide buttons NOT needed
      //
      $('#speak_button').hide();
      $('#resume_button').hide();

      // just for debugging completeness, no errors seem to be thrown though
      // speaker.addEventListener('error', (event) => {
      //   console.log('speak2me error:', event);
      // });

    }, // END speak

    // -------------------------------------------------------------------------
    // pause()
    // Calls the 'pause' function of the converter
    // -------------------------------------------------------------------------
    pause: function () {
      // remove speak indication;
      $('.mdib-speaker').removeClass('mdib-spin');

      // set pause indication
      $('.mdib-speaker').addClass('md-orange');

      if (!isChrome) {
        $().speak2me('pause');
      } else {
        // synthetic pause-resume for chromium-based browsers
        //
        lastSpokenChunk     = $().speak2me('isSpoken');
        lastScrollPosition  = $().speak2me('isScrolled');
        $().speak2me('stop');
      }

      $('#resume_button').show();

      // hide buttons NOT needed
      //
      $('#pause_button').hide();

    }, // END pause

    // -------------------------------------------------------------------------
    // resume()
    // Calls the 'resume' function of the converter
    // -------------------------------------------------------------------------
    resume: function () {
      $('.mdib-speaker').addClass('mdib-spin');
      if (!isChrome) {
        $().speak2me('resume');
      } else {
        // synthetic pause-resume for chromium-based browsers
        //
        _this.speak('{{speak2me_options.speechSelector}}');
      }

      $('#pause_button').show();

      // hide buttons NOT needed
      //
      $('#resume_button').hide();

      // remove pause indication
      $('.mdib-speaker').removeClass('md-orange');

    }, // END resume

    // -------------------------------------------------------------------------
    // stop()
    // Calls the 'stop' function of the converter
    // -------------------------------------------------------------------------
    stop: function () {
      $().speak2me('stop')
      // remove speak indication;
      $('.mdib-speaker').removeClass('mdib-spin');
      // remove pause indication
      $('.mdib-speaker').removeClass('md-orange');

      $('#speak_button').show();

      // jadams, 2023-09-28;
      // workaroud: reload page to reset TTS dialog (buttons)
      location.reload();

      // jadams, 2023-09-28;
      // solution required, when selected language in voice
      // selector (dialog) has NOT changed if translation was changed

    }, // END stop

    // -------------------------------------------------------------------------
    // messageHandler()
    // manage messages send from other J1 modules
    // -------------------------------------------------------------------------
    messageHandler: function (sender, message) {
      var json_message = JSON.stringify(message, undefined, 2);

      logText = '\n' + 'received message from ' + sender + ': ' + json_message;
      logger.debug(logText);

      // -----------------------------------------------------------------------
      //  Process commands|actions
      // -----------------------------------------------------------------------
      if (message.type === 'command' && message.action === 'module_initialized') {
        //
        // Place handling of command|action here
        //
        logger.info('\n' + message.text);
      }

      //
      // Place handling of other command|action here
      //

      return true;
    }, // END messageHandler

    // -------------------------------------------------------------------------
    // setState()
    // Sets the current (processing) state of the module
    // -------------------------------------------------------------------------
    setState: function (stat) {
      _this.state = stat;
    }, // END setState

    // -------------------------------------------------------------------------
    // getState()
    // Returns the current (processing) state of the module
    // -------------------------------------------------------------------------
    getState: function () {
      return _this.state;
    } // END getState

  }; // END return
})(j1, window);

{% endcapture %}
{% if production %}
  {{ cache | minifyJS }}
{% else %}
  {{ cache | strip_empty_lines }}
{% endif %}
{% assign cache = nil %}
