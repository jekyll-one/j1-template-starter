---
regenerate:                             true
---

{%- capture cache -%}

{% comment %}
 # -----------------------------------------------------------------------------
 # ~/assets/theme/j1/adapter/js/videoPlayer.js (23)
 # J1 Adapter for the module VideoPlayer (native videoJS)
 #
 # Product/Info:
 # https://jekyll.one
 #
 # Copyright (C) 2026 Juergen Adams
 #
 # J1 Template is licensed under the MIT License.
 # See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE
 # -----------------------------------------------------------------------------
 # Fix J1 VideoPlayer #1
 # Adapter created from scratch for the native-video videoPlayer module.
 # Follows the same pattern as j1.adapter.claudeAI / j1.adapter.mmenu:
 #
 #   1. Merge default + user YAML settings into videoPlayerOptions.
 #   2. Expose videoPlayerOptions as j1.adapter.videoPlayer.videoPlayerOptions
 #      so the module can read it via j1.adapter.videoPlayer.videoPlayerOptions.
 #   3. Inside dependencies_met_page_ready, call initHandlers() which
 #      calls setAdapterOptions() on the module's playlistManager and then
 #      instantiates every handler class exported by the module.
 #
 # -----------------------------------------------------------------------------
 # claude - Unique J1 VideoPlayer #1
 # Every getElementById() / DOM lookup in initPlayerUiEvents(),
 # closePlaylist(), and closeEditPlaylist() now receives the scoped player
 # id so all handlers operate on the correct player instance when multiple
 # players are present on the same page.
 #
 # Changes vs. the original adapter:
 #
 #   • initPlayerUiEvents(playerId) — new required parameter; all
 #     getElementById calls are suffixed with '_' + playerId.
 #
 #   • initHandlers(options, playerId) — playerId forwarded from the
 #     per-player Liquid loop and passed through to initPlayerUiEvents()
 #     and to every getElementById call that targets playlist-parent or
 #     playlist-history containers.
 #
 #   • closePlaylist(toggleBtn, toggleSpan, toggleImg, playerId) — optional
 #     playerId parameter; DOM fallbacks use getElementById(id + '_' + playerId).
 #
 #   • closeEditPlaylist(btn, playerId) — same pattern as closePlaylist.
 #
 #   • loadPlayerHTML — unchanged; the XHR anchor id remains player[key].id
 #     (the outer wrapper div), which is not suffixed.
 #
 #   • Per-player Liquid loop — passes '{{player_id}}' as the second
 #     argument to both initHandlers() and initPlayerUiEvents() calls.
 # -----------------------------------------------------------------------------
 #
 # -----------------------------------------------------------------------------
 # claude - J1 VideoPlayer MultiInstance #3
 # Revision bump (20) -> (21): brings the video.js-aligned MULTI-INSTANCE
 # adapter (created at rev 14 alongside core-module MultiInstance #1/#2) up to
 # the CURRENT rev-20 data collection / settings / functionality.
 #
 # The rev-14 multi-instance adapter was based on an older adapter revision and
 # therefore lacked the settings + handler features added on the mainline
 # through rev 20 (config: videoPlayer.settings + videoPlayer_control.settings
 # merge; Unique #7 module-load guard; Modify #29/#36/#38 UI; #39
 # preloadPlaylists; #42 autoLoadFirstEntryOnReload; _resolvePreloadList; ...).
 # This revision starts from the feature-complete rev-20 mainline adapter and
 # re-applies the ONE thing rev 20 still lacks: the multi-instance factory
 # wiring against the rev-55 core module.
 #
 # Change (all tagged "claude - J1 VideoPlayer MultiInstance #3"):
 #   initHandlers(options, playerId) now obtains this player's instance via
 #   the module factory  var vp = videoPlayer(playerId, options)  (create-or-
 #   get, keyed by playerId) and routes EVERY handler through vp.* instead of
 #   the retired singleton surface videoPlayer.* . All original lines are
 #   preserved in place, commented out, per the additive-only convention.
 # -----------------------------------------------------------------------------
{% endcomment %}

{% comment %} Liquid procedures
-------------------------------------------------------------------------------- {% endcomment %}

{% comment %} Set global settings
-------------------------------------------------------------------------------- {% endcomment %}
{% assign environment             = site.environment %}
{% assign asset_path              = "/assets/theme/j1" %}

{% comment %} Process YML config data
================================================================================ {% endcomment %}

{% comment %} Set config files
-------------------------------------------------------------------------------- {% endcomment %}
{% assign template_config         = site.data.j1_config %}
{% assign blocks                  = site.data.blocks %}
{% assign modules                 = site.data.modules %}

{% comment %} Set config data
-------------------------------------------------------------------------------- {% endcomment %}
{% assign videoplayer_default     = modules.defaults.videoPlayer.defaults %}
{% assign videoplayer_settings    = modules.videoPlayer.settings %}
{% assign videoplayer_control     = modules.videoPlayer_control.settings %}

{% comment %} Set config options (deep merge: defaults <- user settings)
-------------------------------------------------------------------------------- {% endcomment %}
{% assign videoplayer_options     = videoplayer_default | merge: videoplayer_settings | merge: videoplayer_control%}
{% assign controls_sorted         = videoplayer_control.players | sort: 'id' %}
{% assign players                 = controls_sorted %}

{% comment %} Detect prod mode
-------------------------------------------------------------------------------- {% endcomment %}
{% assign production = false %}
{% if environment == 'prod' or environment == 'production' %}
  {% assign production = true %}
{% endif %}


/*
 # -----------------------------------------------------------------------------
 # ~/assets/theme/j1/adapter/js/videoPlayer.js (23)
 # J1 Adapter for the module VideoPlayer (native HTML5/videoJS)
 #
 # Product/Info:
 # https://jekyll.one
 #
 # Copyright (C) 2026 Juergen Adams
 #
 # J1 Template is licensed under the MIT License.
 # See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE
 # -----------------------------------------------------------------------------
 #  Adapter generated: {{site.time}}
 # -----------------------------------------------------------------------------
*/

// -----------------------------------------------------------------------------
// ESLint shimming
// -----------------------------------------------------------------------------
/* eslint indent: "off"                                                       */
// -----------------------------------------------------------------------------
"use strict";
j1.adapter.videoPlayer = ((j1, window) => {

  // ---------------------------------------------------------------------------
  // Module-level variables
  // ---------------------------------------------------------------------------

  const env   = '{{environment}}';
  const isDev = (env === 'development' || env === 'dev') ? true : false;

  var videoPlayerDefaults;
  var videoPlayerSettings;
  var videoPlayerOptions;
  var videoPlayers;

  let _this;
  let logger;
  let logText;

  // J1 Adapter optimizations #1
  // safety-bound for the page-ready poller: cleared on success, triggers
  // a warning + cleanup if the page-ready conditions are never met.
  //
  let dependenciesTimeout;

  // date|time
  let startTime;
  let endTime;
  let startTimeModule;
  let endTimeModule;
  let timeSeconds;

  // ---------------------------------------------------------------------------
  // main
  // ---------------------------------------------------------------------------
  return {

    // -------------------------------------------------------------------------
    // adapter initializer
    // -------------------------------------------------------------------------
    init: (options) => {
      var xhrLoadState      = 'pending';                                        // (initial) load state for the HTML portion of the slider
      var load_dependencies = {};
      var dependency;      

      // -----------------------------------------------------------------------
      // default module settings
      // -----------------------------------------------------------------------
      var settings = $.extend({
        module_name: 'j1.adapter.videoPlayer',
        generated:   '{{site.time}}'
      }, options);

      // -----------------------------------------------------------------------
      // global variable settings
      // -----------------------------------------------------------------------
      _this  = j1.adapter.videoPlayer;
      logger = log4javascript.getLogger('j1.adapter.videoPlayer');

      // -----------------------------------------------------------------------
      // merge default + user YAML settings
      // -----------------------------------------------------------------------
      videoPlayerDefaults = $.extend({},   {{videoplayer_default  | replace: 'nil', 'null' | replace: '=>', ':' }});
      videoPlayerSettings = $.extend({},   {{videoplayer_settings | replace: 'nil', 'null' | replace: '=>', ':' }});
      videoPlayers        = $.extend({},   {{videoplayer_control  | replace: 'nil', 'null' | replace: '=>', ':' }});
      videoPlayerOptions  = $.extend(true, {}, videoPlayerDefaults, videoPlayerSettings);

      // update environment setting
      videoPlayerOptions.env = env;

      // Expose the merged options on the adapter object so the module can
      // read them via  j1.adapter.videoPlayer.videoPlayerOptions.
      //
      _this['videoPlayerOptions'] = videoPlayerOptions;

      // load HTML portion for all players
      _this.loadPlayerHTML(videoPlayerOptions, videoPlayers.players);

      // -----------------------------------------------------------------------
      // module initializer
      // -----------------------------------------------------------------------
      var dependencies_met_page_ready = setInterval(() => {
        var pageState      = $('#content').css('display');
        var pageVisible    = (pageState === 'block') ? true : false;
        var j1CoreFinished = (j1.getState() === 'finished') ? true : false;

        if (j1CoreFinished && pageVisible) {
          startTimeModule = Date.now();

          _this.setState('started');
          logger.debug('\n' + 'state: ' + _this.getState());
          logger.info('\n' + 'module is being initialized');

          {% comment %} iterate all players
          ---------------------------------------------------------------------- {% endcomment %}
          {% for video_player in players %}

            {% comment %} create accumulated player data
            player:  {{ player | debug }}
            -------------------------------------------------------------------- {% endcomment %}
            {% assign playlist_match = controls_sorted | where: 'id', video_player.id | first %}
            {% if playlist_match %}
              {% assign player = videoplayer_default | merge: video_player | merge: playlist_match %}
            {% else %}
              {% assign player = videoplayer_default | merge: video_player %}
            {% endif %}          

            {% if player.enabled %}
              {% assign player_id = player.id %}
              logger.debug('\n' + 'found video player on id: ' + '{{player_id}}');

              // claude - Unique J1 VideoPlayer #1
              // create dynamic loader variable to setup the player on id {{player_id}}
              dependency = 'dependencies_met_html_loaded_{{player_id}}';
              load_dependencies[dependency] = '';

              // claude - Unique J1 VideoPlayer #7
              // initialize the player if HTML portion successfully loaded AND
              // the videoPlayer module is already defined.
              //
              // Previously clearInterval() fired unconditionally on every tick,
              // so initHandlers() was called exactly once — even when the module
              // had not finished loading yet — causing the
              // "videoPlayer module not found" guard to abort handler init with
              // no further retry.
              //
              // Fix: keep the interval running until BOTH conditions are true;
              // only then call initHandlers / initPlayerUiEvents and clear.
              //
              load_dependencies['dependencies_met_html_loaded_{{player_id}}'] = setInterval (() => {
                // check if HTML portion of the player is loaded successfully
                xhrLoadState = j1.xhrDOMState['#{{player_id}}_parent'];
                if (xhrLoadState === 'success' && typeof videoPlayer !== 'undefined') {
                  // Initialize UI handlers and PLAYER events
                  // claude - Unique J1 VideoPlayer #1
                  // Pass the scoped player id so every DOM lookup inside
                  // initHandlers / initPlayerUiEvents targets the correct
                  // player instance.
                  //
                  _this.initHandlers(videoPlayerOptions, '{{player_id}}');
                  _this.initPlayerUiEvents('{{player_id}}');
                  clearInterval(load_dependencies['dependencies_met_html_loaded_{{player_id}}']);
                }
              }, 10); // END dependencies_met_html_loaded              

            {% else %}

              logger.info('\n' + 'found player disabled on id: {{player.id}}');
              {% if videoplayer_options.hideDisabled %}
                // hide a grid if disabled
                logger.debug('\n' + 'hide video player disabled on id: {{player.id}}');
                $('#{{player.id}}').hide();
              {% endif %}
            {% endif %} // ENDIF player enabled

          {% endfor %} // ENDFOR (all) grids

          _this.setState('finished');
          logger.debug('\n' + 'state: ' + _this.getState());
          logger.info('\n' + 'initializing module finished');

          endTimeModule = Date.now();
          logger.info('\n' + 'module initializing time: ' + (endTimeModule - startTimeModule) + ' ms');

          clearInterval(dependencies_met_page_ready);

          // J1 Adapter optimizations #1
          // clear the safety timeout on the happy path
          //
          if (dependenciesTimeout) {
            clearTimeout(dependenciesTimeout);
            dependenciesTimeout = null;
          }
        } // END if j1CoreFinished && pageVisible
      }, 10); // END dependencies_met_page_ready

      // J1 Adapter optimizations #1
      // safety bound paired with the 10ms poller above
      //
      dependenciesTimeout = setTimeout(function() {
        if (dependencies_met_page_ready) {
          clearInterval(dependencies_met_page_ready);
          logger.warn('\n' + 'videoPlayer init aborted: page-ready conditions not met within 5s');
        }
      }, 5000);

    }, // END init

    // -------------------------------------------------------------------------
    // loadPlayerHTML()
    // loads the HTML portion via AJAX (j1.loadHTML) for all players configured.
    // NOTE: Make sure the placeholder DIV is available in the content
    // page e.g. using the asciidoc extension masonry::
    // -------------------------------------------------------------------------
    loadPlayerHTML: (options, player) => {
      var numPlayers      = Object.keys(player).length;
      var active_players  = numPlayers;
      var xhr_data_path   = options.xhr_data_path + '/index.html';
      var xhr_container_id;

      isDev && console.debug('number of players found: ' + numPlayers);

      _this.setState('load_data');
      Object.keys(player).forEach((key) => {
        if (player[key].enabled) {
          xhr_container_id = player[key].id + '_parent';

          isDev && console.debug('load HTML portion on player id: ' + player[key].id);
          j1.loadHTML({
            xhr_container_id: xhr_container_id,
            xhr_data_path:    xhr_data_path,
            xhr_data_element: player[key].id
          });
        } else {
          isDev && console.debug('player found disabled on id: ' + player[key].id);
          active_players--;
        }
      });
      isDev && console.debug('players loaded in page enabled|all: ' + active_players + '|' + numPlayers);
      _this.setState('data_loaded');
    }, // END loadPlayerHTML

    // -------------------------------------------------------------------------
    // claude - Unique J1 VideoPlayer #1
    // initPlayerUiEvents(playerId)
    // playerId is now a required parameter.  Every getElementById() call is
    // scoped by appending '_' + playerId to match the uniquified ids emitted
    // by videoPlayer.html.  This allows multiple independent players to
    // coexist on the same page without event-handler collisions.
    // -------------------------------------------------------------------------
    initPlayerUiEvents: (playerId) => {

      // Modify J1 VideoPlayer #1
      // toggle playlist (video_player_container acts as a true toggle)
      //
      // Modify J1 VideoPlayer #5
      // The toggle element is now <button id="toggle_playlist_<playerId>">.
      // querySelector('span') still resolves the sibling <span> inside the
      // parent .video-player-header div; querySelector('img') resolves the
      // child <img> inside the button.  Accessibility attributes (title,
      // aria-label) are now updated on the button itself in both OPEN and
      // CLOSE branches; alt is updated on the child <img>.
      //
      // claude - Unique J1 VideoPlayer #1
      // All element lookups use the scoped id suffix '_' + playerId.
      // -------------------------------------------------------
      var togglePlaylistBtn  = document.getElementById('toggle_playlist_' + playerId);
      var togglePlaylistSpan = togglePlaylistBtn  ? togglePlaylistBtn.closest('.video-player-header').querySelector('span') : null;
      var togglePlaylistImg  = togglePlaylistBtn  ? togglePlaylistBtn.querySelector('img') : null;

      // Modify J1 VideoPlayer #4
      // shared helper: close the playlist and reset the toggle button label/icon.
      // Delegates to the public adapter method j1.adapter.videoPlayer.closePlaylist()
      // so that the module (e.g. doPostOnPlaying) can call it for full toggle-reset
      // without duplicating the DOM logic.
      //
      // claude - Unique J1 VideoPlayer #1
      // playerId forwarded so closePlaylist() targets the right player.
      //
      function _closePlaylist(playerID) {
        _this.closePlaylist(togglePlaylistBtn, togglePlaylistSpan, togglePlaylistImg, playerID);
      } // END _closePlaylist

      if (togglePlaylistBtn !== null) {
        // initialise toggle state
        togglePlaylistBtn.dataset.playlistOpen = 'false';

        // claude - Modify J1 VideoPlayer #36
        // The header <span> (.video-player-header-title) is now the live
        // title display for the currently loaded video. The module pushes
        // entry.title into it on the 'playing' state (see Modify J1
        // VideoPlayer #35); it is no longer a static "Show Playlist" toggle
        // label. A video that is loaded but never played pushes no title, so
        // seed the span with an empty string here at setup time instead of
        // leaving the markup default in place. Subsequent label writes by the
        // toggle handler are disabled below (see #36 OPEN/closePlaylist).
        if (togglePlaylistSpan !== null) { togglePlaylistSpan.textContent = ''; }

        togglePlaylistBtn.addEventListener('click', function(event) {
          // claude - Unique J1 VideoPlayer #1
          var editBtn = document.getElementById('edit_playlist_' + playerId);

          var playlistScreen = document.getElementById('playlist_screen_' + playerId);
          if (playlistScreen === null) return;

          var isOpen = (togglePlaylistBtn.dataset.playlistOpen === 'true');

          if (!isOpen) {
            // ----- OPEN -----
            editBtn.setAttribute('disabled', '');
            editBtn.setAttribute('aria-disabled', 'true');
            editBtn.style.opacity = '0.4';
            editBtn.style.cursor  = 'not-allowed';
            editBtn.title         = 'Hide current playlist first';

            playlistScreen.classList.remove('slide-out-top');
            playlistScreen.classList.add('slide-in-top');
            playlistScreen.style.display = 'block';
            playlistScreen.style.zIndex  = '199';

            togglePlaylistBtn.dataset.playlistOpen = 'true';
            togglePlaylistBtn.title = 'Hide playlist';
            togglePlaylistBtn.setAttribute('aria-label', 'Hide playlist');
            // claude - Modify J1 VideoPlayer #36
            // DISABLED: the header <span> is now the live video-title display
            // (.video-player-header-title, fed by the module per #35). Writing
            // 'Hide Playlist' here would clobber the currently shown title on
            // every toggle. The accessible label still lives on the <button>
            // (title + aria-label above) and the icon swap below, so dropping
            // the span text is purely cosmetic-label removal, not a11y loss.
            // Original line kept for reference:
            // if (togglePlaylistSpan !== null) { togglePlaylistSpan.textContent = 'Hide Playlist'; }
            if (togglePlaylistImg  !== null) {
              togglePlaylistImg.src = '/assets/theme/j1/modules/videoPlayer/icons/player/dark/playlist-hide.svg';
              togglePlaylistImg.alt = 'Hide playlist';
            }
          } else {
            // ----- CLOSE -----
            editBtn.removeAttribute('disabled');
            editBtn.setAttribute('aria-disabled', 'false');
            editBtn.style.removeProperty('opacity');
            editBtn.style.removeProperty('cursor');

            // claude - Unique J1 VideoPlayer #5
            // Pass playerId so closePlaylist() looks up the correct
            // scoped element (playlist_screen_<playerId>) instead of
            // the unsuffixed id which does not exist in the DOM.
            _closePlaylist(playerId);
          }

        }); // END EventListener

        // claude - Modify J1 VideoPlayer #38
        // Make the header title <span> (.video-player-header-title) a second
        // trigger for opening/closing the playlist screen, so a click on the
        // live video title behaves EXACTLY like a click on the
        // <button id="toggle_playlist_<playerId>">.
        //
        // The title span is a sibling of the toggle button inside
        // .video-player-header (it is the same element resolved above as
        // togglePlaylistSpan — the first/only <span> in the header), so a click
        // on it does NOT bubble to the button; a dedicated listener is required.
        //
        // Implementation note: rather than duplicate the OPEN/CLOSE branch logic
        // (icon swap, edit-button gating, slide animation, data-playlistOpen
        // bookkeeping), this listener simply re-dispatches a click on
        // togglePlaylistBtn. That keeps a single source of truth — any future
        // change to the toggle handler is automatically inherited by the title,
        // and the open/close state can never drift between the two triggers.
        //
        // No init-once guard is needed here: initPlayerUiEvents() runs exactly
        // once per player (the load-dependency interval clears immediately after
        // the call), mirroring the unguarded toggle-button listener above.
        var headerTitleSpan = togglePlaylistBtn.closest('.video-player-header')
                                ? togglePlaylistBtn.closest('.video-player-header').querySelector('.video-player-header-title')
                                : null;
        if (headerTitleSpan === null) { headerTitleSpan = togglePlaylistSpan; } // claude - Modify J1 VideoPlayer #38

        if (headerTitleSpan !== null) {
          // claude - Modify J1 VideoPlayer #38
          // Affordance: present the title as interactive and avoid text-selection
          // flicker on repeated toggles. Applied inline so the behaviour ships
          // with the handler and needs no companion CSS rule.
          headerTitleSpan.style.cursor     = 'pointer';
          headerTitleSpan.style.userSelect = 'none';

          headerTitleSpan.addEventListener('click', function(event) {
            // claude - Modify J1 VideoPlayer #38
            // Re-dispatch to the canonical toggle handler (single source of truth).
            togglePlaylistBtn.click();
          }); // END EventListener (header title toggle)
        } // END if headerTitleSpan

      } // END if togglePlaylistBtn

      // hide playlist (secondary close button inside the playlist screen)
      // claude - Unique J1 VideoPlayer #1: scoped id lookup
      // -------------------------------------------------------
      var hidePlaylist = document.getElementById('hide_playlist_video_player_' + playerId);
      if (hidePlaylist !== null) {
        hidePlaylist.addEventListener('click', function(event) {
          // Modify J1 VideoPlayer #1
          // delegate to the shared helper so the toggle button stays in sync
          //
          // claude - Unique J1 VideoPlayer #5
          // Pass playerId so closePlaylist() targets the correct player instance.
          _closePlaylist(playerId);
        }); // END addEventListener
      } // END if hidePlaylist

      // Modify J1 VideoPlayer #7
      // edit playlist button — toggles #playlist_edit_screen_<playerId>.
      // Mirrors the toggle_playlist pattern exactly:
      //
      //   • data-editOpen flag tracks open/closed state on the button itself
      //   • slide-in-top / slide-out-top CSS classes drive the animation
      //   • title, aria-label, and child <img> alt/src are updated on every toggle
      //   • opening the edit screen closes #playlist_screen (mutually exclusive)
      //   • closing the edit screen is also delegated to the public
      //     closeEditPlaylist() adapter method so the module can call it from
      //     any future call-site without duplicating DOM logic
      //
      // claude - Unique J1 VideoPlayer #1
      // Guard flag is now keyed per playerId to prevent duplicate listener
      // registration across multiple players.
      // -------------------------------------------------------
      var editHandlerFlag = '_editPlaylistHandlerInitialized_' + playerId;
      if (!_this[editHandlerFlag]) {
        var editPlaylistBtn = document.getElementById('edit_playlist_' + playerId);
        if (editPlaylistBtn !== null) {

          // shared helper: close the edit screen and reset the button state.
          // claude - Unique J1 VideoPlayer #1: playerId forwarded.
          //
          function _closeEditPlaylist() {
            _this.closeEditPlaylist(editPlaylistBtn, playerId);
          } // END _closeEditPlaylist

          // initialise toggle state
          editPlaylistBtn.dataset.editOpen = 'false';

          editPlaylistBtn.addEventListener('click', function(event) {
            // claude - Unique J1 VideoPlayer #1
            var editScreen = document.getElementById('playlist_edit_screen_' + playerId);
            if (editScreen === null) return;

            var isOpen = (editPlaylistBtn.dataset.editOpen === 'true');

            if (!isOpen) {
              // ----- OPEN -----
              togglePlaylistBtn.setAttribute('disabled', '');
              togglePlaylistBtn.setAttribute('aria-disabled', 'true');
              togglePlaylistBtn.style.opacity = '0.4';
              togglePlaylistBtn.style.cursor  = 'not-allowed';
              togglePlaylistBtn.title         = 'Hide current playlist first';

              // close the playlist panel first (mutually exclusive)
              //
              // claude - Unique J1 VideoPlayer #5
              // Pass playerId so closePlaylist() targets the correct
              // scoped element (playlist_screen_<playerId>) instead of
              // the unsuffixed id which does not exist in the DOM.
              _closePlaylist(playerId);

              // claude - Modify J1 VideoPlayer #29
              // Overlay the edit screen ON TOP OF the video container box
              // (mirrors the amplitude compact-player list view behaviour).
              //
              // The edit screen stays a SIBLING of #video_container_<id> in
              // the DOM — it is NEVER moved inside the container — so it is
              // immune to the innerHTML rebuilds performed by the import and
              // load-from-server flows. We position it absolutely over the
              // container using the container's live box geometry, while the
              // player keeps running underneath, fully covered by the opaque
              // overlay. A resize handler keeps the overlay aligned while open.
              var _vpEditVideoContainer = document.getElementById('video_container_' + playerId);
              var _vpEditPlayerWrapper  = document.getElementById(playerId);
              if (_vpEditVideoContainer !== null && _vpEditPlayerWrapper !== null) {
                // Guarantee a positioning context on the player wrapper so the
                // absolutely positioned edit screen anchors to it. The HTML
                // template already declares position:relative, but we re-assert
                // it here defensively in case the inline style is absent.
                if (window.getComputedStyle(_vpEditPlayerWrapper).position === 'static') {
                  _vpEditPlayerWrapper.style.position = 'relative';
                }

                var _vpPositionEditOverlay = function() {
                  editScreen.style.position   = 'absolute';
                  editScreen.style.top        = _vpEditVideoContainer.offsetTop + 'px';
                  editScreen.style.left       = _vpEditVideoContainer.offsetLeft + 'px';
                  editScreen.style.width      = _vpEditVideoContainer.offsetWidth + 'px';
                  editScreen.style.height     = _vpEditVideoContainer.offsetHeight + 'px';
                  editScreen.style.margin     = '0';
                  editScreen.style.overflowY  = 'auto';
                  editScreen.style.boxSizing  = 'border-box';
                  editScreen.style.background = 'var(--card-background)';
                }; // END _vpPositionEditOverlay

                _vpPositionEditOverlay();

                // Keep the overlay aligned with the container on viewport
                // resize while it is open. The handler reference is stashed on
                // the element so closeEditPlaylist() can detach it.
                editScreen._vpEditResizeHandler = _vpPositionEditOverlay;
                window.addEventListener('resize', editScreen._vpEditResizeHandler);
              }

              editScreen.classList.remove('slide-out-top');
              editScreen.classList.add('slide-in-top');
              editScreen.style.display = 'block';
              editScreen.style.zIndex  = '199';

              editPlaylistBtn.dataset.editOpen = 'true';
              editPlaylistBtn.title = 'Close playlist editor';
              editPlaylistBtn.setAttribute('aria-label', 'Close playlist editor');
              var editImg = editPlaylistBtn.querySelector('img');
              if (editImg !== null) {
                editImg.src = '/assets/theme/j1/modules/videoPlayer/icons/player/dark/playlist-edit-close.svg';
                editImg.alt = 'Close playlist editor';
              }

            } else {
              // ----- CLOSE -----
              togglePlaylistBtn.removeAttribute('disabled');
              togglePlaylistBtn.setAttribute('aria-disabled', 'false');
              togglePlaylistBtn.style.removeProperty('opacity');
              togglePlaylistBtn.style.removeProperty('cursor');

              _closeEditPlaylist();
            }

          }); // END addEventListener

          _this[editHandlerFlag] = true;
          logger.debug('\n' + 'initPlayerUiEvents: editPlaylistHandler [' + playerId + '] — OK');
        } else {
          logger.warn('\n' + 'initPlayerUiEvents: editPlaylistHandler skipped — edit_playlist_' + playerId + ' button not found');
        }
      } // END if !editHandlerFlag

    },

    // -------------------------------------------------------------------------
    // Fix J1 VideoPlayer #1
    // initHandlers(options, playerId)
    // Initialize all playlist and UI handler classes exported by the
    // videoPlayer module.  Called from within dependencies_met_page_ready
    // once the J1 core and the page are both ready.
    //
    // claude - Unique J1 VideoPlayer #1
    // playerId (new second parameter) is used to scope every getElementById
    // call so handlers operate on the correct player when multiple players
    // are present on the same page.
    //
    // Handler init order mirrors the skipad adapter:
    //
    //   1. setAdapterOptions             — write merged options into the module scope
    //   2. playlistIOHandler             — import / export / clear / server-load buttons
    //   3. playlistSearchHandler         — live search + clear
    //   4. playlistModeSwitchHandler     — cards ↔ list toggle
    //   5. playlistMergeSwitchHandler    — merge-mode toggle
    //   6. playlistLoopSwitchHandler     — loop-mode toggle
    //   7. playlistSortHandler           — sort <select>
    //   8. inputWrapperHandler           — URL input + paste + load-video button
    //   9. inputValueBackgroundHandler   — input fill-state background sync
    //  10. navbarSmoothScrollHandler     — same-page anchor smooth-scroll
    //  11. preloadPlaylists              — load the per-player `playlist.preload` files
    //  13. loadFirstAfterPreload         — fresh-visit path: load the first entry (paused) once the async #39 preload has merged  // claude - J1 VideoPlayer MultiInstance #7
    //
    // -------------------------------------------------------------------------
    initHandlers: (options, playerId) => {

      logger.info('\n' + `initializing playlist handlers started: ${playerId}`);

      // Guard: videoPlayer module must be loaded before the adapter tries
      // to call its API.
      //
      if (typeof videoPlayer === 'undefined') {
        logger.error('\n' + 'initHandlers: videoPlayer module not found — handlers NOT initialized');
        return;
      }

      // claude - J1 VideoPlayer MultiInstance #3
      // The videoPlayer module is no longer a singleton object exposing
      // playlistManager / the handler classes directly. It is now a video.js-
      // style callable factory  videoPlayer(id, options)  (see the module's
      // MultiInstance #2 section) that returns ONE VideoPlayer instance per
      // player id (create-or-get). Obtain THIS player's instance and route
      // every handler through it (vp.*) instead of the retired module surface
      // (videoPlayer.*). options are handed to the factory so the constructor
      // applies setAdapterOptions() on creation; the explicit setAdapterOptions()
      // call below stays valid (idempotent).
      var vp;
      try {
        vp = videoPlayer(playerId, options);
      } catch (e) {
        logger.error('\n' + 'initHandlers: videoPlayer(playerId, options) factory failed [' + playerId + ']: ' + e);
        return;
      }
      if (!vp) {
        logger.error('\n' + 'initHandlers: no videoPlayer instance for id "' + playerId + '" — handlers NOT initialized');
        return;
      }

      // 1. Push the merged adapter options into the module scope so that
      //    all module-internal code that reads the module-level variable
      //    `videoPlayerOptions` (set via j1.adapter.videoPlayer.videoPlayerOptions)
      //    and the playlistManager-level `adapterOptions` / `isDev` have
      //    consistent, adapter-sourced values.
      //
      try {
        // claude - J1 VideoPlayer MultiInstance #3
        // Original (deprecated, preserved for reference):
        // videoPlayer.playlistManager.setAdapterOptions(options);
        vp.playlistManager.setAdapterOptions(options);
        // claude - fixed Unique J1 VideoPlayer #2, z.B. 'player_1'
        // Original (deprecated, preserved for reference):
        // videoPlayer.playlistManager.setPlayerID(playerId);
        vp.playlistManager.setPlayerID(playerId);

        logger.debug('\n' + 'initHandlers: setAdapterOptions — OK');
      } catch (e) {
        logger.error('\n' + 'initHandlers: setAdapterOptions failed: ' + e);
      }

      // 2. playlistIOHandler — import / export / clear / server-playlist buttons
      //
      if (options.playlist && options.playlist.enabled) {
        try {
          // claude - J1 VideoPlayer MultiInstance #3
          // Original (deprecated, preserved for reference):
          // new videoPlayer.playlistIOHandler(options);
          new vp.playlistIOHandler(options);
          logger.debug('\n' + 'initHandlers: playlistIOHandler — OK');
        } catch (e) {
          logger.error('\n' + 'initHandlers: playlistIOHandler failed: ' + e);
        }
      } else {
        logger.info('\n' + 'initHandlers: playlistIOHandler skipped (playlist disabled)');
      }

      // Fix J1 VideoPlayer #2
      // ID corrected from 'playlistHistory' (non-existent) to
      // 'videoplayer_playlist_parent' to match the actual page element.
      //
      // Fix J1 VideoPlayer #4
      // 2a. initPlayHandler — listen for the 'playlist-play' CustomEvent bubbled
      //     from PlaylistCards._onPlayClick() and forward it to the module's
      //     play logic.
      //
      // claude - Unique J1 VideoPlayer #1
      // Element id is now 'videoplayer_playlist_parent_' + playerId.
      //
      if (options.playlist && options.playlist.enabled) {
        try {
          const playlistParent = document.getElementById('videoplayer_playlist_parent_' + playerId);
          if (playlistParent) {
            playlistParent.addEventListener('playlist-play', (e) => {
              const videoId = e.detail && e.detail.videoId;
              // claude - J1 VideoPlayer MultiInstance #3
              // Original (deprecated, preserved for reference):
              // if (videoId && typeof videoPlayer.loadAndPlay === 'function') {
              if (videoId && typeof vp.loadAndPlay === 'function') {
                // Original (deprecated, preserved for reference):
                // videoPlayer.loadAndPlay(videoId);
                vp.loadAndPlay(videoId);
              }
            });
            logger.debug('\n' + 'initHandlers: initPlayHandler (event listener) [' + playerId + '] — OK');
          } else {
            logger.warn('\n' + 'initHandlers: initPlayHandler skipped — #videoplayer_playlist_parent_' + playerId + ' not found');
          }
        } catch (e) {
          logger.error('\n' + 'initHandlers: initPlayHandler failed: ' + e);
        }
      } else {
        logger.info('\n' + 'initHandlers: initPlayHandler skipped (playlist disabled)');
      }

      // Fix J1 VideoPlayer #4
      // 2b. initDeleteHandler — listen for the 'playlist-delete' CustomEvent
      //     bubbled from PlaylistCards._onDeleteClick() and forward it to the
      //     module's delete logic.
      //
      // claude - Unique J1 VideoPlayer #1
      // Element id is now 'videoplayer_playlist_parent_' + playerId.
      //
      if (options.playlist && options.playlist.enabled) {
        try {
          const playlistParent = document.getElementById('videoplayer_playlist_parent_' + playerId);
          if (playlistParent) {
            playlistParent.addEventListener('playlist-delete', (e) => {
              const videoId = e.detail && e.detail.videoId;
              // claude - J1 VideoPlayer MultiInstance #3
              // Original (deprecated, preserved for reference):
              // if (videoId && typeof videoPlayer.deleteEntry === 'function') {
              if (videoId && typeof vp.deleteEntry === 'function') {
                // Original (deprecated, preserved for reference):
                // videoPlayer.deleteEntry(videoId);
                vp.deleteEntry(videoId);
              }
            });
            logger.debug('\n' + 'initHandlers: initDeleteHandler (event listener) [' + playerId + '] — OK');
          } else {
            logger.warn('\n' + 'initHandlers: initDeleteHandler skipped — #videoplayer_playlist_parent_' + playerId + ' not found');
          }
        } catch (e) {
          logger.error('\n' + 'initHandlers: initDeleteHandler failed: ' + e);
        }
      } else {
        logger.info('\n' + 'initHandlers: initDeleteHandler skipped (playlist disabled)');
      }

      // 3. playlistSearchHandler — live full-text search
      //
      if (options.playlist && options.playlist.enabled &&
          options.playlist.search && options.playlist.search.enabled) {
        try {

          // claude - J1 VideoPlayer MultiInstance #3
          // Original (deprecated, preserved for reference):
          // new videoPlayer.playlistSearchHandler();
          new vp.playlistSearchHandler();
          logger.debug('\n' + 'initHandlers: playlistSearchHandler — OK');
        } catch (e) {
          logger.error('\n' + 'initHandlers: playlistSearchHandler failed: ' + e);
        }
      } else {
        logger.info('\n' + 'initHandlers: playlistSearchHandler skipped (search disabled)');
      }

      // 4. playlistModeSwitchHandler — cards ↔ list display mode toggle
      //
      if (options.playlist && options.playlist.enabled &&
          options.playlist.modeSwitch && options.playlist.modeSwitch.enabled) {
        try {
          // claude - J1 VideoPlayer MultiInstance #3
          // Original (deprecated, preserved for reference):
          // new videoPlayer.playlistModeSwitchHandler(options);
          new vp.playlistModeSwitchHandler(options);
          logger.debug('\n' + 'initHandlers: playlistModeSwitchHandler — OK');
        } catch (e) {
          logger.error('\n' + 'initHandlers: playlistModeSwitchHandler failed: ' + e);
        }
      } else {
        logger.info('\n' + 'initHandlers: playlistModeSwitchHandler skipped (playlist disabled)');
      }

      // 5. playlistMergeSwitchHandler — merge-mode toggle
      //
      if (options.playlist && options.playlist.enabled &&
          options.playlist.mergeSwitch && options.playlist.mergeSwitch.enabled) {
        try {
          // claude - J1 VideoPlayer MultiInstance #3
          // Original (deprecated, preserved for reference):
          // new videoPlayer.playlistMergeSwitchHandler(options);
          new vp.playlistMergeSwitchHandler(options);
          logger.debug('\n' + 'initHandlers: playlistMergeSwitchHandler — OK');
        } catch (e) {
          logger.error('\n' + 'initHandlers: playlistMergeSwitchHandler failed: ' + e);
        }
      } else {
        logger.info('\n' + 'initHandlers: playlistMergeSwitchHandler skipped (playlist disabled)');
      }

      // 6. playlistLoopSwitchHandler — loop-mode toggle
      //
      if (options.playlist && options.playlist.enabled &&
          options.playlist.loop && options.playlist.loop.enabled !== undefined) {
        try {
          // claude - J1 VideoPlayer MultiInstance #3
          // Original (deprecated, preserved for reference):
          // new videoPlayer.playlistLoopSwitchHandler(options);
          new vp.playlistLoopSwitchHandler(options);
          logger.debug('\n' + 'initHandlers: playlistLoopSwitchHandler — OK');
        } catch (e) {
          logger.error('\n' + 'initHandlers: playlistLoopSwitchHandler failed: ' + e);
        }
      } else {
        logger.info('\n' + 'initHandlers: playlistLoopSwitchHandler skipped (loop config absent)');
      }

      // 7. playlistSortHandler — sort criterion <select>
      //
      if (options.playlist && options.playlist.enabled &&
          options.playlist.sort && options.playlist.sort.enabled) {
        try {
          // claude - J1 VideoPlayer MultiInstance #3
          // Original (deprecated, preserved for reference):
          // new videoPlayer.playlistSortHandler();
          new vp.playlistSortHandler();
          logger.debug('\n' + 'initHandlers: playlistSortHandler — OK');
        } catch (e) {
          logger.error('\n' + 'initHandlers: playlistSortHandler failed: ' + e);
        }
      } else {
        logger.info('\n' + 'initHandlers: playlistSortHandler skipped (sort disabled)');
      }

      // 8. inputWrapperHandler — URL input field, paste button, load-video button
      //
      try {
        // claude - J1 VideoPlayer MultiInstance #3
        // Original (deprecated, preserved for reference):
        // new videoPlayer.inputWrapperHandler();
        new vp.inputWrapperHandler();
        logger.debug('\n' + 'initHandlers: inputWrapperHandler — OK');
      } catch (e) {
        logger.error('\n' + 'initHandlers: inputWrapperHandler failed: ' + e);
      }

      // 9. inputValueBackgroundHandler — visual fill-state sync on all inputs
      //
      try {
        // claude - J1 VideoPlayer MultiInstance #3
        // Original (deprecated, preserved for reference):
        // videoPlayer.inputValueBackgroundHandler();
        vp.inputValueBackgroundHandler();
        logger.debug('\n' + 'initHandlers: inputValueBackgroundHandler — OK');
      } catch (e) {
        logger.error('\n' + 'initHandlers: inputValueBackgroundHandler failed: ' + e);
      }

      // 10. navbarSmoothScrollHandler — smooth-scroll for same-page nav links
      //
      if (options.smoothScroll && options.smoothScroll.enabled) {
        try {
          // claude - J1 VideoPlayer MultiInstance #3
          // Original (deprecated, preserved for reference):
          // videoPlayer.navbarSmoothScrollHandler();
          vp.navbarSmoothScrollHandler();
          logger.debug('\n' + 'initHandlers: navbarSmoothScrollHandler — OK');
        } catch (e) {
          logger.error('\n' + 'initHandlers: navbarSmoothScrollHandler failed: ' + e);
        }
      } else {
        logger.info('\n' + 'initHandlers: navbarSmoothScrollHandler skipped (smoothScroll disabled)');
      }

      logger.info('\n' + 'initializing playlist handlers [' + playerId + ']: finished');

      // claude - Modify J1 VideoPlayer #39
      // 11. preloadPlaylists — load the per-player `playlist.preload` files
      //     (configured in videoPlayer_control.yml) into this instance's
      //     localStorage on page load. The preload list is resolved from the
      //     raw control settings by player id (_resolvePreloadList); the module
      //     resolves relative file names against `playlist_url_base` and MERGES
      //     them (non-destructive, idempotent) before rebuilding the search
      //     index and re-rendering the panel. The call is async / non-blocking.
      //
      if (options.playlist && options.playlist.enabled) {
        try {
          var preloadList = _this._resolvePreloadList(playerId);
          if (preloadList && preloadList.length &&
              // claude - J1 VideoPlayer MultiInstance #3
              // Original (deprecated, preserved for reference):
              // typeof videoPlayer.playlistManager.preloadPlaylists === 'function') {
              typeof vp.playlistManager.preloadPlaylists === 'function') {
            var preloadBase = (options && options.playlist_url_base) ? options.playlist_url_base : null;
            // Original (deprecated, preserved for reference):
            // videoPlayer.playlistManager.preloadPlaylists(preloadList, preloadBase, playerId);
            vp.playlistManager.preloadPlaylists(preloadList, preloadBase, playerId);
            logger.debug('\n' + 'initHandlers: preloadPlaylists dispatched [' + playerId + '] (' + preloadList.length + ' file(s))');
          } else {
            logger.info('\n' + 'initHandlers: preloadPlaylists skipped — none configured [' + playerId + ']');
          }
        } catch (e) {
          logger.error('\n' + 'initHandlers: preloadPlaylists failed: ' + e);
        }
      } else {
        logger.info('\n' + 'initHandlers: preloadPlaylists skipped (playlist disabled)');
      }

      // claude - Modify J1 VideoPlayer #42
      // 12. autoLoadFirstEntryOnReload — explicit adapter-side trigger for the
      //     "first stored-playlist entry loaded in the paused state on (re)load"
      //     behaviour introduced in the core module as #41.
      //
      //     #41 wired this from inside the core module's page-global
      //     playlistSortHandler.init() (which resolves '.playlist-block-title' /
      //     '#playlistSortSelect' WITHOUT _pid(), so it only ever targets the
      //     playlistManager's *current* player scope). This adapter-side call is
      //     the explicit counterpart requested after #41: it runs here inside the
      //     per-player initHandlers(options, playerId) loop, AFTER setPlayerID(
      //     playerId) (step 1) has scoped the playlistManager to THIS instance and
      //     AFTER the player + videojs + videoPlayerOptions are wired, so
      //     embedRunVideo() is callable and the stored playlist is read from the
      //     correct per-instance localStorage namespace (#40).
      //
      //     Placed after the #39 preloadPlaylists dispatch on purpose:
      //     autoLoadFirstEntryOnReload() acts ONLY on an ALREADY-stored playlist
      //     (it never fetches/merges), so it does not depend on the async preload
      //     completing — on a reload the stored entries are available immediately.
      //
      //     Safe to run alongside the #41 sort-handler hook: the method is guarded
      //     by the module-level once-only flag _autoLoadFirstOnReloadDone, so
      //     whichever path fires first consumes the flag and the other becomes an
      //     inert no-op — the first entry is never double-loaded. It also no-ops on
      //     an empty / absent stored playlist (fresh first visit, autoStart path
      //     untouched) and skips WITHOUT consuming the flag if the adapter is not
      //     ready yet.
      //
      //     DESIGN NOTE (flagged for review): the #41 once-only guard is
      //     module-level, NOT keyed by playerId. On a multi-player page only the
      //     FIRST player to reach an auto-load path restores its paused first
      //     entry; later players are skipped by the guard. Making this truly
      //     per-instance requires keying that guard by playerId in the core module
      //     (candidate #43). This adapter call is already positioned correctly for
      //     that future change.
      //
      //     To make this the SOLE trigger ("instead of" the sort-handler hook),
      //     remove the autoLoadFirstEntryOnReload() invocation from the core
      //     module's playlistSortHandler.init(); this call then becomes the single,
      //     deterministic, per-player-scoped trigger.
      //
      if (options.playlist && options.playlist.enabled) {
        try {
          // claude - J1 VideoPlayer MultiInstance #3
          // Original (deprecated, preserved for reference):
          if (vp.playlistManager &&
              // Original (deprecated, preserved for reference):
              // typeof videoPlayer.playlistManager.autoLoadFirstEntryOnReload === 'function') { // claude - Modify J1 VideoPlayer #42
              typeof vp.playlistManager.autoLoadFirstEntryOnReload === 'function') {
            // Original (deprecated, preserved for reference):
            // var autoLoaded = videoPlayer.playlistManager.autoLoadFirstEntryOnReload();      // claude - Modify J1 VideoPlayer #42
            var autoLoaded = vp.playlistManager.autoLoadFirstEntryOnReload();
            logger.debug('\n' + 'initHandlers: autoLoadFirstEntryOnReload [' + playerId + '] — ' + (autoLoaded ? 'loaded first stored entry (paused)' : 'no-op (none stored / already done / not ready)')); // claude - Modify J1 VideoPlayer #42

            // claude - J1 VideoPlayer MultiInstance #7
            // FRESH-VISIT PRELOAD LOAD
            // When a playlist is PRELOADED for this player, the first entry must
            // be loaded (paused) even on a FRESH first visit — not only on a
            // later reload. The #42 call above no-ops on a fresh visit because
            // the #39 preloadPlaylists fetch+merge is async and this instance's
            // per-player store (#40) is still empty at this point, so
            // autoLoadFirstEntryOnReload() returns falsy (autoLoaded === false).
            //
            //   autoLoaded === true  → RELOAD path: the store was already
            //                          populated, the first entry was loaded and
            //                          the once-per-page guard consumed — no
            //                          preload-wait is needed, nothing to do.
            //   autoLoaded === false → FRESH-VISIT path: if a preload list IS
            //                          configured for this player, wait for the
            //                          async #39 merge and THEN load the first
            //                          entry; if NO preload list is configured
            //                          leave the autoStart path untouched (this
            //                          preserves the #42 fresh-visit contract).
            //
            // _loadFirstAfterPreload() re-uses the SAME paused first-entry load
            // (autoLoadFirstEntryOnReload) via a bounded, self-cancelling retry,
            // so behaviour is identical to the reload path and the module's
            // once-per-page guard still prevents any double-load.
            //
            // DESIGN NOTE (flagged for jadams/Juergen review):
            //
            //   • The retry re-invokes autoLoadFirstEntryOnReload(). This assumes
            //     the early (empty-store) #42 call does NOT consume the
            //     once-per-page guard _autoLoadFirstOnReloadDone — it returned
            //     falsy, i.e. nothing was loaded. If a future core-module change
            //     makes the empty-store call consume the guard, this retry would
            //     silently time out and behaviour would fall back to exactly
            //     today's (first entry appears on the NEXT reload) — no
            //     regression, but the fresh-visit load would be lost. Keep the
            //     "load nothing ⇒ do not set done" invariant in the core module.
            //   • Per-player correctness of the deferred load depends on the
            //     per-player guard keying added in the core module (#43/#44);
            //     the retry re-scopes the shared singleton via setPlayerID()
            //     before every attempt (see _loadFirstAfterPreload) because
            //     other players' initHandlers() may re-scope it in between.
            //
            // claude - J1 VideoPlayer MultiInstance #7
            try {
              var preloadConfigured = _this._resolvePreloadList(playerId);
              if (!autoLoaded && preloadConfigured && preloadConfigured.length) {
                logger.debug('\n' + 'initHandlers: fresh visit with preload [' + playerId + '] — scheduling loadFirstAfterPreload');
                _this._loadFirstAfterPreload(vp, playerId);
              } else {
                logger.debug('\n' + 'initHandlers: loadFirstAfterPreload not needed [' + playerId + '] (' + (autoLoaded ? 'reload path — already loaded' : 'no preload configured') + ')');
              }
            } catch (e) {
              logger.error('\n' + 'initHandlers: loadFirstAfterPreload dispatch failed [' + playerId + ']: ' + e);
            }
          } else {
            logger.info('\n' + 'initHandlers: autoLoadFirstEntryOnReload skipped — method not present (core module predates #41) [' + playerId + ']');
          }
        } catch (e) {
          logger.error('\n' + 'initHandlers: autoLoadFirstEntryOnReload failed: ' + e);
        }
      } else {
        logger.info('\n' + 'initHandlers: autoLoadFirstEntryOnReload skipped (playlist disabled)');
      }

      logger.info('\n' + 'initializing playlist handlers [' + playerId + ']: finished');

    }, // END initHandlers

    // -------------------------------------------------------------------------
    // claude - Modify J1 VideoPlayer #39
    // _resolvePreloadList(playerId)
    // Returns the `playlist.preload` array configured for the given player id in
    // the user control settings (videoPlayer_control.yml), or an empty array
    // when none is configured. Read from the RAW control object
    // (videoPlayers.players) rather than the global-merged videoPlayerOptions,
    // so per-player preload keys are not flattened away by the defaults merge.
    // -------------------------------------------------------------------------
    _resolvePreloadList: (playerId) => {
      try {
        var players = (videoPlayers && Array.isArray(videoPlayers.players))
          ? videoPlayers.players
          : [];
        for (var i = 0; i < players.length; i++) {
          var p = players[i];
          if (p && p.id === playerId && p.playlist && Array.isArray(p.playlist.preload)) {
            return p.playlist.preload;
          }
        }
      } catch (e) {
        logger.error('\n' + '_resolvePreloadList failed: ' + e);
      }
      return [];
    }, // END _resolvePreloadList

    // -------------------------------------------------------------------------
    // claude - J1 VideoPlayer MultiInstance #7
    // _loadFirstAfterPreload(vp, playerId)
    // Deferred, per-player "load the first playlist entry (paused)" trigger for
    // the FRESH-VISIT case, where the #39 preloadPlaylists fetch+merge has not
    // populated this instance's store yet at initHandlers() time (see the #7
    // dispatch inside the #42 block).
    //
    // The #39 preload is async / non-blocking and (in the current core module)
    // does not return a thenable the adapter can await, so this uses a bounded,
    // self-cancelling retry: it re-attempts the established paused first-entry
    // load (autoLoadFirstEntryOnReload) until it succeeds (returns truthy) or a
    // hard cap is reached. Because that method is idempotent and guarded by the
    // core module's once-per-page flag, repeated calls never double-load.
    //
    // Correctness notes:
    //   • setPlayerID(playerId) is re-applied before EVERY attempt: the
    //     playlistManager is a module-level singleton, and other players'
    //     initHandlers()/retries may re-scope it between our async ticks.
    //   • The retry stops on the FIRST successful load; on a store that never
    //     fills (e.g. a preload fetch failure) it stops after MAX_ATTEMPTS with
    //     an info log and no side effects — behaviour then matches today's
    //     (first entry appears on the next reload).
    // -------------------------------------------------------------------------
    _loadFirstAfterPreload: (vp, playerId) => {
      try {
        if (!vp || !vp.playlistManager ||
            typeof vp.playlistManager.autoLoadFirstEntryOnReload !== 'function') {
          logger.info('\n' + '_loadFirstAfterPreload: skipped — autoLoadFirstEntryOnReload not available [' + playerId + ']');
          return;
        }

        var MAX_ATTEMPTS = 40;   // 40 × 250ms ≈ 10s ceiling for the async preload merge
        var INTERVAL_MS  = 250;
        var attempts     = 0;

        var poll = setInterval(function () {
          attempts++;
          try {
            // Re-scope the shared singleton to THIS player before probing/loading.
            if (typeof vp.playlistManager.setPlayerID === 'function') {
              vp.playlistManager.setPlayerID(playerId);
            }
            var loaded = vp.playlistManager.autoLoadFirstEntryOnReload();
            if (loaded) {
              clearInterval(poll);
              logger.debug('\n' + '_loadFirstAfterPreload: first entry loaded (paused) after preload [' + playerId + '] (attempt ' + attempts + ')');
              return;
            }
          } catch (e) {
            clearInterval(poll);
            logger.error('\n' + '_loadFirstAfterPreload: retry failed [' + playerId + ']: ' + e);
            return;
          }
          if (attempts >= MAX_ATTEMPTS) {
            clearInterval(poll);
            logger.info('\n' + '_loadFirstAfterPreload: gave up after ' + attempts + ' attempts — preload store not ready [' + playerId + '] (first entry will load on next reload)');
          }
        }, INTERVAL_MS);
      } catch (e) {
        logger.error('\n' + '_loadFirstAfterPreload failed [' + playerId + ']: ' + e);
      }
    }, // END _loadFirstAfterPreload

    // -------------------------------------------------------------------------
    // Modify J1 VideoPlayer #4
    // closePlaylist(toggleBtn, toggleSpan, toggleImg, playerId)
    // Public adapter method that closes the playlist panel and fully resets the
    // toggle button (label + icon + data-state) to its "Show Playlist" state.
    //
    // Promoted from the private _closePlaylist() closure in initPlayerUiEvents()
    // so the module can call  j1.adapter.videoPlayer.closePlaylist()  from
    // doPostOnPlaying (and any future call site) without duplicating DOM logic.
    //
    // Parameters are optional — when called without arguments the method looks
    // the elements up from the DOM itself (safe for calls originating outside
    // initPlayerUiEvents where the closure variables are not in scope).
    //
    // Modify J1 VideoPlayer #5
    // The toggle element is now a <button id="toggle_playlist_<playerId>"> that
    // wraps a child <img> (icon) and the outer <span> sibling (label text).
    // Accessibility attributes (title, aria-label) are updated on the button
    // itself; alt is updated on the child <img>.
    //
    // claude - Unique J1 VideoPlayer #1
    // playerId (new optional fourth parameter) is appended to every
    // getElementById fallback so the correct player instance is targeted
    // when called from outside initPlayerUiEvents (e.g. from the module).
    // -------------------------------------------------------------------------
    closePlaylist: (toggleBtn, toggleSpan, toggleImg, playerId) => {
      // claude - Unique J1 VideoPlayer #1
      var pid            = playerId || '';
      var idSuffix       = pid ? '_' + pid : '';
      var playlistScreen = document.getElementById('playlist_screen' + idSuffix);
      if (playlistScreen === null) return;

      playlistScreen.classList.remove('slide-in-top');
      playlistScreen.classList.add('slide-out-top');
      playlistScreen.style.display = 'none';
      playlistScreen.style.zIndex  = '1';

      // Resolve button references — use the caller-supplied ones (fast path inside
      // initPlayerUiEvents) or fall back to fresh DOM lookups (call from module).
      var btn  = toggleBtn  || document.getElementById('toggle_playlist' + idSuffix);
      var span = toggleSpan || (btn ? btn.querySelector('span') : null);
      var img  = toggleImg  || (btn ? btn.querySelector('img')  : null);

      // Reset toggle button to "Show Playlist" state
      if (btn !== null) {
        btn.dataset.playlistOpen = 'false';
        // Modify J1 VideoPlayer #5
        // Update accessibility attributes on the <button> element itself.
        btn.title = 'Show playlist';
        btn.setAttribute('aria-label', 'Show playlist');
        // claude - Modify J1 VideoPlayer #36
        // DISABLED: the header <span> is now the live video-title display
        // (.video-player-header-title, fed by the module per #35). Writing
        // 'Show Playlist' here on close would clobber the currently shown
        // title. The accessible label is preserved on the <button>
        // (title + aria-label above) and via the icon swap below.
        // Original line kept for reference:
        // if (span !== null) { span.textContent = 'Show Playlist'; }
        if (img  !== null) {
          img.src = '/assets/theme/j1/modules/videoPlayer/icons/player/dark/playlist-show.svg';
          img.alt = 'Show playlist';
        }
      }

      // Re-enable body scrolling
      if ($('body').hasClass('stop-scrolling')) {
        $('body').removeClass('stop-scrolling');
      }

      // claude - Modify J1 VideoPlayer #12
      // Re-enable the edit_playlist button now that the playlist panel
      // is closed. The button was disabled when the playlist was opened
      // (see OPEN branch in the toggle_playlist click listener) to make the
      // mutual-exclusion constraint visible.
      // Restore the default "Manage playlist" state so the user can open
      // the editor from the closed-playlist baseline.
      //
      // claude - Unique J1 VideoPlayer #1: scoped id lookup.
      //
      var editBtn = document.getElementById('edit_playlist' + idSuffix);
      if (editBtn !== null) {
        editBtn.disabled = false;
        editBtn.classList.remove('disabled');
        editBtn.setAttribute('aria-disabled', 'false');
        editBtn.title = 'Manage playlist';
        editBtn.setAttribute('aria-label', 'Manage playlist');
      }
    }, // END closePlaylist

    // -------------------------------------------------------------------------
    // Modify J1 VideoPlayer #7
    // closeEditPlaylist(btn, playerId)
    // Public adapter method that closes the playlist-edit panel and fully
    // resets the edit_playlist button (icon + data-state + accessibility
    // attributes) to its "Manage playlist" state.
    //
    // Promoted to the public adapter API - parallel to closePlaylist() - so
    // the module can call  j1.adapter.videoPlayer.closeEditPlaylist() from any
    // future call-site (e.g. doPostOnPlaying) without duplicating DOM logic.
    //
    // The optional btn parameter is supplied by the _closeEditPlaylist()
    // closure inside initPlayerUiEvents() for a fast path; external callers
    // omit it and the method falls back to a fresh DOM lookup.
    //
    // claude - Unique J1 VideoPlayer #1
    // playerId (new optional second parameter) is appended to every
    // getElementById fallback so the correct player instance is targeted.
    // -------------------------------------------------------------------------
    closeEditPlaylist: (btn, playerId) => {
      // claude - Unique J1 VideoPlayer #1
      var pid      = playerId || '';
      var idSuffix = pid ? '_' + pid : '';

      var editScreen = document.getElementById('playlist_edit_screen' + idSuffix);
      if (editScreen === null) return;

      // claude - Modify J1 VideoPlayer #29
      // Tear down the overlay positioning applied on OPEN: detach the resize
      // handler and strip the inline geometry styles so the edit screen
      // returns to its original (hidden, sibling) layout state. Safe to run
      // even if the overlay path never executed (idempotent).
      if (editScreen._vpEditResizeHandler) {
        window.removeEventListener('resize', editScreen._vpEditResizeHandler);
        editScreen._vpEditResizeHandler = null;
      }
      editScreen.style.removeProperty('position');
      editScreen.style.removeProperty('top');
      editScreen.style.removeProperty('left');
      editScreen.style.removeProperty('width');
      editScreen.style.removeProperty('height');
      editScreen.style.removeProperty('margin');
      editScreen.style.removeProperty('overflow-y');
      editScreen.style.removeProperty('box-sizing');
      editScreen.style.removeProperty('background');

      editScreen.style.display = 'none';
      editScreen.style.zIndex  = '1';
      editScreen.classList.remove('slide-in-top');
      editScreen.classList.add('slide-out-top');

      // Resolve button reference — use caller-supplied one (fast path inside
      // initPlayerUiEvents) or fall back to a fresh DOM lookup.
      // var editBtn = btn || document.getElementById('edit_playlist' + idSuffix);
      var editBtn = document.getElementById('edit_playlist' + idSuffix);
      if (editBtn !== null) {
        editBtn.disabled          = false;
        editBtn.title             = 'Manage playlist';
        editBtn.style.cursor      = 'pointer';
        editBtn.dataset.editOpen  = 'false';

        editBtn.classList.remove('disabled');
        editBtn.setAttribute('aria-disabled', 'false');
        editBtn.setAttribute('aria-label', 'Manage playlist');
        editBtn.style.removeProperty('opacity');

        var editImg = editBtn.querySelector('img');
        if (editImg !== null) {
          editImg.src = '/assets/theme/j1/modules/videoPlayer/icons/player/dark/playlist-edit.svg';
          editImg.alt = 'Manage playlist';
        }
      }
    }, // END closeEditPlaylist

    // -------------------------------------------------------------------------
    // messageHandler()
    // manage messages sent from other J1 modules
    // -------------------------------------------------------------------------
    messageHandler: (sender, message) => {
      var json_message = JSON.stringify(message, undefined, 2);

      logText = 'received message from ' + sender + ': ' + json_message;
      logger.debug('\n' + logText);

      // -----------------------------------------------------------------------
      // process commands|actions
      // -----------------------------------------------------------------------
      if (message.type === 'command' && message.action === 'module_initialized') {
        logger.info('\n' + message.text);
      }

      return true;
    }, // END messageHandler

    // -------------------------------------------------------------------------
    // setState()
    // sets the current (processing) state of the module
    // -------------------------------------------------------------------------
    setState: (stat) => {
      _this.state = stat;
    }, // END setState

    // -------------------------------------------------------------------------
    // getState()
    // returns the current (processing) state of the module
    // -------------------------------------------------------------------------
    getState: () => {
      return _this.state;
    } // END getState

  }; // END return (main)
})(j1, window);

{%- endcapture -%}

{%- if production -%}
  {{ cache|minifyJS }}
{%- else -%}
  {{ cache|strip_empty_lines }}
{%- endif -%}

{%- assign cache = false -%}