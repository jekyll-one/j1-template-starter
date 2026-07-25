/*
 # -----------------------------------------------------------------------------
 # ~/assets/theme/j1/modules/videoPlayer/js/videoPlayer.js (57)
 # Provides JS Core for J1 Module videoPlayer
 #
 # Product/Info:
 # https://jekyll.one
 #
 # Copyright (C) 2026 Juergen Adams
 #
 # J1 Template is licensed under the MIT License.
 # See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE
 # -----------------------------------------------------------------------------
*/

/* Version 3.1.57 for J1 Template */

// -----------------------------------------------------------------------------
// ESLint shimming
// -----------------------------------------------------------------------------
/* eslint indent: "off"                                                       */
// -----------------------------------------------------------------------------

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);              // AMD: let the loader call factory
  } else if (typeof exports === 'object') {
    module.exports = factory();       // CommonJS: call factory, export result
  } else {
    root['videoPlayer'] = factory();  // Browser global: call factory, assign result
  }
}(this, function () {
  "use strict";

  // claude - J1 VideoPlayer MultiInstance #1
  // ===========================================================================
  // Multi-instance module architecture
  //
  // The whole former factory body (constants, module variables, the
  // PlaylistManager class, every handler class and every helper function) is
  // now wrapped in createVideoPlayerInstance(instanceID) below. Each call runs
  // the body in a FRESH closure, so ALL previously module-global mutable state
  // (player, _playerID, playlistManager, containerHTML, the *HandlerInit
  // guards, PiP state, ...) is private to one player instance. Nothing had to
  // be rewritten into classes: the closure boundary IS the instance boundary.
  //
  // Only the few things that are genuinely PAGE-global live in this outer
  // (shared) scope:
  //
  //   - the one-shot guards for the two page-level handlers
  //     (inputValueBackgroundHandler / navbarSmoothScrollHandler), which wire
  //     document-level listeners and must run exactly once per page, no
  //     matter how many player instances exist;
  //   - the instance registry (_instances) and the registry API appended at
  //     the end of the file (createInstance / getInstance / ...).
  //
  // Backward compatibility: the module export mirrors the complete legacy
  // surface (videoPlayer.playlistManager, new videoPlayer.playlistIOHandler,
  // videoPlayer.closePlaylist, ...) through lazy getters that delegate to a
  // DEFAULT instance (instanceID ''), created on first access. Existing
  // single-player adapter code therefore keeps working unchanged. Multi-player
  // adapters switch to:
  //
  //     const vp = videoPlayer.createInstance(playerId);
  //     vp.playlistManager.setAdapterOptions(options);
  //     new vp.playlistIOHandler({ ... });
  //     ...
  //
  // NOTE (intentional): the body below keeps its original 2-space indentation
  // instead of being re-indented one level deeper. This keeps the diff against
  // the singleton version reviewable line-by-line; JavaScript is unaffected.
  // ===========================================================================

  // claude - J1 VideoPlayer MultiInstance #2
  // ===========================================================================
  // Architecture revision — video.js-aligned multi-instance module
  //
  // The #1 (closure-registry) architecture above kept the complete legacy
  // singleton surface alive through lazy getters delegating to an ambient
  // DEFAULT instance (''). An adapter that kept using that legacy surface
  // (videoPlayer.playlistManager…, new videoPlayer.playlistIOHandler…)
  // silently wired EVERY player on the page into that ONE shared default
  // instance: setPlayerID() calls overwrote each other and only the last
  // configured player worked. That is the multi-player failure #2 resolves.
  //
  // #2 restructures the MODULE SURFACE to the same structures/strategy as
  // the videoJS module (video.js):
  //
  //   video.js                          J1 videoPlayer (this module)
  //   --------------------------------  ----------------------------------
  //   videojs(id, options)   (factory)  videoPlayer(id, options)  (factory)
  //   class Player                      class VideoPlayer
  //   Player.players         (registry) VideoPlayer.players       (registry)
  //   videojs.getPlayer(id)             videoPlayer.getPlayer(id)
  //   videojs.getPlayers()              videoPlayer.getPlayers()
  //   player.id()/player.options()      vp.id() / vp.options()
  //   player.dispose()                  vp.dispose()
  //   videojs.VERSION                   videoPlayer.VERSION
  //
  // The module export is now the CALLABLE create-or-get factory; there is NO
  // ambient default instance any more — exactly as in video.js, every
  // consumer addresses a concrete player id. createVideoPlayerInstance()
  // below is retained unchanged as the per-player member builder, invoked
  // exclusively by the VideoPlayer class constructor (the way a video.js
  // Player constructor builds and attaches its child components). See the
  // module API section at the end of the file.
  // ===========================================================================

  // claude - J1 VideoPlayer MultiInstance #2
  // Module version, exposed as videoPlayer.VERSION (video.js parity:
  // videojs.VERSION). Keep in sync with the file header above.
  const VERSION = '3.1.57';

  // Page-global one-shot guards for the two page-scoped handlers (see the
  // tagged notes inside those functions).
  let _sharedInputValueBackgroundHandlerInit = false;
  let _sharedNavbarSmoothScrollHandlerInit   = false;

  // Registry of live player instances, keyed by instance id ('' = default /
  // legacy single-player instance).
  // claude - J1 VideoPlayer MultiInstance #2
  // DEPRECATED, unreferenced: superseded by the static VideoPlayer.players
  // registry (video.js: Player.players) in the module API section at the end
  // of the file. Declaration preserved in line with the additive convention.
  const _instances = new Map();

  // ---------------------------------------------------------------------------
  // createVideoPlayerInstance
  //
  // Runs the complete (former singleton) module body in a fresh closure and
  // returns the per-instance API for ONE player. Do not call directly from
  // adapter code — use the registry functions (createInstance / getInstance)
  // at the end of the file so instances are tracked and de-duplicated.
  //
  // @param {string} instanceID - the player id ('' for the legacy default);
  //                              identical to the id the adapter passes to
  //                              playlistManager.setPlayerID() and to the
  //                              _{{player.id}} suffix used by videoPlayer.html
  //
  // claude - J1 VideoPlayer MultiInstance #2
  // Invocation change: this builder is no longer reached through the #1
  // registry functions (createInstance/getInstance — retired below). It is
  // invoked EXCLUSIVELY by the VideoPlayer class constructor, which attaches
  // the returned members to the class instance — the same way a video.js
  // Player constructor builds and attaches its child components. The body of
  // this function (all state, PlaylistManager, handler classes, fixes #1–#45)
  // is intentionally UNCHANGED by #2.
  // ---------------------------------------------------------------------------
  function createVideoPlayerInstance(instanceID) {

  // Constants
  // ---------------------------------------------------------------------------

  const MODULE_NAME         = 'videoPlayer.core';
  const PASTE_DELAY         = 10;
  const VIDEO_START_DELAY   = 250;

  // Re-added YOUTUBE_PATTERNS so that YouTube URLs are recognised and
  // routed to the YouTube tech path
  const YOUTUBE_PATTERNS = Object.freeze([
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
  ]);

  const YOUTUBE_RE              = /(?:youtu\.be\/.*|youtube\.com\/.*)/;
  const YOUTUBE_ID_RE           = /(?:youtu\.be\/.*|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([A-Za-z0-9_-]{11})/;
  const YOUTUBE_POSTER_QUALITY  = 'hqdefault';

  // VIDEO_URL_PATTERNS matches local paths (/assets/...) and remote URLs
  // for MP4, WebM, OGV, OGG, M4V and MOV video files.  A bare filename
  // (no directory) with a recognised extension is also accepted.
  const VIDEO_URL_PATTERNS = Object.freeze([
    // remote URL with a video file extension
    /^https?:\/\/.+\.(?:mp4|webm|og[gv]|m4v|mov)(?:[?#].*)?$/i,
    // absolute local path (starts with /) with a video file extension
    /^\/[^?#]+\.(?:mp4|webm|og[gv]|m4v|mov)(?:[?#].*)?$/i,
    // bare filename (no slash) with a video file extension – relative paths
    /^[^/][^?#]*\.(?:mp4|webm|og[gv]|m4v|mov)(?:[?#].*)?$/i
  ]);

  // Default poster image used when a playlist entry has no poster URL.
  const DEFAULT_POSTER = '/assets/image/icon/videojs/videojs-poster.png';

  // Claude - J1 videoPlayer optimizations #2 (e)
  // Performance: this timezone map was an object literal allocated INSIDE
  // _normalizeIssueDate() on every single call. _normalizeIssueDate() runs
  // once per entry with an issueDate on every load(), and load() itself runs
  // several times per render pass — so the literal was rebuilt hundreds of
  // times per page interaction for identical, immutable data. Hoisted here
  // as a frozen module-level constant (same pattern as YOUTUBE_PATTERNS /
  // NATIVE_POSTER_DEFAULTS). Content is byte-identical to the original.
  const ISSUE_DATE_TZ_MAP = Object.freeze({
    'ET': '-0500', 'EST': '-0500', 'EDT': '-0400',
    'CT': '-0600', 'CST': '-0600', 'CDT': '-0500',
    'MT': '-0700', 'MST': '-0700', 'MDT': '-0600',
    'PT': '-0800', 'PST': '-0800', 'PDT': '-0700',
    'UTC': '+0000', 'GMT': '+0000',
    'BST': '+0100', 'CET': '+0100', 'CEST': '+0200',
    'IST': '+0530', 'JST': '+0900', 'AEST': '+1000'
  });

  // claude - Modify J1 VideoPlayer #33
  // ---------------------------------------------------------------------------
  // Native-video poster auto-generation
  //
  // For native videos (MP4, WebM, OGV/OGG, M4V, MOV) the playlist would
  // otherwise only ever show DEFAULT_POSTER, because — unlike YouTube, which
  // exposes a thumbnail CDN — a local/remote video file carries no ready-made
  // poster image. The helpers below grab a single still frame from the file
  // off-screen (a detached <video> element decodes the frame, a <canvas>
  // captures it) and return it as a Base64 data-URL that is stored in the
  // playlist record (localStorage) and used as the list/card thumbnail.
  //
  // NATIVE_POSTER_DEFAULTS provides the fall-back configuration; any subset of
  // these keys may be overridden through videoPlayer.yml ->
  // videoPlayerOptions.videoJS.poster (see _resolveNativePosterConfig()).
  //
  //   enabled          master on/off switch
  //   capturePosition  capture point in SECONDS (configurable start position).
  //                    When <= 0 the captureFraction is used instead.
  //   captureFraction  fraction (0..100) percent of the duration used as
  //                    the capture point when capturePosition <= 0
  //   maxWidth         output is downscaled to at most this width in px
  //                    (aspect preserved); 0 keeps the native frame size.
  //   mimeType         output image type ('jpeg'|'png' |'webp')
  //   quality          0..1 encoder quality (jpeg/webp only)
  //   generate_timeout hard timeout so a bad/slow file can never hang capture
  //
  // ---------------------------------------------------------------------------
  const NATIVE_POSTER_DEFAULTS = Object.freeze({
    enabled:            true,
    capturePosition:    5.0,
    captureFraction:    10,
    maxWidth:           320,
    mimeType:           'webp',
    quality:            0.60,
    generate_timeout:   8000
  });

  // claude - Modify J1 VideoPlayer #33
  // Resolves the effective native-poster config by overlaying any values found
  // under videoPlayerOptions.videoJS.poster onto NATIVE_POSTER_DEFAULTS. Reads
  // defensively (module-level videoPlayerOptions first, then the adapter
  // namespace) so it is safe to call before the adapter has assigned options.
  function _resolveNativePosterConfig() {
    let opts = (typeof videoPlayerOptions === 'object' && videoPlayerOptions)
      ? videoPlayerOptions
      : null;

    if (!opts && typeof j1 !== 'undefined' && j1 && j1.adapter && j1.adapter.videoPlayer) {
      opts = j1.adapter.videoPlayer.videoPlayerOptions || null;
    }

    const cfg = (opts && opts.videoJS.poster.autoGenerate)
      ? opts.videoJS.poster.autoGenerate
      : {};

    const settings = Object.assign({}, NATIVE_POSTER_DEFAULTS, cfg);

    return settings;
  }

  // claude - Modify J1 VideoPlayer #33
  // True when the URL/path points at a native (browser-decodable) video file
  // rather than a YouTube watch URL/id.  Reuses VIDEO_URL_PATTERNS so exactly
  // the same extensions accepted elsewhere in the module are accepted here.
  function _isNativeVideoSource(src) {
    if (!src || typeof src !== 'string') return false;
    return VIDEO_URL_PATTERNS.some((re) => re.test(src));
  }

  // claude - Modify J1 VideoPlayer #33
  // ---------------------------------------------------------------------------
  // generateNativePoster
  //
  // Extracts a single still frame from a native video file and returns it as a
  // Base64 data-URL, suitable for storing in the playlist record (localStorage)
  // and for use directly as an <img> src in the list/card views.
  //
  // Mechanism (the element never needs to be inserted into the DOM):
  //   1. create a detached <video> (muted, preload=metadata, crossOrigin)
  //   2. on 'loadedmetadata' the duration / intrinsic size are known
  //   3. seek to the configured capture position; absolute seconds when
  //      capturePosition > 0, otherwise (captureFraction/100) * duration:
  //      clamped so the seek target always lies inside the media
  //   4. on 'seeked' draw the current frame into a <canvas> sized to the video
  //      (optionally downscaled to maxWidth, aspect preserved)
  //   5. resolve with canvas.toDataURL(mimeType, quality)
  //
  // The promise NEVER rejects: on any failure (unsupported file, decode error,
  // tainted cross-origin canvas without CORS headers, or timeout) it resolves
  // to '' so callers can simply fall back to DEFAULT_POSTER.  A hard timeout
  // guarantees the returned promise always settles and the <video> is released.
  //
  // @param  {string} src            native video URL/path
  // @param  {Object} [opts]         per-call overrides for the resolved config
  // @return {Promise<string>}       Base64 data-URL, or '' on failure
  // ---------------------------------------------------------------------------
  function generateNativePoster(src, opts) {
    return new Promise((resolve) => {
      if (!_isNativeVideoSource(src)) { resolve(''); return; }

      const cfg = Object.assign(_resolveNativePosterConfig(), opts || {});

      let settled = false;
      let video   = document.createElement('video');

      const cleanup = () => {
        if (!video) return;
        try {
          video.removeAttribute('src');
          video.load();                 // abort any in-flight network fetch
        } catch (_e) { /* ignore */ }
        video = null;
      };

      const finish = (dataUrl) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        resolve(dataUrl || '');
      };

      const timer = setTimeout(() => {
        isDev && logger.debug('\n' + `generateNativePoster: timed out after ${cfg.generate_timeout}ms for src: ${src}`);
        finish('');
      }, cfg.generate_timeout);

      const drawFrame = () => {
        try {
          const vw = video.videoWidth  || 0;
          const vh = video.videoHeight || 0;
          if (!vw || !vh) { finish(''); return; }

          let cw = vw, ch = vh;
          if (cfg.maxWidth > 0 && vw > cfg.maxWidth) {
            cw = cfg.maxWidth;
            ch = Math.round(vh * (cfg.maxWidth / vw));
          }

          const canvas  = document.createElement('canvas');
          canvas.width  = cw;
          canvas.height = ch;

          const ctx = canvas.getContext('2d');
          if (!ctx) { finish(''); return; }
          ctx.drawImage(video, 0, 0, cw, ch);

          // toDataURL() throws a SecurityError on a tainted (cross-origin)
          // canvas — caught below and reported as '' (fall back to default).
          const dataUrl = canvas.toDataURL(`image/${cfg.mimeType}`, cfg.quality);
          finish(dataUrl);
        } catch (e) {
          isDev && logger.warn('\n' + `generateNativePoster: frame capture failed for src: ${src} - ${e}`);
          finish('');
        }
      };

      video.addEventListener('error', () => {
        isDev && logger.warn('\n' + `generateNativePoster: media error for src: ${src}`);
        finish('');
      }, { once: true });

      video.addEventListener('loadedmetadata', () => {
        const duration = isFinite(video.duration) ? video.duration : 0;

        // Resolve the seek target (configurable start position).
        let target = (cfg.capturePosition > 0)
          ? cfg.capturePosition
          : (duration > 0 ? duration * (cfg.captureFraction/100) : 0);

        // Clamp into (0, duration) so the seek lands on a decodable frame.
        if (duration > 0) {
          const maxSeek = Math.max(0, duration - 0.1);
          if (target > maxSeek) target = maxSeek;
        }

        if (!(target > 0)) {
          // No seek needed — draw the first decoded frame. Some browsers fire
          // 'seeked' for currentTime=0, some do not, so key off 'loadeddata'.
          video.addEventListener('loadeddata', drawFrame, { once: true });
          if (video.readyState >= 2) drawFrame();
          return;
        }

        // 'seeked' fires once the target frame is decoded and available.
        video.addEventListener('seeked', drawFrame, { once: true });
        try {
          video.currentTime = target;
        } catch (_e) {
          // Some browsers refuse currentTime before data is buffered; fall
          // back to drawing the first available frame.
          video.addEventListener('loadeddata', drawFrame, { once: true });
        }
      }, { once: true });

      // crossOrigin must be set BEFORE src so the CORS request is issued. A
      // same-origin file is unaffected; a cross-origin file with proper CORS
      // headers yields an untainted canvas; otherwise toDataURL() throws and
      // the capture resolves to '' (handled in drawFrame).
      video.crossOrigin = 'anonymous';
      video.muted       = true;
      video.playsInline = true;
      video.preload     = 'metadata';

      try {
        video.src = src;
        video.load();
      } catch (_e) {
        finish('');
      }
    });
  }

  // claude - Modify J1 VideoPlayer #19
  // ---------------------------------------------------------------------------
  // _buildPlaylistItemSources
  //
  // Derives the videojs-playlist `sources` array ([{ src, type }]) for a single
  // J1 playlistManager entry.  This mirrors the source/type resolution already
  // performed in createVideoJsPlayer():
  //
  //   - YouTube entries  -> { type: 'video/youtube', src: '//youtu.be/<id>' }
  //   - native entries   -> { type: <ext-derived MIME>, src: <file url> }
  //
  // The YouTube id is taken from entry.videoLink (matched against
  // YOUTUBE_PATTERNS) and only falls back to a bare 11-char entry.videoId when
  // there is no native entry.src (native videoIds are filenames-without-ext and
  // could otherwise be mistaken for a YouTube id).  entry.infoLink is NOT used
  // here because for YouTube records it points at the *playlist* URL, not the
  // playable video.
  //
  // Returns an empty array when no playable source can be derived; the caller
  // (convertVideoPlayerPlaylist) drops such entries so player.src() never
  // receives an empty/invalid source list.
  // ---------------------------------------------------------------------------
  function _buildPlaylistItemSources(entry) {
    if (!entry || typeof entry !== 'object') return [];

    // 1) YouTube: prefer an explicit videoLink, then a bare 11-char videoId.
    let ytId = null;

    if (entry.videoLink) {
      for (const pattern of YOUTUBE_PATTERNS) {
        const m = String(entry.videoLink).match(pattern);
        if (m) { ytId = m[1]; break; }
      }
    }

    if (!ytId && !entry.src && entry.videoId && /^[A-Za-z0-9_-]{11}$/.test(entry.videoId)) {
      ytId = entry.videoId;
    }

    if (ytId) {
      // Keep protocol-relative form consistent with createVideoJsPlayer().
      return [{ type: 'video/youtube', src: `//youtu.be/${ytId}` }];
    }

    // 2) Native: use entry.src (preferred) or entry.videoLink as the file URL
    //    and auto-detect the MIME type from the extension (same map used by
    //    createVideoJsPlayer()).
    const nativeSrc = entry.src || entry.videoLink || '';
    if (!nativeSrc) return [];

    const extMap = {
      mp4:  'video/mp4',
      webm: 'video/webm',
      ogv:  'video/ogg',
      ogg:  'video/ogg',
      m4v:  'video/mp4',
      mov:  'video/mp4'
    };

    const ext  = nativeSrc.split('?')[0].split('.').pop().toLowerCase();
    const type = extMap[ext] || 'video/mp4';

    return [{ type: type, src: nativeSrc }];
  }

  // claude - Modify J1 VideoPlayer #19
  // ---------------------------------------------------------------------------
  // mapVideoPlayerPlaylist
  //
  // Declarative mapping rules that translate a single J1 playlistManager record
  // (the localStorage entry shape produced by playlistManager.load() /
  // PlaylistManager._normalizeEntry — see Hofgeschichten.json for an example)
  // into one playlist item as expected by the videojs-playlist plugin (core.js)
  // and rendered by videojs-playlist-ui.
  //
  // Target item shape:
  //   {
  //     sources:     [{ src, type }],   // REQUIRED by core.js playItem()/player.src()
  //     poster:      <string>,          // menu thumbnail (playlist-ui)
  //     name:        <string>,          // menu title       (playlist-ui)
  //     description: <string>,          // menu description (playlist-ui)
  //     duration:    <number seconds>,  // menu duration    (playlist-ui)
  //     ...J1 metadata carried through (videoId, videoLink, infoLink, rating,
  //        lastPosition, …) so downstream resume/rating/link handling keeps
  //        working off the playlist item.
  //   }
  //
  // Each rule value is either:
  //   - a string   -> copy that source field verbatim   (entry[srcKey])
  //   - a function -> (entry) => computed/derived value
  // A rule that yields `undefined` is omitted from the produced item.
  // ---------------------------------------------------------------------------
  const mapVideoPlayerPlaylist = Object.freeze({
    // --- videojs-playlist core (REQUIRED) ----------------------------------
    sources:      (entry) => _buildPlaylistItemSources(entry),

    // --- videojs-playlist-ui menu fields -----------------------------------
    name:         (entry) => entry.title || entry.videoId || 'Untitled',
    description:  (entry) => entry.description || '',
    poster:       (entry) => entry.poster || DEFAULT_POSTER,
    duration:     (entry) => (typeof entry.duration === 'number' ? entry.duration : 0),

    // --- J1 metadata carried through (verbatim copies) ---------------------
    videoId:      'videoId',
    videoLink:    'videoLink',
    infoLink:     'infoLink',
    author:       'author',
    category:     'category',
    issueDate:    'issueDate',
    episode:      'episode',
    series:       'series',
    tags:         'tags',
    rating:       'rating',
    lastPosition: 'lastPosition',
    watchDate:    'watchDate',
    type:         'type'
  });

  const MESSAGES = Object.freeze({
    NO_CLIPBOARD_API:   'Clipboard API not available. Please use Ctrl+V.',
    CLIPBOARD_DENIED:   'Clipboard access failed. Please paste URL manually.',
    INVALID_URL:        'Invalid URL. Accepted: YouTube URL/ID or local video path (MP4, WebM, OGV).',
    NO_URL:             'No URL entered.',
    VIDEO_EXISTS:       'Video|Player already exists.',
    LOADING_VIDEO:      'Loading video.'
  });

  // vjsStateEventMap / vjsStateEventNameMap retain the same numeric codes
  // because video.js native HTML5 tech fires the same event names as the
  // YouTube tech did (loadstart, ended, playing, pause, waiting).
  const vjsStateEventMap = {
    'loadstart':        -1,
    'ended':             0,
    'playing':           1,
    'pause':             2,
    'waiting':           3
  };

  const vjsStateEventNameMap = {
    '-1': 'loadstart',
     '0': 'ended',
     '1': 'playing',
     '2': 'paused',
     '3': 'waiting'
  };

  // Pre-defined tags data array
  // ---------------------------------------------------------------------------
  const TAGS_BY_GENRE = Object.freeze({
    'Beauty':             ['beauty', 'makeup', 'skincare', 'hairstyle', 'fashion'],
    'Comedy':             ['comedy', 'standup', 'memes'],
    'Education':          ['education', 'learn', 'tutorial','study'],
    'Entertainment':      [
                           'entertainment', 'infotainment', 'edutainment',
                           'dance', 'show', 'musical', 'tv', 'mixed', 'cinema',
                           'podcast', 'magician', "horror", "ventriloquist",
                           'celebrity', 'series', 'competition', 'audioclip',
                           'videoclip'
                          ],
    'Music':              [
                           'music',  'concert', 'festival', 'cover', 'pop',
                           'k-pop', 'classsic', 'rock', 'folk', 'traditional',
                           'latin', 'jazz', 'rap', 'singer', 'songwriter',
                           'original', 'emotional', 'romantic', '60th', '70th',
                           '80th', '90th', 'remix', 'live'
                          ],
    'Gaming':             ['game', 'gamer'],
    'Howto':              ['howto', 'diy', 'tech', 'mounting', 'cooking', 'food'],
    'Product':            ['product', 'reviews', 'tech', 'unboxing', 'ai', 'programming', 'gadgets'],
    'News':               ['news', 'commentary', 'viral', 'trending' ],
    'Fitness':            ['fitness', 'health', 'sport', 'workout', 'gym', 'health', 'motivation'],
    'Business':           ['business', 'finance', 'tech', 'ai', 'programming', 'gadgets']
  });

  const GENRE_OPTIONS_HTML        = _buildGenreOptionHTML();
  const CONSOLE_LOG_ID            = generateId();
  const PLAYLIST_URL_BASE         = '/assets/data/apps/videoPlayer/playlists';
  const PLAYLIST_INDEX            = `${PLAYLIST_URL_BASE}/index.json`;

  // Module variables
  // ---------------------------------------------------------------------------

  let isDev                       = false;

  let player                      = null;
  let lastState                   = null;
  let playerMode                  = null;
  let previousPlayerId            = null;
  let videoPlayerOptions          = null;
  let adapterOptions              = null;

  let pipWindow                   = null;
  let pipEnabled                  = false;
  let pipVisibilityBound          = false;

  let loopConfigEnabled           = false;
  let pipConfigEnabled            = false;
  let _playlistActiveVideoId      = null;

  // claude - Modify J1 VideoPlayer #32
  // Guards the brief window during which the videojs-playlist plugin performs
  // its initial source selection inside onReady(): playlist(list) auto-loads
  // item 0 (player.src()), then currentItem(syncedIndex) re-loads the selected
  // item (a second player.src()). These two/three source swaps happen
  // back-to-back. The loadstart-driven autoplay (nextPrevButtons.autoplay) must
  // NOT call play() against these transient sources — the immediately-following
  // currentItem() src() aborts that pending play(), which the browser surfaces
  // as "The play() request was interrupted by a new load request". The flag is
  // set before playlist()/currentItem() and cleared once the SELECTED source
  // has settled (loadedmetadata), after which the deferred autoplay branch in
  // onReady() performs a single, race-free play(). Hoisted here with the other
  // module-level flags so it is initialised before any factory code runs (TDZ).
  let _playlistSetupInProgress    = false;

  // claude - J1 VideoPlayer MultiInstance #1
  // Instance-scoped logger name so multi-player log output is attributable
  // per player (e.g. 'videoPlayer.core.player_1'). The bare MODULE_NAME is
  // kept for the default ('') instance so existing single-player log output
  // is byte-identical to the singleton version.
  let logger                      = log4javascript.getLogger(instanceID ? `${MODULE_NAME}.${instanceID}` : MODULE_NAME);

  // container data will be initialized in playlistIOHandler
  //
  let container                   = null;
  let containerHTML               = null;

  // Declaring here — with all other module-level flags — ensures it
  // is initialised before any code in this factory function executes.
  //
  let _startedFromPlaylist        = false;
  let _editPlaylistHandlerInit    = false;
  let _togglePlaylistHandlerInit  = false;

  // claude - Modify J1 VideoPlayer #41
  // Guards the page-load "auto-load first playlist entry in paused state"
  // behaviour (autoLoadFirstEntryOnReload()) so it fires at most once per
  // page load even if the triggering handler init runs more than once or
  // several callers invoke it. Hoisted here with the other module-level
  // flags so it is initialised before any factory code runs
  // (TDZ pitfall — see #32).
  let _autoLoadFirstOnReloadDone  = false;

  // claude - Modify J1 VideoPlayer #43
  // Per-player keying of the auto-load-on-reload once-only guard.
  //
  // The #41 flag above (_autoLoadFirstOnReloadDone) is a SINGLETON: a single
  // module-level boolean shared by every player on the page. On a multi-player
  // page the first player to run autoLoadFirstEntryOnReload() set it true,
  // after which every sibling player short-circuited at the guard and never
  // restored ITS OWN stored first entry — so only one player auto-loaded.
  //
  // We replace that single boolean with a registry keyed by the owning player
  // id (_playerID — the same scope _pid() and this.load()/this.STORAGE_KEY use,
  // set per instance by setPlayerID()). Each distinct player id (including the
  // empty-string '' single-player / test fallback) gets its own "done" slot, so
  // every player auto-loads its own first entry exactly once, independently of
  // the others. Object.create(null) avoids prototype-key collisions for ids
  // like 'toString'. Declared here with the other module-level flags so it is
  // initialised before any factory code runs (TDZ pitfall — see #32).
  //
  // The original boolean is left in place (deprecated, unreferenced) rather
  // than deleted, in line with the additive convention; nothing reads or writes
  // it after the autoLoadFirstEntryOnReload() reads/writes are rerouted below.
  const _autoLoadFirstOnReloadDoneByPid = Object.create(null);

  // Player-scoped element ID support.
  // The HTML data file (videoPlayer.html) suffixes every per-player element
  // id with _{{player.id}} so that multiple players can coexist on the
  // same page without duplicate-id conflicts.
  // _playerID stores the current player id set by the adapter
  // (via playlistManager.setPlayerID), and _pid() converts a bare element
  // name to its scoped form for all getElementById / querySelector calls.
  // claude - J1 VideoPlayer MultiInstance #1
  // _playerID is now a PER-INSTANCE closure variable (one per
  // createVideoPlayerInstance() call), seeded from the instanceID argument so
  // that _pid() resolves the suffixed element ids correctly from the very
  // first statement of the instance — even before the adapter (re-)asserts it
  // via playlistManager.setPlayerID(). A sibling player can no longer
  // overwrite it: each instance owns its own copy.
  let _playerID                   = instanceID || '';

  /**
   * _pid(bare) – returns the player-scoped element id.
   * When _playerID is set the result is `${bare}_${_playerID}`;
   * when it is empty the bare name is returned unchanged (fallback / tests).
   * @param {string} bare - the unsuffixed element id
   * @returns {string}
   */
  function _pid(bare) {
    return _playerID ? `${bare}_${_playerID}` : bare;
  }

  // ---------------------------------------------------------------------------
  // Helper Functions
  // ---------------------------------------------------------------------------

  /**
   * _buildGenreOptionHTML - returns the <optgroup> / <option> HTML
   * string for all genres in TAGS_BY_GENRE.
   */
  function _buildGenreOptionHTML() {
    let html = '<option value="">select from common tags</option>\n';
    for (const [genre, tags] of Object.entries(TAGS_BY_GENRE)) {
      html += `                      <optgroup label="${genre}">\n`;
      tags.forEach(t => {
        html += `                      <option value="${t}">${t}</option>\n`;
      });
      html += `                      </optgroup>\n`;
    }
    return html;
  }

  /**
   * consoleLog - formatted console output with timestamp and unique ID
   */
  function consoleLog(level, module, message) {
    const timestamp = new Date().toISOString().slice(11, 23);

    switch (level) {
      case 'INFO':
        isDev ? console.log(`[${timestamp}] [${CONSOLE_LOG_ID}] [${level}] [${module}] \n${message}`) : null;
        break;
      case 'WARN':
        isDev ? console.warn(`[${timestamp}] [${CONSOLE_LOG_ID}] [${level}] [${module}] \n${message}`) : null;
        break;
      case 'ERROR':
        console.error(`[${timestamp}] [${CONSOLE_LOG_ID}] [${level}] [${module}] \n${message}`);
        break;
      default:
        isDev ? console.log(`[${timestamp}] [${CONSOLE_LOG_ID}] [${level}] [${module}] \n${message}`) : null;
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // PlaylistManager
  // Central component for all video playlist operations on localStorage
  //
  // Extended to store native video metadata (src, poster) in playlist entries
  // instead of YouTube-specific fields.
  // ---------------------------------------------------------------------------
  class PlaylistManager {

    constructor() {
      this.STORAGE_KEY                    = 'playlist';
      this.INDEX_KEY                      = 'index';

      // claude - Modify J1 VideoPlayer #40
      // Per-player localStorage namespacing (issue #40).
      // The two keys above are the *bare* base keys. On a multi-player page
      // every PlaylistManager instance previously shared the bare 'playlist'
      // (and 'index') key, so a second player's content merged into the
      // first player's localStorage list. To isolate instances, setPlayerID()
      // re-derives STORAGE_KEY/INDEX_KEY by suffixing them with the owning
      // player id (e.g. 'playlist_player_1', 'index_player_1').
      // The bare values are preserved here so the derivation is always built
      // from the base — never from an already-suffixed key — which keeps
      // setPlayerID() idempotent even when it is re-asserted (e.g. by
      // preloadPlaylists()). When no player id is set the bare keys are used
      // unchanged, mirroring the _pid() fallback and preserving the existing
      // single-player / test behaviour.
      this._BASE_STORAGE_KEY              = this.STORAGE_KEY;
      this._BASE_INDEX_KEY                = this.INDEX_KEY;

      // guard flags
      //
      this._rateHandlerInitialized        = false;
      this._editHandlerInitialized        = false;
      this._infoLinkHandlerInitialized    = false;
      this._videoLinkHandlerInitialized   = false;
      this._playHandlerInitialized        = false;
      this._deleteHandlerInitialized      = false;

      // initial settings
      //
      this._searchResults                 = null;
      this._searchIndex                   = null;
      this._currentSort                   = 'watchDate';
      // claude - J1 VideoPlayer MultiInstance #6
      // Player-scope the three UI-preference localStorage reads. These bare keys
      // are origin-global, so on a multi-player page BOTH players' constructors
      // read the SAME 'playlistMode'/'mergeMode'/'playlistLoop' value on (re)load
      // and each playlist restored the other player's mode. _pid() suffixes the
      // key with the owning player id (e.g. 'playlistMode_player_1') — the SAME
      // suffix the matching checkbox ids already use (fix #4:
      // getElementById(_pid('playlistMode'))) — so the persisted key and its DOM
      // control stay in lockstep. _playerID is seeded from instanceID at closure
      // entry (createVideoPlayerInstance), so it is already correct here, before
      // the adapter's later (idempotent) setPlayerID() call. With no player id
      // (default instance) _pid() returns the bare key, so single-player behaviour
      // is unchanged. Mirrors the STORAGE_KEY/INDEX_KEY namespacing of #40.
      // Original (deprecated, preserved for reference):
//    this._displayMode                   = localStorage.getItem('playlistMode') || 'cards';
//    this._mergeMode                     = localStorage.getItem('mergeMode') === 'true';
//    this._loopEnabled                   = localStorage.getItem('playlistLoop') === 'true';
      this._displayMode                   = localStorage.getItem(_pid('playlistMode')) || 'list'; // jadams
      this._mergeMode                     = localStorage.getItem(_pid('mergeMode')) === 'true';
      this._loopEnabled                   = localStorage.getItem(_pid('playlistLoop')) === 'true';
      this._escapeHtmlEl                  = document.createElement('div');
      this._loopSwitchInitialized         = false;

      // claude - Modify J1 VideoPlayer #21
      // Tracks the videoId of the entry that is currently in the 'playing'
      // state. The matching card/list element gets data-item-active="true";
      // null means no entry is active. Re-applied after every render so the
      // active marker survives renderCurrent()/renderCards()/renderPlaylist().
      this._activeVideoId                 = null;
    }

    setAdapterOptions(options) {
      adapterOptions = options;
      isDev = (adapterOptions.env === 'development' || adapterOptions.env === 'dev')
        ? true
        : false;
    }

    // Registers the player id so that _pid() can resolve all per-player element
    // ids to their suffixed form (e.g. 'videoplayer_playlist_parent_myPlayer').
    // Called by the adapter immediately after instantiating the handlers.
    setPlayerID(id) {
      _playerID = id || '';

      // claude - Modify J1 VideoPlayer #40
      // Re-derive the per-instance localStorage keys from the bare base keys
      // each time the owning player id changes. With a player id present the
      // keys become player-scoped (e.g. 'playlist_player_1' / 'index_player_1')
      // so concurrent instances on the same page no longer collide; with an
      // empty id the bare keys are kept (single-player / test fallback, in line
      // with _pid()). Always derived from _BASE_* so repeated calls (e.g. the
      // re-assertion inside preloadPlaylists()) can never double-suffix.
      // Because STORAGE_KEY/INDEX_KEY are *instance* properties, the value set
      // here is stable for this instance regardless of later changes to the
      // module-level _playerID by a sibling player — all subsequent load()/
      // save()/search-index reads and writes follow it automatically.
      this.STORAGE_KEY = _playerID ? `${this._BASE_STORAGE_KEY}_${_playerID}` : this._BASE_STORAGE_KEY;
      this.INDEX_KEY   = _playerID ? `${this._BASE_INDEX_KEY}_${_playerID}`   : this._BASE_INDEX_KEY;

      isDev && logger.debug('\n' + `playlistManager: player id set to "${_playerID}"`);
      isDev && logger.debug('\n' + `playlistManager: storage key set to "${this.STORAGE_KEY}", index key set to "${this.INDEX_KEY}"`);
    }

    // Corrected bare ids ('playlistSearch', 'playlistBlock') to match the
    // actual element ids in videoPlayer.html ('playlist_screen', 'playlistBlock')
    // and resolved through _pid() so the suffixed form is used at runtime.
    //
    // Removed 'playlist_screen' from this data-driven show/hide list.
    // The outer #playlist_screen panel is the TOGGLE target: its visibility
    // is owned solely by the #toggle_playlist button (initTogglePlaylistHandler)
    // and by the public closePlaylist() API.
    // Previously _manageHiddenMode(true) forced #playlist_screen to display:block 
    // whenever a playlist existed, and because it is called on every
    // renderCurrent()/renderCards()/renderPlaylist() run, the panel was
    // re-opened on each render — including on page load/reload with
    // a loaded playlist.
    // That silently undid the adapter's closePlaylist() call (the close
    // worked, then the next render re-showed the panel), so the panel
    // appeared "stuck open".
    // Only the INNER #playlistBlock is data-driven here; the #playlist_screen panel
    // now stays closed until the user opens it.
    _manageHiddenMode(visible) {
      const ids = ['playlistBlock'];
      ids.forEach(id => {
        const el = document.getElementById(_pid(id));
        if (el) {
          el.style.display = visible ? 'block' : 'none';
        }
      });
    }

    // Internal Helper Functions
    // -------------------------------------------------------------------------

    _formatDuration(seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      return `${m}:${String(s).padStart(2, '0')}`;
    }

    _getTimeAgo(date) {
      const diff    = Date.now() - date.getTime();
      const mins    = Math.floor(diff / 60000);
      const hours   = Math.floor(diff / 3600000);
      const days    = Math.floor(diff / 86400000);
      const weeks   = Math.floor(days / 7);
      const months  = Math.floor(days / 30);

      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
      if (weeks < 5) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }

    _escapeHtml(str) {
      this._escapeHtmlEl.textContent = str;
      return this._escapeHtmlEl.innerHTML;
    }

    _formatTimestamp() {
      const now  = new Date();
      const yyyy = now.getFullYear();
      const mo   = String(now.getMonth() + 1).padStart(2, '0');
      const dd   = String(now.getDate()).padStart(2, '0');
      const hh   = String(now.getHours()).padStart(2, '0');
      const mm   = String(now.getMinutes()).padStart(2, '0');
      const ss   = String(now.getSeconds()).padStart(2, '0');
      return `${yyyy}-${mo}-${dd}__${hh}-${mm}-${ss}`;
    }

    _parseDuration(text) {
      if (!text) return 0;
      const cleaned = text.replace(/[^0-9:]/g, '').trim();
      if (!cleaned) return 0;
      const parts = cleaned.split(':').map(Number);
      if (parts.some(isNaN)) return 0;
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      return parts[0] || 0;
    }

    _isValidUrl(str) {
      if (!str || typeof str !== 'string') return false;
      try {
        const url = new URL(str);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch (_) {
        return false;
      }
    }

    _updateInfoLinkButton() {
      const input = document.getElementById('editFieldInfoLink');
      const btn   = document.getElementById('editInfoLinkOpenBtn');
      if (!input || !btn) return;
      const valid = this._isValidUrl(input.value.trim());
      btn.style.display = valid ? 'inline-flex' : 'none';
    }

    _updateVideoLinkButton() {
      const input = document.getElementById('editFieldVideoLink');
      const btn   = document.getElementById('editVideoLinkOpenBtn');
      if (!input || !btn) return;
      const valid = this._isValidUrl(input.value.trim());
      btn.style.display = valid ? 'inline-flex' : 'none';
    }

    _normalizeIssueDate(str) {
      if (!str || typeof str !== 'string') return str;
      const trimmed = str.trim();
      if (!trimmed) return '';

      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

      // Claude - J1 videoPlayer optimizations #2 (e)
      // The map is now the module-level frozen constant ISSUE_DATE_TZ_MAP
      // (see the constants block) instead of a literal re-allocated on every
      // call. Lookup semantics are unchanged.
      // Original (deprecated, preserved for reference):
      //   const tzMap = {
      //     'ET': '-0500', 'EST': '-0500', 'EDT': '-0400',
      //     'CT': '-0600', 'CST': '-0600', 'CDT': '-0500',
      //     'MT': '-0700', 'MST': '-0700', 'MDT': '-0600',
      //     'PT': '-0800', 'PST': '-0800', 'PDT': '-0700',
      //     'UTC': '+0000', 'GMT': '+0000',
      //     'BST': '+0100', 'CET': '+0100', 'CEST': '+0200',
      //     'IST': '+0530', 'JST': '+0900', 'AEST': '+1000'
      //   };
      const tzMap = ISSUE_DATE_TZ_MAP;

      let dateTxt = trimmed.replace(
        /\b([A-Z]{2,4})\s*$/,
        (_, tz) => tzMap[tz] || tz
      );

      const parsed = new Date(dateTxt);
      if (isNaN(parsed.getTime())) return str;

      const yyyy = parsed.getUTCFullYear();
      const mo   = String(parsed.getUTCMonth() + 1).padStart(2, '0');
      const dd   = String(parsed.getUTCDate()).padStart(2, '0');

      return `${yyyy}-${mo}-${dd}`;
    }

    // _normalizeEntry: added 'src' and 'poster' fields for native video entries.
    // Legacy entries that lack these fields are backfilled with empty strings
    // so the rest of the code can always access entry.src and entry.poster
    // without null-checks.
    _normalizeEntry(entry) {
      let ytID;

      if (entry && typeof entry === 'object' && !('author' in entry)) {
        entry.author = '';
      }

      // claude - Add new field title VidoPlayer #1
      if (entry && typeof entry === 'object' && !('title' in entry)) {
        entry.title = '';
      }

      if (entry && typeof entry === 'object' && !('infoLink' in entry)) {
        entry.infoLink = '';
      }

      if (entry && typeof entry === 'object' && !('videoLink' in entry)) {
        entry.videoLink = '';
      }

      // Ensure native-video fields exist on every entry.
      //
      // Bug: the guard `if ('poster' in entry)` was always true because the
      // line above (`if (!('poster' in entry)) entry.poster = ''`) ensures the
      // key is present on every entry before the check runs.  As a result
      // _normalizeEntry() unconditionally overwrote any stored poster URL —
      // replacing it with a freshly synthesised CDN URL (YouTube) or
      // DEFAULT_POSTER (everything else) on every call, including when called
      // during handleImport() / importFromUrlAsync().
      //
      // Fix: only synthesise a poster when the entry genuinely has none
      // (empty string or missing key).  When a non-empty poster is already
      // stored — e.g. from a previous addEntry() / doPostOnPlaying() call —
      // leave it untouched.  The else-branch must also not overwrite a valid
      // native-video poster with DEFAULT_POSTER; it should only fill the gap
      // when both the stored poster and the videoLink yield nothing.
      //
      if (entry && typeof entry === 'object') {
        if (!('src' in entry))    entry.src    = '';
        if (!('poster' in entry)) entry.poster = '';

        // Synthesise a poster only when none is already stored.
        if (!entry.poster || entry.poster === DEFAULT_POSTER) {

          // jadams, 2026-06-12 - to be fixed: entry.videoLink should always set
          //
          if (entry.videoLink) {
            ytID = entry.videoLink ? entry.videoLink.match(YOUTUBE_ID_RE) : null;
          } else if (entry.infoLink) {
            ytID = entry.infoLink ? entry.infoLink.match(YOUTUBE_ID_RE) : null;
          }

          // overload the stored/default poster for YouTube entries
          const isYt = (ytID) ? true : false;
          if (isYt) {
            entry.poster = `https://img.youtube.com/vi/${ytID[1]}/${YOUTUBE_POSTER_QUALITY}.jpg`;
          } else {
            // For non-YouTube entries leave entry.poster as '' so the render
            // helpers can fall back to DEFAULT_POSTER at display time (they
            // already do: `item.poster || DEFAULT_POSTER`).  Storing
            // DEFAULT_POSTER in the playlist record would prevent a real poster
            // from ever being recognised as "missing" in future normalise calls.
          }
        }
      }

      if (entry && typeof entry === 'object') {
        if (!('lastPosition' in entry)) {
          entry.lastPosition = 0;
        }

        if (!('rating' in entry)) {
          entry.rating = 0;
        }

        if (!('issueDate' in entry)) {
          entry.issueDate = '';
        }

        if (entry.issueDate) {
          entry.issueDate = this._normalizeIssueDate(entry.issueDate);
        }
      }

      return entry;
    }

    // Core localStorage accessors
    // -------------------------------------------------------------------------

    load() {
      try {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) return null;
        const parsed = JSON.parse(data);

        if (Array.isArray(parsed)) {
          parsed.forEach(entry => this._normalizeEntry(entry));
        }
        return parsed;
      } catch (e) {
        logger.error('\n' + `error parsing localStorage data: ${e}`);
        return null;
      }
    }

    // claude - Modify J1 VideoPlayer #19
    // -------------------------------------------------------------------------
    // convertVideoPlayerPlaylist
    //
    // Maps and converts the raw record set produced by load() (the J1
    // localStorage playlist shape) into the item-array shape expected by the
    // videojs-playlist plugin (core.js).  The field-by-field translation is
    // driven entirely by the declarative mapVideoPlayerPlaylist rules object so
    // the mapping stays in one place and is easy to extend.
    //
    // Entries that do not yield a playable `sources` array are dropped: core.js
    // playItem() calls player.src(item.sources) and an empty/missing source
    // list would put the player into an error state.
    //
    // @param  {Array<Object>} rawPlaylist  result of playlistManager.load()
    // @return {Array<Object>}              videojs-playlist ready item list
    // -------------------------------------------------------------------------
    convertVideoPlayerPlaylist(rawPlaylist, poster) {
      if (!Array.isArray(rawPlaylist)) return [];

      // Claude - J1 videoPlayer optimizations #2 (a)
      // Correctness: `ytID` was declared OUTSIDE the forEach and was only
      // re-assigned when an entry actually HAD a poster. Every entry WITHOUT
      // a poster therefore inherited the PREVIOUS entry's YouTube
      // classification (stale match). On playlists mixing YouTube and native
      // entries, a poster-less native entry that follows a YouTube entry was
      // wrongly treated as YouTube — and with the vjs `poster` option enabled
      // its mapped poster was suppressed (value = null). The match is now a
      // loop-local const computed fresh for every entry; no state can leak
      // between iterations.
      // Original (deprecated, preserved for reference):
      //   var ytID    = false;
      const items = [];

      rawPlaylist.forEach((entry) => {
        if (!entry || typeof entry !== 'object') return;

        // jadams, 2026-06-25: check if YT poster
        //
        // Claude - J1 videoPlayer optimizations #2 (a)
        // Original (deprecated, preserved for reference):
        //   if (entry.poster) {
        //     ytID = entry.poster ? entry.poster.match(YOUTUBE_RE) : null;
        //   }
        const ytID = entry.poster ? entry.poster.match(YOUTUBE_RE) : null;

        // overload the stored/default poster for YouTube entries
        // Claude - J1 videoPlayer optimizations #2 (a)
        // (unchanged logic; `ytID` is now guaranteed per-entry, see above)
        const isYt = (ytID) ? true : false;   
        const item = {};

        // Apply every rule from the mapping object.
        Object.keys(mapVideoPlayerPlaylist).forEach((targetKey) => {
          const rule = mapVideoPlayerPlaylist[targetKey];
          let value;

          if (typeof rule === 'function') {
            // jadams, 2026-ß6-25: enable|disable vjs poster (plugins.playlist.poster)
            if (targetKey === 'poster' && poster && isYt) {
              value = null;
            } else {
              value = rule(entry);
            }            
          } else if (typeof rule === 'string') {
            value = entry[rule];
          }

          // Omit undefined values so the produced item only carries real data.
          if (value !== undefined) {
            item[targetKey] = value;
          }
        });

        // Guard: a playlist item without a playable source is unusable.
        if (!Array.isArray(item.sources) || item.sources.length === 0 || !item.sources[0].src) {
          isDev && logger.warn('\n' + `playlistmanager: skipped entry without a playable source (videoId: ${entry.videoId || 'n/a'})`);
          return;
        }

        items.push(item);
      });

      isDev && logger.info('\n' + `playlistmanager: converted ${items.length}/${rawPlaylist.length} entries for videojs-playlist`);

      return items;
    }

    save(playlistArray) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(playlistArray));
      this._invalidateSearchIndex();
    }

    // claude - Modify J1 VideoPlayer #45
    // -------------------------------------------------------------------------
    // _loadFromKey(storageKey) / _saveToKey(storageKey, playlistArray)
    //
    // Explicit-key variants of load()/save(). They read/write the localStorage
    // key passed to them rather than the *shared, mutable* instance property
    // this.STORAGE_KEY.
    //
    // Rationale (issue #45 — concurrent preload cross-contamination):
    // PlaylistManager is a SINGLETON (one instance for the whole page, 
    // created once by the UMD factory: `const playlistManager = new PlaylistManager()`).
    //
    // claude - J1 VideoPlayer MultiInstance #1
    //
    // NOTE: the SINGLETON statement above is HISTORICAL. Since the
    // multi-instance conversion, createVideoPlayerInstance() runs the whole
    // module body once PER PLAYER, so every player owns a private
    // PlaylistManager and a private _playerID — the cross-instance key
    // mutation described below can no longer occur BETWEEN players.
    // // The explicit-key helpers are kept regardless: they still harden
    // the async preload path against setPlayerID() re-assertions WITHIN
    // one instance and keep the preload destination pinned across awaits.
    //
    // setPlayerID() re-points the single instance's STORAGE_KEY/INDEX_KEY
    // and the module-level _playerID. preloadPlaylists() is async and
    // `await`s a fetch() per file; while one player's preload is suspended
    // on its fetch, a sibling player's setPlayerID() (driven by the adapter's
    // per-player init loop) mutates the same STORAGE_KEY. When the suspended
    // preload resumes, this.load()/this.save() inside _preloadMergeFromUrl()
    // therefore read and write the WRONG player's key — so every preloaded
    // list collapses onto a single player's storage and the players render
    // the same (first) playlist.
    //
    // These helpers let the preload path pin the destination key ONCE
    // (computed from the owning playerId at call time) and stay immune to
    // any concurrent STORAGE_KEY change.
    // They do NOT touch INDEX_KEY: the search index is rebuilt scope-correctly
    // at the end of preloadPlaylists() via buildSearchIndex(); here we only
    // drop the in-memory index reference.
    // -------------------------------------------------------------------------
    _loadFromKey(storageKey) {
      try {
        const data = localStorage.getItem(storageKey);
        if (!data) return null;
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          parsed.forEach(entry => this._normalizeEntry(entry));
        }
        return parsed;
      } catch (e) {
        logger.error('\n' + `error parsing localStorage data (key: ${storageKey}): ${e}`);
        return null;
      }
    }

    // claude - Modify J1 VideoPlayer #45
    _saveToKey(storageKey, playlistArray) {
      localStorage.setItem(storageKey, JSON.stringify(playlistArray));
      this._searchIndex = null;
    }

    // CRUD operations
    // -------------------------------------------------------------------------

    /**
     * playlistManager
     * addEntry - add a new video to the playlist in localStorage.
     *
     * @param {Object}  entry
     * @param {string}  [entry.src]           - full local or remote video URL/path
     * @param {string}  [entry.poster]        - poster image URL for the video
     * @param {string}  [entry.videoId]       - derived filename-without-extension key
     * @param {string}  [entry.videoLink]     - full video URL (identical to src for native)
     * @param {string}  [entry.author]        - author name
     * @param {string}  [entry.category]      - category
     * @param {string}  [entry.description]   - description text, limited to 50 words
     * @param {number}  [entry.duration]      - video duration in seconds
     * @param {string}  [entry.infoLink]      - Info URL
     * @param {string}  [entry.issueDate]     - issue date (ISO string or free text)
     * @param {number}  [entry.episode]       - episode no for series
     * @param {number}  [entry.lastPosition]  - playback position in seconds
     * @param {number}  [entry.rating]        - video rating 1-5
     * @param {number}  [entry.series]        - set to series no
     * @param {array}   [entry.tags]          - array of tags
     * @param {string}  [entry.title ]        - video title
     * @param {string}  [entry.type ]         - element type
     * @param {string}  [entry.videoLink]     - full YouTube Video URL
     * @param {string}  [entry.videoId]       - YouTube video ID
     * @param {string}  [entry.watchDate]     - ISO date of watching
     */

    // claude - Modify J1 VideoPlayer #34
    // DEPRECATED. addEntry() performed "late" creation: it was invoked from
    // doPostOnPlaying() only once the player reached the 'playing' state, so a
    // playlist record never existed until the video actually started playing.
    // It is superseded by the separated pair createEntry() (early creation, at
    // the moment the video is created in embedRunVideo()) + enrichEntry()
    // (back-fills title/author/poster/duration as the tech resolves them).
    // addEntry() also could NOT update an entry that already existed - it
    // simply skipped - which is exactly why metadata back-filling now goes
    // through enrichEntry(). The method is retained unchanged for backward
    // compatibility (external/legacy callers); the module itself no longer
    // calls it. Prefer createEntry()/enrichEntry() for new code.
    //
    addEntry(entry) {
      const playlist = this.load() || [];

      const found = (playlist.find(item => item.videoId === entry.videoId)) ? true : false;
      if (found) {
        isDev && logger.info('\n' + `playlistmanager: skip adding entry with title: ${entry.title}`);
        return;
      }

      // Added 'src' and 'poster' fields.
      // 'videoLink' now defaults to entry.src (the local/remote video path)
      // instead of a YouTube watch URL.
      const record = {
        author:       entry.author        || '',
        category:     entry.category      || '',
        creator:      'videoPlayer',
        description:  entry.description   || '',
        duration:     entry.duration      || 0,
        infoLink:     entry.infoLink      || '',
        issueDate:    this._normalizeIssueDate(entry.issueDate || ''),
        episode:      entry.episode       || 0,
        lastPosition: entry.lastPosition  || 0,
        poster:       entry.poster        || '',
        rating:       entry.rating        || 0,
        series:       entry.series        || 0,
        src:          entry.src           || '',
        tags:         entry.tags          || [],
        title:        entry.title         || '',
        type:         entry.type          || 'video/mp4',
        videoLink:    entry.videoLink     || entry.src || '',
        videoId:      entry.videoId,
        watchDate:    new Date().toISOString()
      };

      const filtered = playlist.filter(item => item.videoId !== entry.videoId);
      filtered.unshift(record);
      this.save(filtered);

      isDev && logger.info('\n' + `playlistmanager: entry added for videoId: ${entry.videoId}`);

      this.renderCurrent();
    }

    // claude - Modify J1 VideoPlayer #34
    // createEntry - EARLY, isolated playlist creation.
    //
    // Creates the playlist record as soon as the video is *created* (its source
    // is known in embedRunVideo()), decoupled from playback. This replaces the
    // "late" addEntry() path that only ran on the 'playing' state.
    //
    // Only the fields known at creation time need to be supplied; everything
    // the tech resolves asynchronously (title, author, duration, native poster)
    // is back-filled later by enrichEntry()/updateEntry*(). The record shape is
    // identical to the one addEntry() produced, plus a `createDate` marker.
    //
    // Idempotent: if a record for entry.videoId already exists it is returned
    // untouched (no overwrite, no re-render, no duplicate), so re-embedding the
    // same video - or the defensive createEntry() call still left in
    // doPostOnPlaying() - never resets or duplicates it.
    //
    // watchDate is seeded to the creation timestamp so the existing watchDate
    // sort order behaves exactly as it did when addEntry() stamped it on first
    // play; updateWatchDate() refreshes it on the first 'playing' event.
    //
    // @param  {Object}      entry            same field set accepted by addEntry()
    // @return {Object|null}                  the created (or pre-existing) record
    //
    createEntry(entry) {
      if (!entry || !entry.videoId) {
        isDev && logger.warn('\n' + 'playlistmanager: createEntry skipped - missing videoId');
        return null;
      }

      const playlist = this.load() || [];

      const existing = playlist.find(item => item.videoId === entry.videoId);
      if (existing) {
        isDev && logger.debug('\n' + `playlistmanager: createEntry - entry already exists for videoId: ${entry.videoId}`);
        return existing;
      }

      const now = new Date().toISOString();

      const record = {
        author:       entry.author        || '',
        category:     entry.category      || '',
        creator:      'videoPlayer',
        description:  entry.description   || '',
        duration:     entry.duration      || 0,
        infoLink:     entry.infoLink      || '',
        issueDate:    this._normalizeIssueDate(entry.issueDate || ''),
        episode:      entry.episode       || 0,
        lastPosition: entry.lastPosition  || 0,
        poster:       entry.poster        || '',
        rating:       entry.rating        || 0,
        series:       entry.series        || 0,
        src:          entry.src           || '',
        tags:         entry.tags          || [],
        title:        entry.title         || '',
        type:         entry.type          || 'video/mp4',
        videoLink:    entry.videoLink     || entry.src || '',
        videoId:      entry.videoId,
        createDate:   now,
        watchDate:    entry.watchDate     || now
      };

      playlist.unshift(record);
      this.save(playlist);

      isDev && logger.info('\n' + `playlistmanager: entry created (early) for videoId: ${entry.videoId}`);

      this.renderCurrent();
      return record;
    }

    // claude - Modify J1 VideoPlayer #34
    // enrichEntry - back-fill metadata that only becomes available AFTER the
    // record was created: title/author resolved by the tech, the real poster,
    // the measured duration, canonical links. It is the "separated" counterpart
    // to createEntry(): creation captures what is known at load time;
    // enrichEntry() fills in the rest as it arrives.
    //
    // By default a field is written ONLY when the stored value is still empty /
    // a placeholder (poster === DEFAULT_POSTER counts as empty), so it never
    // clobbers a value the user edited in the playlist panel or one an earlier
    // resolution already supplied. Pass force=true to overwrite regardless.
    //
    // This is exactly what addEntry() could not do - addEntry() skipped any
    // record that already existed, leaving the early-created stub un-enriched.
    //
    // @param  {string}  videoId
    // @param  {Object}  meta              { title, author, infoLink, videoLink,
    //                                        src, type, poster, duration }
    // @param  {boolean} [force]           overwrite non-empty fields too
    // @return {boolean}                   true when at least one field changed
    //
    enrichEntry(videoId, meta, force) {
      if (!videoId || !meta) return false;

      const playlist = this.load() || [];
      const entry    = playlist.find(item => item.videoId === videoId);
      if (!entry) return false;

      let changed = false;

      const isBlank = (v) => (v === undefined || v === null || v === '');

      const fillString = (key, value) => {
        if (isBlank(value)) return;
        if (!force && !isBlank(entry[key])) return;
        if (entry[key] === value) return;
        entry[key] = value;
        changed = true;
      };

      fillString('title',     meta.title);
      fillString('author',    meta.author);
      fillString('infoLink',  meta.infoLink);
      fillString('videoLink', meta.videoLink);
      fillString('src',       meta.src);
      fillString('type',      meta.type);

      // duration: 0 counts as "not yet measured"
      if (typeof meta.duration === 'number' && meta.duration > 0) {
        if ((force || !entry.duration) && entry.duration !== meta.duration) {
          entry.duration = meta.duration;
          changed = true;
        }
      }

      // poster: DEFAULT_POSTER is treated as "no real poster yet"
      if (meta.poster) {
        const hasReal = entry.poster && entry.poster !== DEFAULT_POSTER;
        if ((force || !hasReal) && entry.poster !== meta.poster) {
          entry.poster = meta.poster;
          changed = true;
        }
      }

      if (!changed) return false;

      this.save(playlist);

      isDev && logger.info('\n' + `playlistmanager: entry enriched for videoId: ${videoId}`);

      this.renderCurrent();
      return true;
    }

    updateEntryDuration(videoId, durationSeconds) {
      if (!videoId || !durationSeconds || durationSeconds <= 0) return;

      const playlist = this.load() || [];
      const entry   = playlist.find(item => item.videoId === videoId);
      if (!entry) return;

      entry.duration = durationSeconds;
      this.save(playlist);

      isDev && logger.info('\n' + `playlistmanager: duration updated for video with id: ${videoId} - ${this._formatDuration(durationSeconds)}`);

      this.renderCurrent();
    }

    // claude - Modify J1 VideoPlayer #33
    // updateEntryPoster - store a poster (a Base64 data-URL produced by
    // generateNativePoster(), or any URL) on the playlist entry identified by
    // videoId and persist it to localStorage. By default it only writes when
    // the entry has no real poster yet (empty string or DEFAULT_POSTER) so an
    // explicitly supplied poster is never clobbered; pass force=true to
    // overwrite. The write and re-render are skipped when nothing changed.
    // Returns true when the entry was updated.
    updateEntryPoster(videoId, poster, force) {
      if (!videoId || !poster) return false;

      const playlist = this.load() || [];
      const entry    = playlist.find(item => item.videoId === videoId);
      if (!entry) return false;

      const hasReal = entry.poster && entry.poster !== DEFAULT_POSTER;
      if (hasReal && !force)      return false;
      if (entry.poster === poster) return false;

      entry.poster = poster;
      this.save(playlist);

      isDev && logger.info('\n' + `playlistmanager: poster updated for videoId: ${videoId} (${poster.length} bytes)`);

      this.renderCurrent();
      return true;
    }

    // claude - Modify J1 VideoPlayer #33
    // generatePosterForEntry - resolve the native src of a single playlist
    // entry and, when it still has no poster, capture one off-screen via
    // generateNativePoster() and store it through updateEntryPoster(). YouTube
    // entries and entries that already carry a real poster are skipped.
    // Returns a Promise<boolean> indicating whether a poster was stored.
    generatePosterForEntry(videoId) {
      if (!videoId) return Promise.resolve(false);

      const cfg = _resolveNativePosterConfig();
      if (!cfg.enabled) return Promise.resolve(false);

      const playlist = this.load() || [];
      const entry    = playlist.find(item => item.videoId === videoId);
      if (!entry) return Promise.resolve(false);

      // Already has a usable poster -> nothing to do.
      if (entry.poster && entry.poster !== DEFAULT_POSTER) return Promise.resolve(false);

      const src = entry.src || entry.videoLink || '';
      if (!_isNativeVideoSource(src)) return Promise.resolve(false);

      return generateNativePoster(src).then((dataUrl) => {
        if (!dataUrl) return false;
        return this.updateEntryPoster(videoId, dataUrl);
      });
    }

    // claude - Modify J1 VideoPlayer #33
    // generateMissingNativePosters - scan the stored playlist for native-video
    // entries that still lack a real poster and generate one for each. Runs
    // SEQUENTIALLY (one decode at a time) so importing a large playlist does
    // not spawn dozens of concurrent <video> decodes; each capture is bounded
    // by the generator's own timeout. updateEntryPoster() already re-renders
    // per stored poster; a final renderCurrent() guarantees the view reflects
    // the last write. Returns a Promise<number> = count of posters generated.
    generateMissingNativePosters() {
      const cfg = _resolveNativePosterConfig();
      if (!cfg.enabled) return Promise.resolve(0);

      const playlist = this.load() || [];
      const pending  = playlist.filter((entry) => {
        if (!entry || typeof entry !== 'object') return false;
        if (entry.poster && entry.poster !== DEFAULT_POSTER) return false;
        const src = entry.src || entry.videoLink || '';
        return _isNativeVideoSource(src);
      });

      if (pending.length === 0) return Promise.resolve(0);

      isDev && logger.info('\n' + `playlistmanager: generating posters for ${pending.length} native entr${pending.length === 1 ? 'y' : 'ies'}`);

      let count = 0;

      return pending.reduce((chain, entry) => {
        return chain.then(() => this.generatePosterForEntry(entry.videoId).then((done) => {
          if (done) count++;
        }));
      }, Promise.resolve()).then(() => {
        if (count > 0) this.renderCurrent();
        isDev && logger.info('\n' + `playlistmanager: generated ${count} native poster(s)`);
        return count;
      });
    }

    // updateEntryAuthor retained for compatibility; for native videos the
    // author field is set from the title/metadata stored in the entry itself
    // or left blank when the source does not provide one.
    updateEntryAuthor(videoId, author) {
      if (!videoId || !author) return;

      const playlist = this.load() || [];
      const entry   = playlist.find(item => item.videoId === videoId);
      if (!entry) return;

      if (entry.author === author) return;

      entry.author = author;
      this.save(playlist);

      isDev && logger.info('\n' + `playlist entry author updated for videoId: ${videoId} - ${author}`);

      this.renderCurrent();
    }

    updateEntryPosition(videoId, positionSeconds) {
      if (!videoId || positionSeconds == null || positionSeconds < 0) return;

      const playlist = this.load() || [];
      const entry   = playlist.find(item => item.videoId === videoId);
      if (!entry) return;

      entry.lastPosition = positionSeconds;
      this.save(playlist);

      isDev && logger.info('\n' + `playlistmanager: position updated for video with id: ${videoId} - ${positionSeconds}s`);
    }

    updateWatchDate(videoId) {
      if (!videoId) return;

      const playlist = this.load() || [];
      const entry    = playlist.find(item => item.videoId === videoId);
      if (!entry) return;

      entry.watchDate = new Date().toISOString();
      this.save(playlist);

      isDev && logger.info('\n' + `playlistmanager: watchDate updated for video with id: ${videoId}`);

      this.renderCurrent();
    }

    updateEntryRating(videoId, rating) {
      if (!videoId || rating == null) return;

      const playlist = this.load() || [];
      const entry   = playlist.find(item => item.videoId === videoId);
      if (!entry) return;

      entry.rating = rating;
      this.save(playlist);

      isDev && logger.info('\n' + `playlistmanager: rating updated for videoId: ${videoId} - ${rating}`);

      this.renderCurrent();
    }

    updateEntryFields(videoId, fields) {
      if (!videoId || !fields) return;

      const playlist = this.load() || [];
      const entry   = playlist.find(item => item.videoId === videoId);
      if (!entry) return;

      // claude - Add new field title VidoPlayer #1
      if ('category'    in fields) entry.category     = fields.category;
      if ('title'       in fields) entry.title        = fields.title;
      if ('description' in fields) entry.description  = fields.description;
      if ('episode'     in fields) entry.episode      = fields.episode;
      if ('infoLink'    in fields) entry.infoLink     = fields.infoLink;
      if ('videoLink'   in fields) entry.videoLink    = fields.videoLink;
      if ('issueDate'   in fields) entry.issueDate    = this._normalizeIssueDate(fields.issueDate);
      if ('series'      in fields) entry.series       = fields.series;
      if ('tags'        in fields) entry.tags         = fields.tags;
      if ('type'        in fields) entry.type         = fields.type;

      this.save(playlist);

      isDev && logger.info('\n' + `playlistmanager: fields updated for videoId: ${videoId}`);

      this.renderCurrent();
    }

    getEntryPosition(videoId) {
      if (!videoId) return 0;

      const playlist = this.load() || [];
      const entry   = playlist.find(item => item.videoId === videoId);
      return (entry && entry.lastPosition > 0) ? entry.lastPosition : 0;
    }

    // claude - Modify J1 VideoPlayer #35
    // getEntry
    // Returns the full playlist entry record for a given videoId, or null when
    // none exists. Added so callers (e.g. the header-title updater in
    // doPostOnPlaying) can read the canonical entry.title back from the
    // persisted playlist rather than re-deriving it from per-tech metadata.
    getEntry(videoId) {
      if (!videoId) return null;
      const playlist = this.load() || [];
      return playlist.find(item => item.videoId === videoId) || null;
    }

    getNextVideoId(currentVideoId) {
      if (!currentVideoId) return null;

      const playlist = this.load() || [];
      if (playlist.length < 2) return null;

      this._applySortOrder(playlist);

      const currentIndex = playlist.findIndex(item => item.videoId === currentVideoId);
      if (currentIndex < 0) return null;

      if (currentIndex >= playlist.length - 1) return null;

      return playlist[currentIndex + 1].videoId;
    }

    deleteEntry(videoId) {
      const playlist = this.load() || [];
      const updated = playlist.filter(item => item.videoId !== videoId);

      if (updated.length === playlist.length) {
        isDev && logger.warn('\n' + `playlist entry not found for videoId: ${videoId}`);
        return;
      }

      this.save(updated);
      isDev && logger.info('\n' + `playlist entry deleted for videoId: ${videoId}`);

      // claude - Modify J1 VideoPlayer #22
      // Guard: if the deleted entry is the one currently marked active, drop
      // the tracked active videoId. Otherwise _activeVideoId keeps pointing at
      // a videoId that no longer has a matching element. That is harmless for
      // the render that follows (nothing to mark), but it is a stale value
      // that would wrongly re-activate an element if the same videoId were
      // re-added later. renderCurrent() below then re-renders with the cleared
      // state, so every entry ends up with data-item-active="false".
      if (this._activeVideoId && this._activeVideoId === videoId) {
        this._activeVideoId = null;
      }

      this.renderCurrent();
    }

    clearPlaylist() {
      const playlist = this.load() || [];
      if (playlist.length === 0) {
        return false;
      }

      localStorage.removeItem(this.STORAGE_KEY);
      this._invalidateSearchIndex();

      isDev && logger.info('\n' + `cleared ${playlist.length} items from localStorage key: ${this.STORAGE_KEY}`);

      // claude - Modify J1 VideoPlayer #22
      // Same guard as deleteEntry(), for the bulk case: clearing the playlist
      // removes every entry (including any active one), so the tracked active
      // videoId must be dropped to avoid a stale value re-activating a future
      // entry. Also covers the "Clear with backup" path, which routes through
      // clearPlaylist().
      this._activeVideoId = null;

      this._manageHiddenMode(false);
      this.renderCurrent();

      return true;
    }

    // Import / Export
    // -------------------------------------------------------------------------

    importFromUrl(url) {
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (!Array.isArray(data)) {
            logger.error('\n' + 'imported URL does not contain a JSON array');
            return;
          }
          const hasMetaData = data.some(entry => entry.type === 'metaData');
          const videos      = hasMetaData ? data.filter(entry => entry.type === 'video') : data;

          videos.forEach(entry => this._normalizeEntry(entry));

          if (this._mergeMode) {
            const existing    = this.load() || [];
            const existingIds = new Set(existing.map(e => e.videoId));
            const newEntries  = videos.filter(e => !existingIds.has(e.videoId));
            const merged      = existing.concat(newEntries);
            this.save(merged);
            isDev && logger.info('\n' + `merged ${newEntries.length} new items (${videos.length - newEntries.length} duplicates skipped) into localStorage on key: ${this.STORAGE_KEY}`);
          } else {
            this.save(videos);
            isDev && logger.info('\n' + `imported ${videos.length} of ${data.length} items into localStorage on key: ${this.STORAGE_KEY}`);
          }
          this.renderCurrent();
        })
        .catch(err => logger.error('\n' + `import from URL failed: ${err}`));
    }

    async importFromUrlAsync(url) {
      try {
        const res  = await fetch(url);
        if (!res.ok) {
          logger.error('\n' + `import from URL failed: HTTP ${res.status}`);
          return;
        }
        const data = await res.json();

        // Bug: a YouTube (or any) playlist loaded via 'serverPlaylistLoadButton*'
        // never reached _normalizeEntry().
        //
        // Root cause: server playlists exported by this module (see
        // exportToFile(), which writes `JSON.stringify(this.load())`) and legacy
        // YouTube playlists are *plain JSON arrays*. The previous guard
        //
        //  if (data && typeof data === 'object' && !data.playlist) { return; }
        //
        // returned early for every plain array, because `typeof [] === 'object'`
        // is true and an array has no `.playlist` property — so `!data.playlist`
        // is true. The function bailed out before the
        // `playlist.forEach(entry => this._normalizeEntry(entry))` line below
        // was ever reached.
        //
        // A secondary defect: when `data` was a wrapped object *without*
        // meta_data (`{ playlist: [...] }`), the old line
        // `hasMetaData ? data.playlist : data` assigned the whole object (not its
        // array) to `playlist`, and the later `playlist.forEach(...)` threw a
        // TypeError — again never reaching _normalizeEntry.
        //
        // Fix: normalise both supported shapes to a real array before iterating:
        //
        //   1. plain array        ->  [ {...}, {...} ]
        //   2. wrapped object     ->  { meta_data?: {...}, playlist: [ {...} ] }
        //
        // Reject only genuinely invalid payloads (no usable array of entries).
        //
        const playlist = Array.isArray(data)
          ? data
          : (data && typeof data === 'object' && Array.isArray(data.playlist)
              ? data.playlist
              : null);

        if (!Array.isArray(playlist)) {
          logger.error('\n' + 'imported URL does not contain a valid playlist (expected a JSON array or an object with a "playlist" array)');
          return;
        }

        playlist.forEach(entry => this._normalizeEntry(entry));

        if (this._mergeMode) {
          const existing    = this.load() || [];
          const existingIds = new Set(existing.map(e => e.videoId));
          const newEntries  = playlist.filter(e => !existingIds.has(e.videoId));
          const merged      = existing.concat(newEntries);
          this.save(merged);
          isDev && logger.info('\n' + `merged ${newEntries.length} new items (${playlist.length - newEntries.length} duplicates skipped) into localStorage on key: ${this.STORAGE_KEY}`);
        } else {
          this.save(playlist);
          isDev && logger.info('\n' + `imported ${playlist.length} items into localStorage on key: ${this.STORAGE_KEY}`);
        }
        this.renderCurrent();
      } catch (err) {
        logger.error('\n' + `import from URL failed: ${err}`);
      }
    }

    // claude - Modify J1 VideoPlayer #39
    // -------------------------------------------------------------------------
    // preloadPlaylists(preloadList, baseUrl, playerId)
    //
    // Loads one or more configured playlist files into the player instance's
    // localStorage on page load. The list originates from the per-player
    // `playlist.preload` key in videoPlayer_control.yml and is forwarded by the
    // adapter (initHandlers -> _resolvePreloadList). Relative file names are
    // resolved against `baseUrl` (the `playlist_url_base` config value); entries
    // that are already absolute (http(s):// or a leading '/') are used unchanged.
    //
    // Behaviour (intentional — mirrors the control-yml comment
    // "Playlists are merged into the instance's localStorage on page load"):
    //   • MERGE, never overwrite. Existing entries are kept; only entries whose
    //     videoId is not already present are added. The call is therefore
    //     non-destructive (user-added videos, ratings, watch positions survive)
    //     and idempotent (re-running on every reload never duplicates).
    //   • All reads/writes go through this.load() / this.save(), so preload
    //     always targets whatever STORAGE_KEY the manager currently uses for the
    //     instance and follows that key automatically.
    //
    // The method is fire-and-forget (async). It handles its own errors, rebuilds
    // the search index, re-asserts the owning player id and re-renders the panel
    // when finished so the preloaded content is visible without further
    // interaction.
    //
    // NOTE: it deliberately does NOT auto-embed/play the first video — preload
    // only seeds the playlist. Auto-play on load would conflict with the
    // existing autoStart/init path. (See handleLoadFromServer() for the
    // load-and-pause variant used for user-triggered server loads.)
    //
    // @param  {Array<string>} preloadList  file names or URLs to preload
    // @param  {string}        [baseUrl]    base for relative file names
    // @param  {string}        [playerId]   owning player id (render scoping)
    // @return {Promise<number>}            count of newly added entries
    // -------------------------------------------------------------------------
    async preloadPlaylists(preloadList, baseUrl, playerId) {
      if (!Array.isArray(preloadList) || preloadList.length === 0) {
        isDev && logger.info('\n' + 'playlistManager: preload skipped — no playlists configured');
        return 0;
      }

      const base = String(baseUrl || PLAYLIST_URL_BASE).replace(/\/+$/, '');
      let totalAdded = 0;

      // claude - Modify J1 VideoPlayer #45
      // Pin the destination localStorage key ONCE, derived from the owning
      // playerId passed by the adapter, using the same rule setPlayerID() uses
      // (bare base key when no id). Every merge below writes to THIS key via the
      // explicit-key helpers, so a sibling player's setPlayerID() firing while
      // this async preload is suspended on a fetch() can no longer redirect the
      // merge to the wrong player's storage. When playerId is falsy the value
      // falls back to the currently configured STORAGE_KEY, preserving the
      // single-player / test behaviour unchanged.
      const targetStorageKey = playerId
        ? `${this._BASE_STORAGE_KEY}_${playerId}`
        : this.STORAGE_KEY;

      for (let i = 0; i < preloadList.length; i++) {
        const fileName = preloadList[i];
        if (!fileName || typeof fileName !== 'string') continue;

        const url = this._resolvePreloadUrl(fileName, base);
        try {
          // claude - Modify J1 VideoPlayer #45
          // Original (deprecated, preserved for reference):
          //   const added = await this._preloadMergeFromUrl(url);
          const added = await this._preloadMergeFromUrl(url, targetStorageKey);
          totalAdded += added;
          isDev && logger.info('\n' + `playlistManager: preload "${url}" — ${added} new entr${added === 1 ? 'y' : 'ies'} merged`);
        } catch (e) {
          logger.error('\n' + `playlistManager: preload "${url}" failed: ${e}`);
        }
      }

      // Re-assert the owning player id before any DOM work so renderCurrent()
      // (which resolves element ids via _pid()) targets the correct player even
      // if a sibling instance changed the shared module-level _playerID while
      // this async preload was in flight.
      if (playerId) this.setPlayerID(playerId);

      // Rebuild the search index from the merged set (save() invalidated it).
      try {
        if (typeof lunr !== 'undefined') this.buildSearchIndex();
      } catch (e) {
        isDev && logger.warn('\n' + `playlistManager: preload search-index rebuild failed: ${e}`);
      }

      // Reflect the preloaded playlist in the UI (panel content + toggle button).
      this.renderCurrent();

      // Backfill posters for native-video entries that arrived without one
      // (mirror of the server-load backfill). Fire-and-forget.
      if (typeof this.generateMissingNativePosters === 'function') {
        this.generateMissingNativePosters()
          .catch((e) => { isDev && logger.warn('\n' + `playlistManager: preload poster backfill failed: ${e}`); });
      }

      isDev && logger.info('\n' + `playlistManager: preload finished — ${totalAdded} new entr${totalAdded === 1 ? 'y' : 'ies'} added from ${preloadList.length} file(s)`);
      return totalAdded;
    }

    // claude - Modify J1 VideoPlayer #39
    // _resolvePreloadUrl(fileName, base)
    // Join a configured preload file name to the base URL. Absolute inputs
    // (http(s):// or a leading '/') are returned unchanged; otherwise the file
    // name is appended to `base` with exactly one separating slash.
    _resolvePreloadUrl(fileName, base) {
      if (/^https?:\/\//i.test(fileName) || fileName.charAt(0) === '/') {
        return fileName;
      }
      return `${base}/${fileName.replace(/^\/+/, '')}`;
    }

    // claude - Modify J1 VideoPlayer #39
    // _preloadMergeFromUrl(url)
    // Fetch a single playlist file and MERGE its entries (by videoId) into the
    // current localStorage playlist. Accepts both the plain-array and the
    // { playlist: [...] } shapes (same as importFromUrlAsync()). Returns the
    // number of newly added entries (0 when nothing new, or on error).
    // claude - Modify J1 VideoPlayer #45
    // Original signature (deprecated, preserved for reference):
    //   async _preloadMergeFromUrl(url) {
    // A second, optional `storageKey` argument pins the localStorage key for
    // this merge. When omitted it defaults to the shared this.STORAGE_KEY so
    // any other caller keeps the previous behaviour; preloadPlaylists() always
    // passes the per-player key it derived up front (issue #45).
    async _preloadMergeFromUrl(url, storageKey) {
      // claude - Modify J1 VideoPlayer #45
      const _key = storageKey || this.STORAGE_KEY;
      const res = await fetch(url);
      if (!res.ok) {
        logger.error('\n' + `playlistManager: preload fetch failed: HTTP ${res.status} (${url})`);
        return 0;
      }

      const data = await res.json();

      const incoming = Array.isArray(data)
        ? data
        : (data && typeof data === 'object' && Array.isArray(data.playlist) ? data.playlist : null);

      if (!Array.isArray(incoming)) {
        logger.error('\n' + `playlistManager: preload payload is not a valid playlist (expected a JSON array or an object with a "playlist" array): ${url}`);
        return 0;
      }

      incoming.forEach(entry => this._normalizeEntry(entry));

      // claude - Modify J1 VideoPlayer #45
      // Original (deprecated, preserved for reference):
      //   const existing    = this.load() || [];
      const existing    = this._loadFromKey(_key) || [];
      const existingIds  = new Set(existing.map(e => e && e.videoId));
      const newEntries   = incoming.filter(e => e && e.videoId && !existingIds.has(e.videoId));

      if (newEntries.length === 0) {
        isDev && logger.debug('\n' + `playlistManager: preload "${url}" — all entries already present, nothing merged`);
        return 0;
      }

      // claude - Modify J1 VideoPlayer #45
      // Original (deprecated, preserved for reference):
      //   this.save(existing.concat(newEntries));
      this._saveToKey(_key, existing.concat(newEntries));
      return newEntries.length;
    }

    importFromFile() {
      const fileInput = document.createElement('input');
      fileInput.type  = 'file';
      fileInput.accept = '.json,application/json';

      fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);

            let videos;
            let totalCount;

            if (data && typeof data === 'object' && data.playlist) {
              videos     = data.playlist;
              totalCount = videos.length + (data.meta_data ? 1 : 0);
              isDev && logger.info('\n' + 'imported file uses new format (meta_data + playlist)');
            } else {
              logger.error('\n' + 'imported file does not contain a valid playlist format');
              return;
            }

            videos.forEach(entry => this._normalizeEntry(entry));
            this.save(videos);
            isDev && logger.info('\n' + `imported ${videos.length} of ${totalCount} items from file: ${file.name}`);
            this.renderCurrent();
          } catch (err) {
            logger.error('\n' + `import from file failed: ${err}`);
          }
        };
        reader.readAsText(file);
      });

      fileInput.click();
    }

    exportToFile(filename) {
      if (!filename) {
        filename = `videoPlayer-playlist_${this._formatTimestamp()}.json`;
      }
      const playlist = this.load();
      if (!playlist || playlist.length === 0) {
        isDev && logger.warn('\n' + 'no playlist data to export');
        return;
      }

      const blob = new Blob(
        [JSON.stringify(playlist, null, 2)],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');

      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      isDev && logger.info('\n' + `exported ${playlist.length} items to file: ${filename}`);
    }

    // backupToFile - write a downloadable safety backup of the current
    // playlist BEFORE a destructive operation (e.g. clearPlaylist).
    //
    // Unlike exportToFile (which writes a bare array), the backup is wrapped
    // in a { backup_date, playlist } envelope so that re-importing it through
    // handleFileSelected() is recognised as a dated backup file (the import
    // path keys off the presence of `backup_date`).
    //
    // Returns true when a backup was written, false when there was nothing to
    // back up (mirrors clearPlaylist()'s empty-guard so callers can branch).
    //
    // @param {string} [filename] - download file name
    //                              (defaults to videoPlayer-playlist-backup.json)
    backupToFile(filename) {
      if (!filename) {
        filename = 'videoPlayer-playlist-backup.json';
      }
      const playlist = this.load();
      if (!playlist || playlist.length === 0) {
        isDev && logger.warn('\n' + 'no playlist data to back up');
        return false;
      }

      const backup = {
        backup_date : new Date().toISOString(),
        playlist    : playlist
      };

      const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');

      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      isDev && logger.info('\n' + `backed up ${playlist.length} items to file: ${filename}`);
      return true;
    }

    // Rendering
    // -------------------------------------------------------------------------

    renderCurrent() {
      const currentData = this.load() || [];
      if (currentData.length === 0) {
        this._manageHiddenMode(false);
      } else {
        this._manageHiddenMode(true);
      }

      // ID corrected from 'playlistHistory' (non-existent) to
      // 'videoplayer_playlist_parent' to match the actual page element.
      const historyEl = document.getElementById(_pid('videoplayer_playlist_parent'));
      if (historyEl) {
        if (this._displayMode === 'list') {
          historyEl.className = 'playlist list-mode';
        } else {
          historyEl.className = 'playlist card-mode';
        }
      }

      if (this._displayMode === 'list') {
        this.renderPlaylist();
      } else {
        this.renderCards();
      }

      if (!this._rateHandlerInitialized) {
        this.initRateHandler();
      }

      if (!this._editHandlerInitialized) {
        this.initEditHandler();
      }

      if (!this._infoLinkHandlerInitialized) {
        this.initInfoLinkHandler();
      }

      // Typo fixed: '_vidoLinkHandlerInitialized' → '_videoLinkHandlerInitialized'
      // (missing 'e'). The constructor declares '_videoLinkHandlerInitialized', so
      // the old misspelled name was always undefined, causing duplicate handler
      // registration on every renderCurrent() call.
      if (!this._videoLinkHandlerInitialized) {
        this.initVideoLinkHandler();
      }

      // initPlayHandler and initDeleteHandler were never called from
      // renderCurrent(), so clicking the play overlay or the delete button had
      // no effect.  Both handlers already existed; they just needed to be wired
      // in here, guarded by the new flags added to the constructor.
      if (!this._playHandlerInitialized) {
        this.initPlayHandler();
      }

      if (!this._deleteHandlerInitialized) {
        this.initDeleteHandler();
      }

      // Claude - J1 videoPlayer optimizations #2 (d)
      // Performance: each of the five UI helpers below independently resolved
      // its data via `this._searchResults || this.load() || []`, so a single
      // renderCurrent() pass JSON-parsed and re-normalised the ENTIRE playlist
      // from localStorage up to five additional times (on top of the render
      // itself). The view data is now resolved ONCE here — reusing the
      // `currentData` already loaded at the top of renderCurrent() — and
      // passed down. Every helper keeps its original no-argument behaviour as
      // the fallback (see the optional `data` parameters), so all external
      // call sites remain untouched.
      const viewData = this._searchResults || currentData;

      // Original (deprecated, preserved for reference):
      //   this._updateSortSelectVisibility();
      //   this._updateModeSwitchVisibility();
      //   this._updateMergeSwitchVisibility();
      //   this._updateTogglePlaylistButton();
      this._updateSortSelectVisibility(viewData);
      this._updateModeSwitchVisibility(viewData);
      this._updateMergeSwitchVisibility(viewData);
      this._updateTogglePlaylistButton(viewData);

      if (loopConfigEnabled && !this._loopSwitchInitialized) {
        // claude - J1 VideoPlayer MultiInstance #4
        // Scope the presence check to THIS player's panel so the lazy loop-switch
        // init is gated on the owning player's title bar, not the first one in
        // the document. Otherwise the check always saw player 1's title bar.
        // Original (deprecated, preserved for reference):
        //   const titleBar = document.querySelector('.playlist-block-title');
        const _scope   = document.getElementById(_pid('playlist_screen')) || document.getElementById(_pid('playlistBlock')); // claude - J1 VideoPlayer MultiInstance #4
        const titleBar = _scope ? _scope.querySelector('.playlist-block-title') : document.querySelector('.playlist-block-title'); // claude - J1 VideoPlayer MultiInstance #4
        if (titleBar) {
          this._loopSwitchInitialized = true;
          new playlistLoopSwitchHandler();
          isDev && logger.info('\n' + 'playlistManager: loop switch initialized (lazy)');
        }
      }

      // Claude - J1 videoPlayer optimizations #2 (d)
      // Original (deprecated, preserved for reference):
      //   this._updateLoopSwitchVisibility();
      this._updateLoopSwitchVisibility(viewData);
    }

    // ID corrected from 'playlistHistory' (non-existent) to
    // 'videoplayer_playlist_parent' which is the actual element in the page.
    _getPlaylistContainer() {
      const el = document.getElementById(_pid('videoplayer_playlist_parent'));
      if (!el) {
        logger.error('\n' + 'playlist container element not found');
        isDev && logger.warn('\n' + 'processing playlist skipped');
      }
      return el;
    }

    // renderPlaylist: thumbnail src replaced with entry.poster or DEFAULT_POSTER.
    // YouTube CDN image URLs (img.youtube.com) have been removed.
    renderPlaylist() {
      const preCheckData = this.load() || [];
      if (preCheckData.length === 0) {
        this._manageHiddenMode(false);
        return;
      }
      this._manageHiddenMode(true);

      const playlistContainer = this._getPlaylistContainer();
      if (!playlistContainer) return;

      playlistContainer.className = 'playlist list-mode';

      isDev && logger.info('\n' + `render playlist`);

      // Claude - J1 videoPlayer optimizations #2 (c)
      // Performance: the method parsed the full playlist out of localStorage
      // TWICE per render — once for the empty pre-check above and again here.
      // load() JSON-parses and re-normalises every entry, so the second parse
      // is pure duplicate work. Reuse the pre-check result; behaviour is
      // identical (same key, same call, microseconds apart).
      // Original (deprecated, preserved for reference):
      //   const data = this._searchResults || this.load() || [];
      const data = this._searchResults || preCheckData;
      this._applySortOrder(data);

      playlistContainer.innerHTML = data.map((item, index) => {
        const hasDuration   = (item.duration && item.duration > 0) ? true : false;
        const duration      = hasDuration ? this._formatDuration(item.duration) : '';
        const hasAuthor     = (item.author && item.author.trim().length > 0) ? true : false;
        const author        = hasAuthor ? item.author.trim() : '';
        const timeAgo       = this._getTimeAgo(new Date(item.watchDate));
        const hasRating     = (item.rating && item.rating > 0) ? true : false;
        const ratingStars   = hasRating ? '<i class="fas fa-star"></i>'.repeat(item.rating) : '';
        const hasInfoLink   = this._isValidUrl(item.infoLink);
        // Claude - J1 videoPlayer optimizations #2 (g)
        // Clarity/performance: `hasVideoLink` is never referenced in the row
        // template below (the video-link open button lives in the EDIT modal,
        // driven by _updateVideoLinkButton(), not in the playlist row) — yet
        // _isValidUrl() constructed a `new URL()` per row per render for it.
        // Deprecated in place; re-enable if a row-level video-link control is
        // ever added.
        // Original (deprecated, preserved for reference):
        //   const hasVideoLink  = this._isValidUrl(item.videoLink);
        const thumbSrc      = item.poster || DEFAULT_POSTER; // fallback DEFAULT_POSTER

        // claude - Modify J1 VideoPlayer #21
        // data-item-active is rendered from the live active videoId so a
        // re-render while a video is playing keeps the correct row marked.
        // Claude - J1 videoPlayer optimizations #2 (g)
        // Clarity: the rate-button icon ternary evaluated to 'fa-star' in
        // BOTH branches (no-op); the rated/unrated distinction is carried by
        // the button's ' rated' class. Replaced with the plain class string.
        // Original (deprecated, preserved for reference):
        //   <i class="fas ${item.rating ? 'fa-star' : 'fa-star'}"></i>
        return `
          <div class="playlist-row card-base" data-item-active="${(this._activeVideoId && item.videoId === this._activeVideoId) ? 'true' : 'false'}" data-index="${index}" data-video-id="${item.videoId}">
            <div class="playlist-row-content">
              <div class="playlist-thumb-wrapper">
                <img class="playlist-thumb" src="${thumbSrc}" alt="playlist-thumb">
                <div class="playlist-play-overlay"><i class="fas fa-play"></i></div>
                <div class="playlist-duration">${duration}</div>
                ${hasRating ? `<div class="playlist-rating">${ratingStars}</div>` : ''}
              </div>
              <div class="playlist playlist-info-row">
                <div class="playlist-title">${this._escapeHtml(item.title)}${hasInfoLink ? ` <a class="playlist-info-link" href="${this._escapeHtml(item.infoLink)}" target="_blank" rel="noopener noreferrer" title="More info"><i class="fas fa-info-circle"></i></a>` : ''}</div>
                <div class="playlist-author">${this._escapeHtml(author)}</div>
                <div class="playlist-time-info">${timeAgo}</div>
              </div>
              <div class="playlist-playlist-actions">
                <button class="playlist-btn rate ${item.rating ? ' rated' : ''}" title="Set rating${item.rating ? ' (' + item.rating + '/5)' : ''}" aria-label="Set rating">
                  <i class="fas fa-star"></i>
                </button>
                <button class="playlist-btn edit" title="Edit item" aria-label="Edit item">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="playlist-btn delete" title="Delete from playlist" aria-label="Delete from playlist">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `;

      }).join('');

      if (!this._rateHandlerInitialized) {
        this.initRateHandler();
      }

      if (!this._editHandlerInitialized) {
        this.initEditHandler();
      }
    }

    // renderCards: thumbnail src replaced with entry.poster or DEFAULT_POSTER.
    // YouTube CDN image URLs (img.youtube.com) have been removed.
    renderCards() {
      const preCheckData = this.load() || [];
      if (preCheckData.length === 0) {
        this._manageHiddenMode(false);
        return;
      }
      this._manageHiddenMode(true);

      const playlistContainer = this._getPlaylistContainer();
      if (!playlistContainer) return;

      playlistContainer.className = 'playlist card-mode';

      // Claude - J1 videoPlayer optimizations #2 (c)
      // Performance: same duplicate-parse pattern as renderPlaylist() — the
      // playlist was JSON-parsed from localStorage twice per render (empty
      // pre-check + display source). Reuse the pre-check result.
      // Original (deprecated, preserved for reference):
      //   const data = this._searchResults || this.load() || [];
      const data = this._searchResults || preCheckData;
      this._applySortOrder(data);

      playlistContainer.innerHTML = data.map(v => {
        const hasDuration  = v.duration && v.duration > 0;
        const duration     = hasDuration ? this._formatDuration(v.duration) : '';
        const hasAuthor    = v.author && v.author.trim().length > 0;
        const timeAgo      = this._getTimeAgo(new Date(v.watchDate));
        const hasRating    = v.rating && v.rating > 0;
        const ratingStars  = hasRating ? '<i class="fas fa-star"></i>'.repeat(v.rating) : '';
        const hasInfoLink  = this._isValidUrl(v.infoLink);
        // Claude - J1 videoPlayer optimizations #2 (g)
        // Clarity/performance: dead variable — see the identical note in
        // renderPlaylist().
        // Original (deprecated, preserved for reference):
        //   const hasVideoLink = this._isValidUrl(v.videoLink);
        const thumbSrc     = v.poster || DEFAULT_POSTER; // fallback to DEFAULT_POSTER

        // claude - Modify J1 VideoPlayer #21
        // data-item-active is rendered from the live active videoId so a
        // re-render while a video is playing keeps the correct card marked.
        // Claude - J1 videoPlayer optimizations #2 (g)
        // Clarity: same no-op 'fa-star'/'fa-star' ternary as renderPlaylist().
        // Original (deprecated, preserved for reference):
        //   <i class="fas ${v.rating ? 'fa-star' : 'fa-star'}"></i>
        return `
          <div class="playlist-card card-base" data-item-active="${(this._activeVideoId && v.videoId === this._activeVideoId) ? 'true' : 'false'}" data-video-id="${v.videoId}">
            <div class="playlist-thumb-wrapper">
              <img class="playlist-thumb" src="${thumbSrc}" alt="playlist-thumb">
              <div class="playlist-play-overlay"><i class="fas fa-play"></i></div>
              ${hasDuration ? `<div class="playlist-duration">${duration}</div>` : ''}
              ${hasRating ? `<div class="playlist-rating">${ratingStars}</div>` : ''}
            </div>
            <div class="playlist-info">
              <div class="playlist-title">${this._escapeHtml(v.title)}${hasInfoLink ? ` <a class="playlist-info-link" href="${this._escapeHtml(v.infoLink)}" target="_blank" rel="noopener noreferrer" title="More info"><i class="fas fa-info-circle"></i></a>` : ''}</div>
              ${hasAuthor ? `<div class="playlist-author">${this._escapeHtml(v.author)}</div>` : ''}
              <div class="playlist-time-info">${timeAgo}</div>
              <div class="playlist-card-actions">
                <button class="playlist-btn rate ${v.rating ? ' rated' : ''}" title="Set rating ${v.rating ? ' (' + v.rating + '/5)' : ''}" aria-label="Set rating">
                  <i class="fas fa-star"></i>
                </button>
                <button class="playlist-btn edit" title="Edit item" aria-label="Edit item">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="playlist-btn delete" title="Delete from playlist" aria-label="Delete from playlist">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      if (!this._rateHandlerInitialized) {
        this.initRateHandler();
      }

      if (!this._editHandlerInitialized) {
        this.initEditHandler();
      }
    }

    // claude - Modify J1 VideoPlayer #21
    // Active-item state management
    // -------------------------------------------------------------------------
    // The playlist is rendered (as cards or list rows) under
    // #videoplayer_playlist_parent_<id>. Every entry element carries
    // data-item-active="false" by default. While a video taken from the
    // playlist is in the 'playing' state, the matching element is flipped to
    // data-item-active="true" so the UI can highlight the now-playing item.
    //
    // setActiveItem(videoId)  -> remember videoId and mark its element active
    // clearActiveItem()       -> forget the active videoId and reset all marks
    // _applyActiveItem()      -> re-apply the current mark to the live DOM
    //                            (called by the render methods after they
    //                            rebuild innerHTML with all marks reset).

    // claude - Modify J1 VideoPlayer #21
    setActiveItem(videoId) {
      this._activeVideoId = videoId || null;
      this._applyActiveItem();
    }

    // claude - Modify J1 VideoPlayer #21
    clearActiveItem() {
      this._activeVideoId = null;
      this._applyActiveItem();
    }

    // claude - Modify J1 VideoPlayer #21
    _applyActiveItem() {
      const playlistContainer = document.getElementById(_pid('videoplayer_playlist_parent'));
      if (!playlistContainer) return;

      // Reset every entry, then mark the active one (if any). Iterating and
      // comparing dataset.videoId avoids CSS-selector escaping issues for
      // videoIds that contain special characters.
      const items = playlistContainer.querySelectorAll('[data-item-active]');
      items.forEach(el => {
        const isActive = !!this._activeVideoId && el.getAttribute('data-video-id') === this._activeVideoId;
        el.setAttribute('data-item-active', isActive ? 'true' : 'false');
      });
    }

    // Event delegation
    // -------------------------------------------------------------------------

    initDeleteHandler() {

      // Fix J1 VideoPlayer #2: corrected ID
      const playlistContainer = document.getElementById(_pid('videoplayer_playlist_parent'));
      if (!playlistContainer) return;

      // Fix J1 VideoPlayer #5
      // Guard flag set here to prevent duplicate listener registration.
      this._deleteHandlerInitialized = true;

      playlistContainer.addEventListener('click', (event) => {
        const deleteBtn = event.target.closest('.playlist-btn.delete');
        if (!deleteBtn) return;

        const row     = deleteBtn.closest('[data-video-id]');
        const videoId = row ? row.dataset.videoId : null;

        if (videoId) {
          this.deleteEntry(videoId);
        }
      });

      isDev && logger.info('\n' + 'playlistManager: delete handler initialized');
    }

    // playEntry now resolves the video src from the playlist entry and passes
    // it to embedRunVideo so the native player receives a proper file URL.
    playEntry(videoId) {
      if (!videoId) {
        isDev && logger.warn('\n' + 'playlistManager: playEntry called without a videoId');
        return;
      }

      isDev && logger.info('\n' + `playlistmanager: playing entry for videoId: ${videoId}`);
      _startedFromPlaylist = true; // Modify J1 VideoPlayer #3
      this.embedRunVideo(videoId);
    }

    // embedRunVideo looks up the 'src' field from the playlist entry
    // so that the native player receives the correct local/remote file URL.
    embedRunVideo(videoId, mode) {
      if (!videoId) {
        isDev && logger.warn('\n' + 'playlistManager: embedRunVideo called without a videoId');
        return;
      }

      isDev && logger.info('\n' + `playlistManager: embedding video for videoId: ${videoId}`);

      // Resolve the src from the playlist entry; fall back to videoId as-is
      const playlist = this.load() || [];
      const entry    = playlist.find(item => item.videoId === videoId);
      const videoSrc = (entry && entry.src) ? entry.src : videoId;

      embedRunVideo(videoSrc, mode);
    }

    // claude - Modify J1 VideoPlayer #41
    // autoLoadFirstEntryOnReload()
    //
    // Page-load counterpart to the load-and-pause behaviour the
    // playlistIOHandler applies after a user-triggered load
    // (handleLoadFromServer() / #26 and handleFileSelected() / #27):
    // When a playlist is ALREADY present in the instance's localStorage
    // (i.e. it was loaded in an earlier session/visit and the whole page
    // is now reloaded), load the first video of the display-ordered list
    // into the player and start it in the 'paused' state —
    // exactly as if the user had just (re)loaded that playlist.
    //
    // The display order is reproduced by applying the active sort criterion
    // (_currentSort) to a fresh copy of the stored playlist — the same
    // ordering renderCards()/renderPlaylist() apply — so the entry chosen
    // here matches the first row the user sees. Going through
    // embedRunVideo(videoId, 'pause') resolves the entry's src and, via
    // playerMode === 'pause', pauses playback right after start (see the
    // autoplay branch in embedRunVideo). 'pause' mode (instead of playEntry())
    // is deliberate and mirrors #26/#27: it does NOT set _startedFromPlaylist,
    // so the playlist panel is left open after load.
    // As with #26/#27, the paused-after-start behaviour depends on the
    // autoplay config being enabled.
    //
    // Differences from preloadPlaylists() (#39) are intentional: preload only
    // SEEDS/merges configured playlist files and explicitly does NOT
    // auto-embed (to avoid clashing with the autoStart/init path on a first
    // visit). This method, by contrast, only ever acts on a playlist that
    // is ALREADY in localStorage at load time — it never fetches or merges —
    // so on a fresh first visit (empty list) it is a no-op and the autoStart
    // path is left untouched.
    //
    // Once-only: guarded by the module-level _autoLoadFirstOnReloadDone
    // flag so repeated handler init or multiple callers cannot double-load.
    // The flag is set only on the success path, so a not-ready or empty-list
    // call remains retriable (e.g. an adapter call after async setup
    // completes).
    //
    // claude - Modify J1 VideoPlayer #43
    // The once-only guard described above is now keyed per player
    // (_autoLoadFirstOnReloadDoneByPid[_playerID]) rather than a single shared
    // boolean, so on a multi-player page each player auto-loads its own stored
    // first entry exactly once. NOTE: this keys the guard correctly, but for
    // every player to actually auto-load, autoLoadFirstEntryOnReload() must be
    // invoked once PER PLAYER with _playerID set to that player's id. The
    // current call site is playlistSortHandler.init() — a single, page-global
    // handler (see the timing/scope note below) — so the adapter still needs to
    // drive this method per-instance (it is exported on playlistManager) for
    // multi-player auto-load to take full effect. Flagged for review.
    //
    // Timing/scope (flagged for review): this is invoked from
    // playlistSortHandler.init(), a page-load handler the adapter
    // instantiates after its dependencies (videojs + j1.adapter.videoPlayer.videoPlayerOptions)
    // are met, so embedRunVideo() is callable by then — the same readiness the
    // IO handlers rely on at click time. A defensive readiness check below
    // skips (without consuming the once-only flag) if the adapter options
    // are not yet present.
    // Because playlistSortHandler is a single, page-global handler (it resolves
    // '.playlist-block-title'/'#playlistSortSelect' without _pid()), this
    // auto-load targets the playlistManager's current player scope, matching
    // that handler's existing load()/save()/renderCurrent() behaviour.
    // The method is also reachable via the public playlistManager export,
    // so the adapter can drive it per-instance at a more precise point if
    // multi-instance auto-load on reload is later required.
    //
    // @return {boolean} true if a first entry was auto-loaded, false otherwise.
    //
    autoLoadFirstEntryOnReload() {
      // claude - Modify J1 VideoPlayer #41
      // Once-only guard: never auto-load more than once per page load.
      // claude - Modify J1 VideoPlayer #43
      // Now keyed by the current player scope (_playerID) instead of a single
      // shared boolean, so each player on a multi-player page is guarded
      // independently and one player's completed auto-load no longer suppresses
      // its siblings'. See the registry declaration near the module-level flags.
      // Original (deprecated, preserved for reference):
      //   if (_autoLoadFirstOnReloadDone) {
      //     isDev && logger.debug('\n' + 'playlistManager: auto-load on reload already done — skipping');
      //     return false;
      //   }
      if (_autoLoadFirstOnReloadDoneByPid[_playerID]) {
        isDev && logger.debug('\n' + `playlistManager: auto-load on reload already done for player "${_playerID}" — skipping`);
        return false;
      }

      // claude - Modify J1 VideoPlayer #41
      // Defensive readiness check. embedRunVideo() reads
      // j1.adapter.videoPlayer.videoPlayerOptions (and relies on videojs).
      // If the adapter has not finished wiring yet, skip WITHOUT consuming
      // the once-only flag so a later (adapter-driven) call can still succeed.
      //
      if (typeof j1 === 'undefined' || !j1 || !j1.adapter || !j1.adapter.videoPlayer
          || !j1.adapter.videoPlayer.videoPlayerOptions) {
        isDev && logger.debug('\n' + 'playlistManager: auto-load on reload deferred — adapter not ready yet');
        return false;
      }

      // claude - Modify J1 VideoPlayer #41
      // Resolve the display-first entry from the ALREADY-stored playlist (no
      // fetch/merge). _applySortOrder() sorts in place on a fresh load() copy.
      const currentList = this.load() || [];
      this._applySortOrder(currentList);
      const firstEntry = currentList[0];

      if (!firstEntry || !firstEntry.videoId) {
        // Empty/invalid list: nothing was "already loaded", so there is nothing
        // to restore on reload. Leave the once-only flag unset (retriable).
        isDev && logger.debug('\n' + 'playlistManager: no stored playlist on reload — nothing to auto-load');
        return false;
      }

      // claude - Modify J1 VideoPlayer #41
      // Mirror of the IO-handler container guard (#26/#33): if a previous
      // session teardown left the player slot without its empty-player overlay,
      // restore the pristine container markup before embedding. On a normal
      // reload the overlay is already present (server-rendered), so this
      // branch is inert.
      // Guarded on container/containerHTML because those module-level refs
      // are only populated once playlistIOHandler has been constructed.
      //
      try {
        const overlayExists = document.getElementById(_pid('emptyPlayerOverlay'));
        if (!overlayExists && container && containerHTML) {
          isDev && logger.debug('\n' + 'playlistManager: restoring container/overlay before reload auto-load');
          container.innerHTML = containerHTML;
        }
      } catch (e) {
        isDev && logger.warn('\n' + `playlistManager: reload container restore skipped: ${e}`);
      }

      // claude - Modify J1 VideoPlayer #41
      // Consume the once-only guard now (success path) and load the first entry
      // in the paused state, exactly as handleLoadFromServer()/handleFileSelected().
      // claude - Modify J1 VideoPlayer #43
      // Mark the once-only guard consumed for THIS player only (keyed by
      // _playerID) so sibling players on the same page can still auto-load their
      // own stored first entry. Mirrors the per-player read guard above.
      // Original (deprecated, preserved for reference):
      //   _autoLoadFirstOnReloadDone = true;
      _autoLoadFirstOnReloadDoneByPid[_playerID] = true;
      isDev && logger.info('\n' + `playlistManager: loading first stored-playlist video in paused state on reload (videoId: ${firstEntry.videoId})`);
      this.embedRunVideo(firstEntry.videoId, 'pause');
      return true;
    }

    initPlayHandler() {

      // Fix J1 VideoPlayer #2: corrected ID
      const playlistContainer = document.getElementById(_pid('videoplayer_playlist_parent'));
      if (!playlistContainer) return;

      // Fix J1 VideoPlayer #5
      // Guard flag set here so renderCurrent() can protect against duplicate
      // listener registration (same pattern used by initRateHandler, etc.).
      this._playHandlerInitialized = true;

      playlistContainer.addEventListener('click', (event) => {
        const playOverlay = event.target.closest('.playlist-play-overlay');
        if (!playOverlay) return;

        const row     = playOverlay.closest('[data-video-id]');
        const videoId = row ? row.dataset.videoId : null;

        if (videoId) {
          this.playEntry(videoId);
        }
      });

      isDev && logger.info('\n' + 'playlistManager: play handler initialized');
    }

    // _createRatingModal: thumbnail src now uses entry.poster or
    // DEFAULT_POSTER instead of the YouTube CDN (img.youtube.com).
    _createRatingModal(videoId) {
      if (document.getElementById('ratingModal')) return;

      // Resolve poster from playlist entry
      const playlist  = this.load() || [];
      const entry     = playlist.find(item => item.videoId === videoId);
      const thumbSrc  = (entry && entry.poster) ? entry.poster : DEFAULT_POSTER;

      const modalHTML = `
        <div id="ratingModal" class="modal fade" tabindex="-1"
          aria-labelledby="ratingModalLabel"
          data-bs-backdrop="static" data-bs-keyboard="false">
          <div class="modal-dialog modal-dialog-centered modal-notify modal-success">
            <div class="modal-content" style="max-width: 500px;">
              <div class="modal-header">
                <p id="ratingModalLabel" class="modal-title lead mb-3">Set Media Rating</p>
                <button id="closeRatingModal"
                  type="button" class="btn-close mb-3" data-bs-dismiss="modal" aria-label="Close">
                </button>
              </div>
              <div class="modal-body">
                <div class="playlist-thumb-wrapper mb-3">
                  <img id="ratingVideoThumb" class="playlist-thumb"
                       src="${thumbSrc}"
                       alt="playlist-thumb">
                </div>
                <div class="rating-dialog">
                  <div>
                    <p id="ratingVideoTitle" class="playlist-title"></p>
                    <p id="ratingVideoAuthor" class="playlist-author"></p>
                  </div>
                  <div style="text-align: center;">
                    <div id="ratingStars" class="rating-stars">
                      <span class="rating-star" data-value="1"><i class="fas fa-star"></i></span>
                      <span class="rating-star" data-value="2"><i class="fas fa-star"></i></span>
                      <span class="rating-star" data-value="3"><i class="fas fa-star"></i></span>
                      <span class="rating-star" data-value="4"><i class="fas fa-star"></i></span>
                      <span class="rating-star" data-value="5"><i class="fas fa-star"></i></span>
                    </div>
                    <p id="ratingLabel" class="rating-label"</p>
                  </div>
                  <div class="rating-modal-footer mb-2">
                    <button id="clearRatingBtn" class="rating-modal-btn rating-modal-btn-warning">Clear</button>
                    <button id="saveRatingBtn"  class="rating-modal-btn rating-modal-btn-primary" data-bs-dismiss="modal">Save Rating</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);
      this._initRatingModalEvents();
    }

    _initRatingModalEvents() {
      const overlay   = document.getElementById('ratingModal');
      const saveBtn   = document.getElementById('saveRatingBtn');
      const clearBtn  = document.getElementById('clearRatingBtn');
      const starsWrap = document.getElementById('ratingStars');

      this._ratingModalVideoId = null;
      this._ratingModalValue   = 0;

      const ratingLabels = ['No rating', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

      const updateStarDisplay = (value) => {
        const stars = starsWrap.querySelectorAll('.rating-star');
        stars.forEach(star => {
          const v = parseInt(star.dataset.value, 10);
          star.classList.toggle('active', v <= value);
        });
        const label = document.getElementById('ratingLabel');
        if (label) label.textContent = ratingLabels[value] || 'No rating';
      };

      starsWrap.addEventListener('mouseover', (e) => {
        const star = e.target.closest('.rating-star');
        if (!star) return;
        const hoverVal = parseInt(star.dataset.value, 10);
        const stars = starsWrap.querySelectorAll('.rating-star');
        stars.forEach(s => {
          s.classList.toggle('hover', parseInt(s.dataset.value, 10) <= hoverVal);
        });
      });

      starsWrap.addEventListener('mouseout', () => {
        const stars = starsWrap.querySelectorAll('.rating-star');
        stars.forEach(s => s.classList.remove('hover'));
      });

      starsWrap.addEventListener('click', (e) => {
        const star = e.target.closest('.rating-star');
        if (!star) return;
        this._ratingModalValue = parseInt(star.dataset.value, 10);
        updateStarDisplay(this._ratingModalValue);
      });

      clearBtn.addEventListener('click', () => {
        this._ratingModalValue = 0;
        updateStarDisplay(0);
      });

      saveBtn.addEventListener('click', () => {
        if (this._ratingModalVideoId) {
          this.updateEntryRating(this._ratingModalVideoId, this._ratingModalValue);
          isDev && logger.debug('\n' + `playlistmanager: rating set to ${this._ratingModalValue} for videoId: ${this._ratingModalVideoId}`);
        }
      });

      this._updateRatingStarDisplay = updateStarDisplay;
    }

    // openRatingModal: thumbnail src resolves from playlist entry.poster
    // instead of constructing a YouTube CDN URL from the videoId.
    openRatingModal(videoId) {
      if (!videoId) return;

      if(!document.getElementById('ratingModal')) {
        this._createRatingModal(videoId);
      }

      const playlist = this.load() || [];
      const entry   = playlist.find(item => item.videoId === videoId);
      if (!entry) return;

      const titleEl  = document.getElementById('ratingVideoTitle');
      const authorEl = document.getElementById('ratingVideoAuthor');
      const thumbEl  = document.getElementById('ratingVideoThumb');

      if (titleEl)  titleEl.textContent  = entry.title  || videoId;
      if (authorEl) authorEl.textContent = entry.author || '';
      if (thumbEl)  thumbEl.src = entry.poster || DEFAULT_POSTER;

      this._ratingModalVideoId = videoId;
      this._ratingModalValue   = entry.rating || 0;
      if (this._updateRatingStarDisplay) {
        this._updateRatingStarDisplay(this._ratingModalValue);
      }

      const modalEl = document.getElementById('ratingModal');
      if (modalEl) {
        const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
        bsModal.show();
      }
    }

    initRateHandler() {
      if (this._rateHandlerInitialized) return;

      // Fix J1 VideoPlayer #2: corrected ID
      const playlistContainer = document.getElementById(_pid('videoplayer_playlist_parent'));
      if (!playlistContainer) return;

      this._rateHandlerInitialized = true;

      playlistContainer.addEventListener('click', (event) => {
        const rateBtn = event.target.closest('.playlist-btn.rate');
        if (!rateBtn) return;

        const row     = rateBtn.closest('[data-video-id]');
        const videoId = row ? row.dataset.videoId : null;

        if (videoId) {
          this.openRatingModal(videoId);
        }
      });

      isDev && logger.debug('\n' + 'playlistManager: rate handler initialized');
    }

    // _createEditModal: thumbnail uses entry.poster; video link defaults to
    // entry.src (local/remote file path) instead of a YouTube watch URL.
    _createEditModal(videoId) {
      if (document.getElementById('editModal')) return;

      // Resolve poster from playlist entry
      const playlist  = this.load() || [];
      const entry     = playlist.find(item => item.videoId === videoId);
      const videoSrc  = (entry && entry.src)    ? entry.src    : '';
      const thumbSrc  = (entry && entry.poster) ? entry.poster : DEFAULT_POSTER;

      const modalHTML = `
        <div id="editModal" class="modal fade" tabindex="-1"
          aria-labelledby="editModalLabel"
          data-bs-backdrop="static" data-bs-keyboard="false">
          <div class="modal-dialog modal-dialog-scrollable modal-dialog-centered modal-notify modal-success">
            <div class="modal-content" style="max-width: 500px;">
              <div class="modal-header">
                <p id="editModalLabel" class="modal-title lead mb-3">Edit Media Settings</p>
                <button id="closeEditModal"
                  type="button" class="btn-close mb-3" data-bs-dismiss="modal" aria-label="Close">
                </button>
              </div>
              <div class="modal-body">
                <div class="playlist-thumb-wrapper mb-3">
                  <img id="editVideoThumb" class="playlist-thumb" src="${thumbSrc}" alt="playlist-thumb">
                </div>
                <div class="edit-dialog">

                  <div>
                    <p id="editVideoTitle" class="playlist-title"></p>
                    <p id="editVideoAuthor" class="playlist-author"></p>
                  </div>

                  <div class="edit-field-group">
                    <label class="edit-field-label" for="editFieldCategory">Category</label>
                    <select id="editFieldCategory" class="edit-field-input" form="playlist">
                      <option value="">Select a category</option>
                      <option value="Animals">Animals</option>
                      <option value="Beauty">Beauty</option>
                      <option value="Comedy">Comedy</option>
                      <option value="Education">Education</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Events">Events</option>
                      <option value="Gaming">Gaming</option>
                      <option value="Howto">Howto</option>
                      <option value="Music">Music</option>
                      <option value="News">News</option>
                      <option value="People">People</option>
                      <option value="Sports">Sports</option>
                      <option value="Science">Science</option>
                      <option value="Technology">Technology</option>
                      <option value="Travel">Travel</option>
                      <option value="Vehicles">Vehicles</option>
                    </select>
                  </div>

                  <div class="edit-field-group">
                    <label class="edit-field-label" for="editFieldTitle">Title</label>
                    <input id="editFieldTitle" class="edit-field-input" placeholder="Title ..." ></input>
                  </div>

                  <div class="edit-field-group">
                    <label class="edit-field-label" for="editFieldDescription">Description</label>
                    <textarea id="editFieldDescription" class="edit-field-input" placeholder="Description text ..." rows="3" style="overflow-y: auto; resize: vertical;"></textarea>
                  </div>

                  <div class="edit-field-group">
                    <label class="edit-field-label" for="editFieldSeries">Series</label>
                    <select id="editFieldSeries" class="edit-field-input" form="series">
                     <option value="">Enable|Disable Series</option>
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  </div>

                  <div class="edit-field-group">
                    <label class="edit-field-label" for="editFieldEpisode">Episode</label>
                    <input id="editFieldEpisode" type="number" class="edit-field-input" min="0" step="1" placeholder="0" />
                  </div>

                  <div class="edit-field-group">
                    <label class="edit-field-label" for="editFieldInfoLink">Info Link</label>
                    <div class="edit-field-info-link-wrapper" style="display:flex; align-items:center; gap:6px;">
                      <input id="editFieldInfoLink" type="url" class="edit-field-input" style="flex:1;" placeholder="e.g. https://en.wikipedia.org/wiki/..." />
                      <button id="editInfoLinkOpenBtn" type="button" title="Open link in new window"
                        style="display:none; border:none; background:transparent; cursor:pointer; padding:2px 4px; color:#0d6efd; font-size:1.1rem;"
                        aria-label="Open info link in new window">
                        <i class="fas fa-external-link-alt"></i>
                      </button>
                    </div>
                  </div>

                  <div class="edit-field-group videoplayer-videolink-group mt-2">
                    <label class="edit-field-label" for="entryVideoLink_${videoId}">Video Link</label>
                    <div class="edit-field-video-link-wrapper" style="display:flex; align-items:center; gap:6px;">
                      <input id="editFieldVideoLink" type="url" class="edit-field-input form-control" style="flex:1;"
                             placeholder="e.g. /assets/video/my-video.mp4 or https://example.com/v.mp4"
                             value="${videoSrc}" />
                      <button id="editVideoLinkOpenBtn" type="button" title="Open link in new window"
                        style="border:none; background:transparent; cursor:pointer; padding:2px 4px; color:#0d6efd; font-size:1.1rem;"
                        aria-label="Open video link in new window">
                        <i class="fas fa-external-link-alt"></i>
                      </button>
                    </div>
                  </div>

                  <div class="edit-field-group">
                    <label class="edit-field-label" for="editFieldIssueDate">Issue Date</label>
                    <input id="editFieldIssueDate" type="date" class="edit-field-input" placeholder="e.g. 2025-01-15" />
                  </div>

                  <div class="edit-field-group">
                    <label class="edit-field-label" for="editFieldTags">Tags</label>
                    <select id="editFieldTags" class="edit-field-input" form="playlist">
                      ${GENRE_OPTIONS_HTML}
                    </select>
                    <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
                      <input id="editFieldTagsCustom" type="text" class="edit-field-input" style="flex:1;"
                        placeholder="selected and custom tags (comma separated)" />
                    </div>
                  </div>

                  <div class="edit-field-group">
                    <label class="edit-field-label" for="editFieldType">Type</label>
                    <select id="editFieldType" class="edit-field-input" form="type">
                      <option value="">Select a content type</option>
                      <option value="video" selected>video</option>
                      <option value="audio">audio</option>
                    </select>
                  </div>

                  <div class="rating-modal-footer mb-2">
                    <button id="clearEditBtn" class="rating-modal-btn rating-modal-btn-warning">Clear</button>
                    <button id="saveEditBtn" class="rating-modal-btn rating-modal-btn-primary" data-bs-dismiss="modal">Save</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);
      this._initEditModalEvents();
    }

    _initEditModalEvents() {
      const saveBtn  = document.getElementById('saveEditBtn');
      const clearBtn = document.getElementById('clearEditBtn');

      this._editModalVideoId = null;

      clearBtn.addEventListener('click', () => {
        document.getElementById('editFieldCategory').value      = '';
        document.getElementById('editFieldTitle').value         = '';
        document.getElementById('editFieldDescription').value   = '';        
        document.getElementById('editFieldEpisode').value       = '';
        document.getElementById('editFieldInfoLink').value      = '';
        document.getElementById('editFieldVideoLink').value     = '';
        document.getElementById('editFieldIssueDate').value     = '';
        document.getElementById('editFieldSeries').value        = '';
        document.getElementById('editFieldTags').value          = '';
        document.getElementById('editFieldTagsCustom').value    = '';
        document.getElementById('editFieldType').value          = '';

        this._updateInfoLinkButton();
        this._updateVideoLinkButton();
      });

      const _appendTagToInput = (tag) => {
        const customInput = document.getElementById('editFieldTagsCustom');
        const current     = customInput.value
          .split(',').map(t => t.trim()).filter(Boolean);

        if (!current.includes(tag)) {
          current.push(tag);
          customInput.value = current.join(', ');
          customInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };

      const tagsSelect = document.getElementById('editFieldTags');
      tagsSelect.addEventListener('change', () => {
        const value = tagsSelect.value;
        if (value) {
          _appendTagToInput(value);
          tagsSelect.value = '';
          tagsSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      saveBtn.addEventListener('click', () => {
        if (this._editModalVideoId) {
          const tagsRaw = document.getElementById('editFieldTagsCustom').value;
          const tags    = tagsRaw
            ? [...new Set(tagsRaw.split(',').map(t => t.trim()).filter(Boolean))]
            : [];

          const fields = {
            category:     document.getElementById('editFieldCategory').value.trim(),
            title:        document.getElementById('editFieldTitle').value.trim(),
            description:  document.getElementById('editFieldDescription').value.trim(),            
            episode:      parseInt(document.getElementById('editFieldEpisode').value, 10) || 0,
            infoLink:     document.getElementById('editFieldInfoLink').value.trim(),
            videoLink:    document.getElementById('editFieldVideoLink').value.trim(),
            issueDate:    document.getElementById('editFieldIssueDate').value.trim(),
            series:       parseInt(document.getElementById('editFieldSeries').value, 10) || 0,
            tags:         tags,
            type:         document.getElementById('editFieldType').value.trim() || 'video'
          };

          this.updateEntryFields(this._editModalVideoId, fields);
          isDev && logger.debug('\n' + `playlistmanager: fields saved for videoId: ${this._editModalVideoId}`);
        }
      });

      const infoLinkInput   = document.getElementById('editFieldInfoLink');
      const infoLinkOpenBtn = document.getElementById('editInfoLinkOpenBtn');

      if (infoLinkInput && infoLinkOpenBtn) {
        infoLinkInput.addEventListener('input', () => {
          this._updateInfoLinkButton();
        });

        infoLinkOpenBtn.addEventListener('click', () => {
          const url = infoLinkInput.value.trim();
          if (this._isValidUrl(url)) {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        });
      }

      const videoLinkInput   = document.getElementById('editFieldVideoLink');
      const videoLinkOpenBtn = document.getElementById('editVideoLinkOpenBtn');

      if (videoLinkInput && videoLinkOpenBtn) {
        videoLinkInput.addEventListener('input', () => {
          this._updateVideoLinkButton();
        });

        videoLinkOpenBtn.addEventListener('click', () => {
          const url = videoLinkInput.value.trim();
          if (this._isValidUrl(url)) {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        });
      }

      const episodeInput = document.getElementById('editFieldEpisode');
      const seriesSelect = document.getElementById('editFieldSeries');

      if (episodeInput && seriesSelect) {
        episodeInput.addEventListener('input', () => {
          const episodeValue = parseInt(episodeInput.value, 10) || 0;
          if (episodeValue > 0) {
            seriesSelect.value = '1';
            seriesSelect.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            seriesSelect.value = '0';
            seriesSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }
    }

    // openEditModal: thumbnail and video link default to native video fields
    // (entry.poster, entry.src) instead of YouTube CDN / YouTube watch URL.
    openEditModal(videoId) {
      if (!videoId) return;

      if (!document.getElementById('editModal')) {
        this._createEditModal(videoId);
      }

      const playlist = this.load() || [];
      const entry    = playlist.find(item => item.videoId === videoId);
      if (!entry) return;

      const titleEl  = document.getElementById('editVideoTitle');
      const authorEl = document.getElementById('editVideoAuthor');
      const thumbEl  = document.getElementById('editVideoThumb');

      if (titleEl)  titleEl.textContent  = entry.title  || videoId;
      if (authorEl) authorEl.textContent = entry.author || '';
      if (thumbEl)  thumbEl.src = entry.poster || DEFAULT_POSTER;

      document.getElementById('editFieldCategory').value      = entry.category    || '';
      document.getElementById('editFieldTitle').value         = entry.title       || '';
      document.getElementById('editFieldDescription').value   = entry.description || '';
      document.getElementById('editFieldEpisode').value       = entry.episode     || '';
      document.getElementById('editFieldInfoLink').value      = entry.infoLink    || '';
      document.getElementById('editFieldVideoLink').value     = entry.videoLink   || entry.src || '';
      document.getElementById('editFieldIssueDate').value     = entry.issueDate   || '';
      document.getElementById('editFieldSeries').value        = entry.series      ? '1' : '';

      const entryTags = Array.isArray(entry.tags) ? entry.tags : [];
      document.getElementById('editFieldTagsCustom').value    = entryTags.join(', ');
      document.getElementById('editFieldTags').value          = '';
      document.getElementById('editFieldType').value          = entry.type        || 'video';

      this._updateInfoLinkButton();
      this._updateVideoLinkButton();

      this._editModalVideoId = videoId;

      const modalEl = document.getElementById('editModal');
      if (modalEl) {
        const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
        bsModal.show();
      }
    }

    initEditHandler() {
      if (this._editHandlerInitialized) return;

      // Fix J1 VideoPlayer #2: corrected ID;
      const playlistContainer = document.getElementById(_pid('videoplayer_playlist_parent'))
      if (!playlistContainer) return;

      this._editHandlerInitialized = true;

      playlistContainer.addEventListener('click', (event) => {
        const editBtn = event.target.closest('.playlist-btn.edit');
        if (!editBtn) return;

        const row     = editBtn.closest('[data-video-id]');
        const videoId = row ? row.dataset.videoId : null;

        if (videoId) {
          this.openEditModal(videoId);
        }
      });

      isDev && logger.info('\n' + 'playlistManager: edit handler initialized');
    }

    initInfoLinkHandler() {
      if (this._infoLinkHandlerInitialized) return;

      // Fix J1 VideoPlayer #2: corrected ID;
      const playlistContainer = document.getElementById(_pid('videoplayer_playlist_parent'))
      if (!playlistContainer) return;

      this._infoLinkHandlerInitialized = true;

      playlistContainer.addEventListener('click', (event) => {
        const infoLink = event.target.closest('.playlist-info-link');
        if (!infoLink) return;
        event.stopPropagation();
      });

      isDev && logger.info('\n' + 'playlistManager: infoLink handler initialized');
    }

    initVideoLinkHandler() {
      if (this._videoLinkHandlerInitialized) return;

      // Fix J1 VideoPlayer #2: corrected ID;
      const playlistContainer = document.getElementById(_pid('videoplayer_playlist_parent'))
      if (!playlistContainer) return;

      this._videoLinkHandlerInitialized = true;

      playlistContainer.addEventListener('click', (event) => {
        const videoLink = event.target.closest('.playlist-video-link');
        if (!videoLink) return;
        event.stopPropagation();
      });

      isDev && logger.info('\n' + 'playlistManager: videoLink handler initialized');
    }

    // search engine
    // -------------------------------------------------------------------------

    _saveSearchIndex() {
      if (!this._searchIndex) return;
      try {
        localStorage.setItem(this.INDEX_KEY, JSON.stringify(this._searchIndex));
        isDev && logger.info('\n' + 'playlistManager: search index saved to localStorage');
      } catch (e) {
        logger.error('\n' + `playlistManager: failed to save search index: ${e}`);
      }
    }

    _loadSearchIndex() {
      try {
        const stored = localStorage.getItem(this.INDEX_KEY);
        if (!stored) return false;
        this._searchIndex = lunr.Index.load(JSON.parse(stored));
        isDev && logger.info('\n' + 'playlistManager: search index loaded from localStorage');
        return true;
      } catch (e) {
        isDev && logger.debug('\n' + `playlistManager: failed to load search index from localStorage: ${e}`);
        this._searchIndex = null;
        return false;
      }
    }

    _invalidateSearchIndex() {
      this._searchIndex = null;
      localStorage.removeItem(this.INDEX_KEY);
    }

    buildSearchIndex() {
      const data = this.load() || [];
      const self = this;

      this._searchIndex = lunr(function () {
        // Claude - J1 videoPlayer optimizations #2 (b)
        // Correctness: the document objects passed to add() below have always
        // carried a `description` property, but the field was never DECLARED
        // via this.field() — and lunr silently ignores undeclared fields at
        // add() time, so descriptions were never indexed and a search for
        // description text returned no hits. Declaring the field makes the
        // already-supplied data searchable; no add() change needed.        
        this.ref('videoId');
        this.field('title',    { boost: 10 });
        this.field('author',   { boost: 5 });
        this.field('category', { boost: 3 });
        this.field('tags',     { boost: 3 });
        this.field('description', { boost: 2 });
        this.field('infoLink');
        this.field('videoLink');
        this.field('issueDate');
        this.field('type');

        data.forEach(function (entry) {
          self._normalizeEntry(entry);
          this.add({
            videoId:      entry.videoId     || '',
            title:        entry.title       || '',
            author:       entry.author      || '',
            category:     entry.category    || '',
            description:  entry.description || '',
            infoLink:     entry.infoLink    || '',
            videoLink:    entry.videoLink   || '',
            issueDate:    entry.issueDate   || '',
            type:         entry.type        || '',
            tags:         Array.isArray(entry.tags) ? entry.tags.join(' ') : '',
          });
        }, this);
      });

      isDev && logger.info('\n' + `playlistManager: search index built with ${data.length} entries`);

      this._saveSearchIndex();
    }

    searchPlaylist(query) {
      if (!query || !query.trim()) {
        this.clearSearch();
        return [];
      }

      if (!this._searchIndex && !this._loadSearchIndex()) {
        this.buildSearchIndex();
      }

      if (!this._searchIndex) {
        isDev && logger.warn('\n' + 'playlistManager: search index not available');
        return [];
      }

      let lunrResults;
      try {
        lunrResults = this._searchIndex.search(query);
      } catch (e) {
        isDev && logger.warn('\n' + `playlistManager: lunr search error: ${e}`);
        lunrResults = [];
      }

      const data     = this.load() || [];
      const matchIds = new Set(lunrResults.map(r => r.ref));
      const results  = data.filter(item => matchIds.has(item.videoId));

      const orderMap = {};
      lunrResults.forEach((r, i) => { orderMap[r.ref] = i; });
      results.sort((a, b) => (orderMap[a.videoId] || 0) - (orderMap[b.videoId] || 0));

      this._searchResults = results;

      isDev && logger.debug('\n' + `playlistManager: search for "${query}" returned ${results.length} results`);

      this.renderCurrent();
      return results;
    }

    // Claude - J1 videoPlayer optimizations #2 (h)
    // Performance helper for the date criteria of _applySortOrder(): the
    // original comparators constructed TWO `new Date(...)` objects on EVERY
    // comparison, i.e. ~2·n·log(n) Date parses per sort (a 200-entry list
    // sorts with roughly 3000 short-lived Date allocations — on every render
    // while a date criterion is active). The timestamp is now computed ONCE
    // per element (decorate-sort pattern via a Map keyed by the element
    // reference) and the comparator reduces to a numeric subtraction.
    // Order semantics are IDENTICAL to the originals, including the
    // invalid-date case: an unparseable date yields NaN, the subtraction
    // yields NaN, and Array.prototype.sort treats a NaN comparator result
    // exactly like 0 — the same behaviour the `new Date(a) - new Date(b)`
    // comparators had. Sorting stays in place on `data`, preserving the
    // method's contract.
    //
    // @param {Array<Object>} data  playlist entries (sorted in place)
    // @param {Function}      tsOf  entry -> numeric timestamp (may be NaN)
    // @param {boolean}       desc  true = newest first
    _sortByTimestamp(data, tsOf, desc) {
      const ts = new Map();
      data.forEach(e => ts.set(e, tsOf(e)));
      data.sort((a, b) => desc ? (ts.get(b) - ts.get(a)) : (ts.get(a) - ts.get(b)));
      return data;
    }

    _applySortOrder(data) {
      if (!data || data.length === 0) return data;

      const criterion = this._currentSort || 'watchDate';

      switch (criterion) {
        case 'watchDate':
          // Claude - J1 videoPlayer optimizations #2 (h)
          // Original (deprecated, preserved for reference):
          //   data.sort((a, b) => new Date(b.watchDate) - new Date(a.watchDate));
          this._sortByTimestamp(data, e => new Date(e.watchDate).getTime(), true);
          break;
        case 'watchDateAsc':
          // Claude - J1 videoPlayer optimizations #2 (h)
          // Original (deprecated, preserved for reference):
          //   data.sort((a, b) => new Date(a.watchDate) - new Date(b.watchDate));
          this._sortByTimestamp(data, e => new Date(e.watchDate).getTime(), false);
          break;
        case 'title':
          data.sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));
          break;
        case 'author':
          data.sort((a, b) => (a.author || '').localeCompare(b.author || '', undefined, { sensitivity: 'base' }));
          break;
        case 'duration':
          data.sort((a, b) => (b.duration || 0) - (a.duration || 0));
          break;
        case 'durationAsc':
          data.sort((a, b) => (a.duration || 0) - (b.duration || 0));
          break;
        case 'rating':
          data.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'category':
          data.sort((a, b) => (a.category || '').localeCompare(b.category || '', undefined, { sensitivity: 'base' }));
          break;
        case 'type':
          data.sort((a, b) => (a.type || '').localeCompare(b.type || '', undefined, { sensitivity: 'base' }));
          break;
        case 'issueDate':
          // Claude - J1 videoPlayer optimizations #2 (h)
          // Original (deprecated, preserved for reference):
          //   data.sort((a, b) => {
          //     const da = a.issueDate ? new Date(a.issueDate) : new Date(0);
          //     const db = b.issueDate ? new Date(b.issueDate) : new Date(0);
          //     return db - da;
          //   });
          // The empty-issueDate fallback (`new Date(0)` == epoch == 0) is
          // reproduced as the numeric literal 0.
          this._sortByTimestamp(data, e => e.issueDate ? new Date(e.issueDate).getTime() : 0, true);
          break;
        case 'issueDateAsc':
          // Claude - J1 videoPlayer optimizations #2 (h)
          // Original (deprecated, preserved for reference):
          //   data.sort((a, b) => {
          //     const da = a.issueDate ? new Date(a.issueDate) : new Date(0);
          //     const db = b.issueDate ? new Date(b.issueDate) : new Date(0);
          //     return da - db;
          //   });
          this._sortByTimestamp(data, e => e.issueDate ? new Date(e.issueDate).getTime() : 0, false);
          break;
        case 'episode':
          data.sort((a, b) => {
            const aSeries = a.series ? 1 : 0;
            const bSeries = b.series ? 1 : 0;
            if (aSeries !== bSeries) return bSeries - aSeries;
            return (a.episode || 0) - (b.episode || 0);
          });
          break;
        case 'series':
          data.sort((a, b) => {
            const aSeries = a.series ? 1 : 0;
            const bSeries = b.series ? 1 : 0;
            if (aSeries !== bSeries) return bSeries - aSeries;
            return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
          });
          break;
        default:
          break;
      }

      return data;
    }

    // Enables the #toggle_playlist button only when at least one playlist
    // entry exists in localStorage.  When the playlist is empty the button
    // receives the HTML `disabled` attribute and a reduced opacity so it is
    // clearly non-interactive; both are removed the moment data is present.
    //
    // The helper follows the same _update*Visibility pattern used by
    // _updateSortSelectVisibility, _updateModeSwitchVisibility, etc. and is
    // called unconditionally from renderCurrent() so the button state is
    // always in sync with the actual playlist contents.
    //
    // Also blocks #toggle_playlist whenever the playlist editor is open
    // (#edit_playlist has data-edit-open="true").  While the editor occupies
    // the video-container slot, toggling the playlist panel is meaningless and
    // could leave the UI in an inconsistent state, so the button is disabled
    // (same visual treatment as the empty-playlist case) for the duration of
    // the edit session.  The block is lifted automatically as soon as the
    // editor is closed (data-edit-open attribute becomes "false" or absent).
    //
    // Claude - J1 videoPlayer optimizations #2 (d)
    // Optional `data` parameter: when renderCurrent() passes its already-
    // resolved view snapshot, the extra localStorage parse is skipped. All
    // pre-existing no-argument call sites keep the original behaviour via
    // the fallback below.
    // Original (deprecated, preserved for reference):
    //   _updateTogglePlaylistButton() {
    _updateTogglePlaylistButton(data) {
      const btn = document.getElementById(_pid('toggle_playlist'));
      if (!btn) return;

      // Check whether the playlist editor is currently open.
      const editBtn    = document.getElementById(_pid('edit_playlist'));
      const editIsOpen = editBtn && editBtn.getAttribute('data-edit-open') === 'true';

      if (editIsOpen) {
        btn.setAttribute('disabled', '');
        btn.setAttribute('aria-disabled', 'true');
        btn.style.opacity = '0.35';
        btn.style.cursor  = 'not-allowed';
        btn.title         = 'Close the playlist editor first';
        isDev && logger.debug('\n' + '_updateTogglePlaylistButton: button blocked — playlist editor is open');
        return;
      }

      // Claude - J1 videoPlayer optimizations #2 (d)
      // Original (deprecated, preserved for reference):
      //   const data    = this._searchResults || this.load() || [];
      if (!data) data = this._searchResults || this.load() || [];
      const hasData = data.length > 0;

      if (hasData) {
        btn.removeAttribute('disabled');
        btn.setAttribute('aria-disabled', 'false');
        btn.style.removeProperty('opacity');
        btn.style.removeProperty('cursor');
        btn.title       = btn.getAttribute('aria-label') || 'Show playlist';
      } else {
        btn.setAttribute('disabled', '');
        btn.setAttribute('aria-disabled', 'true');
        btn.style.opacity = '0.35';
        btn.style.cursor  = 'not-allowed';
        btn.title         = 'No playlist loaded';
      }

      isDev && logger.debug('\n' + `_updateTogglePlaylistButton: button ${hasData ? 'enabled' : 'disabled'} (${data.length} items)`);
    }

    // Claude - J1 videoPlayer optimizations #2 (d)
    // Optional `data` parameter on the three helpers below — see the
    // renderCurrent() note. No-argument calls behave exactly as before.
    // Original (deprecated, preserved for reference):
    //   _updateSortSelectVisibility() {
    //     ...
    //     const data = this._searchResults || this.load() || [];
    _updateSortSelectVisibility(data) {
      // claude - J1 VideoPlayer MultiInstance #4
      // This per-render visibility helper must resolve the SAME player-scoped id
      // the sort handler now creates (_pid('playlistSortSelect')). Left bare, it
      // would no longer find the (now suffixed) control for any player and the
      // show/hide-on-empty behaviour would silently stop working.
      // Original (deprecated, preserved for reference):
      //   const sortSelect = document.getElementById('playlistSortSelect');
      const sortSelect = document.getElementById(_pid('playlistSortSelect'));
      if (!sortSelect) return;

      if (!data) data = this._searchResults || this.load() || [];
      sortSelect.style.display = data.length > 0 ? '' : 'none';

      this._updateSortOptionsVisibility(sortSelect, data);
    }

    // Claude - J1 videoPlayer optimizations #2 (d)
    // Original (deprecated, preserved for reference):
    //   _updateModeSwitchVisibility() {
    //     ...
    //     const data = this._searchResults || this.load() || [];
    _updateModeSwitchVisibility(data) {
      // claude - J1 VideoPlayer MultiInstance #4
      // Match the player-scoped id created by playlistModeSwitchHandler.
      // Original (deprecated, preserved for reference):
      //   const listModeSwitch = document.getElementById('playlistModeSwitch');
      const listModeSwitch = document.getElementById(_pid('playlistModeSwitch'));
      if (!listModeSwitch) return;

      if (!data) data = this._searchResults || this.load() || [];
      listModeSwitch.style.display = data.length > 0 ? '' : 'none';
    }

    // Claude - J1 videoPlayer optimizations #2 (d)
    // Original (deprecated, preserved for reference):
    //   _updateMergeSwitchVisibility() {
    //     ...
    //     const data = this._searchResults || this.load() || [];
    _updateMergeSwitchVisibility(data) {
      // claude - J1 VideoPlayer MultiInstance #4
      // Match the player-scoped id created by playlistMergeSwitchHandler.
      // Original (deprecated, preserved for reference):
      //   const mergeModeSwitch = document.getElementById('playlistMergeSwitch');
      const mergeModeSwitch = document.getElementById(_pid('playlistMergeSwitch'));
      if (!mergeModeSwitch) return;

      if (!data) data = this._searchResults || this.load() || [];
      mergeModeSwitch.style.display = data.length > 0 ? '' : 'none';
    }

    // Claude - J1 videoPlayer optimizations #2 (d)
    // Optional `data` parameter — see the renderCurrent() note. No-argument
    // calls behave exactly as before.
    // Original (deprecated, preserved for reference):
    //   _updateLoopSwitchVisibility() {
    _updateLoopSwitchVisibility(data) {
      // claude - J1 VideoPlayer MultiInstance #4
      // Match the player-scoped ids created by playlistLoopSwitchHandler
      // (switch: _pid('playlisLoopSwitch'), checkbox: _pid('loopMode')).
      // Original (deprecated, preserved for reference):
      //   const loopSwitch = document.getElementById('playlisLoopSwitch');
      const loopSwitch = document.getElementById(_pid('playlisLoopSwitch'));
      if (!loopSwitch) return;

      if (!loopConfigEnabled) {
        loopSwitch.style.display = 'none';
        if (this._loopEnabled) {
          this._loopEnabled = false;
          // claude - J1 VideoPlayer MultiInstance #6
          // Player-scope this UI-preference write so it clears only THIS player's
          // persisted loop flag (see the constructor-read note). _pid('playlistLoop')
          // matches the key read back in the constructor and the loop checkbox id.
          // Original (deprecated, preserved for reference):
          //   localStorage.setItem('playlistLoop', 'false');
          localStorage.setItem(_pid('playlistLoop'), 'false');
        }
        // Original (deprecated, preserved for reference):
        //   const checkbox = document.getElementById('loopMode');
        const checkbox = document.getElementById(_pid('loopMode'));
        if (checkbox) checkbox.checked = false;
        return;
      }

      // Claude - J1 videoPlayer optimizations #2 (d)
      // Original (deprecated, preserved for reference):
      //   const data      = this._searchResults || this.load() || [];
      if (!data) data = this._searchResults || this.load() || [];
      const allSeries = data.length > 0 && data.every(e => e.series && e.series >= 1);

      if (allSeries) {
        loopSwitch.style.display = '';
      } else {
        loopSwitch.style.display = 'none';

        if (this._loopEnabled) {
          this._loopEnabled = false;
          // claude - J1 VideoPlayer MultiInstance #6
          // Player-scope this UI-preference write (see the constructor-read note).
          // Original (deprecated, preserved for reference):
          //   localStorage.setItem('playlistLoop', 'false');
          localStorage.setItem(_pid('playlistLoop'), 'false');
          isDev && logger.debug('\n' + '_updateLoopSwitchVisibility: loop mode disabled (not all items are series)');
        }
        // claude - J1 VideoPlayer MultiInstance #4
        // Original (deprecated, preserved for reference):
        //   const checkbox = document.getElementById('loopMode');
        const checkbox = document.getElementById(_pid('loopMode'));
        if (checkbox) {
          checkbox.checked = false;
        }
      }
    }

    _updateSortOptionsVisibility(selectEl, data) {
      const fieldTests = {
        title:       (d) => d.some(e => e.title       && e.title.trim()       !== ''),
        author:      (d) => d.some(e => e.author      && e.author.trim()      !== ''),
        duration:    (d) => d.some(e => e.duration    && e.duration > 0),
        durationAsc: (d) => d.some(e => e.duration    && e.duration > 0),
        rating:      (d) => d.some(e => e.rating      && e.rating > 0),
        category:    (d) => d.some(e => e.category    && e.category.trim()    !== ''),
        description: (d) => d.some(e => e.description && e.description.trim() !== ''),
        type:        (d) => d.some(e => e.type        && e.type.trim()        !== ''),
        issueDate:   (d) => d.some(e => e.issueDate   && e.issueDate.trim()   !== ''),
        issueDateAsc:(d) => d.some(e => e.issueDate   && e.issueDate.trim()   !== ''),
        episode:     (d) => d.some(e => e.series),
      };

      const options = selectEl.options;
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];

        if (!opt.value || opt.value.trim() === '') {
          opt.hidden   = true;
          opt.disabled = true;
          continue;
        }

        const test = fieldTests[opt.value];
        if (test) {
          const hasData = data.length > 0 && test(data);
          opt.hidden   = !hasData;
          opt.disabled = !hasData;
        } else {
          opt.hidden   = false;
          opt.disabled = false;
        }
      }

      const current    = selectEl.value;
      const currentOpt = selectEl.querySelector(`option[value="${current}"]`);
      if (currentOpt && currentOpt.hidden) {
        selectEl.value = 'watchDate';
        this.sortPlaylist('watchDate');
      }
    }

    sortPlaylist(criterion) {
      this._currentSort = criterion || 'watchDate';
      isDev && logger.debug('\n' + `playlistManager: sort criterion set to "${this._currentSort}"`);
      this.renderCurrent();
      // claude - Modify J1 VideoPlayer #31
      // Re-sync the videojs-playlist plugin order on a sort change.
      //
      // Problem (follow-on candidate left open by #30): #30 only re-feeds the
      // plugin from the sorted display source inside embedRunVideo(), i.e. when
      // a video is (re)selected and the player is rebuilt. If the user changes
      // the sort dropdown mid-playback WITHOUT selecting a new video,
      // renderCurrent() (above) re-renders the visible panel in the new order,
      // but the plugin keeps its previous internal order — so the control-bar
      // prev/next buttons (nextPrevButtons -> playlist.previous()/.next()) and
      // autoadvance navigate in the OLD order until the next selection.
      //
      // Fix: push the freshly sorted order into the live plugin via the
      // module-level `player` handle (declared at the module variables block),
      // keeping the currently-playing item as the plugin's current item so only
      // the navigation sequence changes, not which video is loaded. The heavy
      // lifting (guards, display-source build, active-item resolution, playback
      // preservation) is centralised in _resyncPluginPlaylist().
      this._resyncPluginPlaylist();
    }

    // claude - Modify J1 VideoPlayer #31
    // Re-feed the live videojs-playlist plugin with the current display order.
    //
    // Mirrors the #30 source-build pipeline (displaySource -> _applySortOrder()
    // copy -> convertVideoPlayerPlaylist()) so the plugin's item order matches
    // exactly what renderPlaylist()/renderCards() shows, then re-points the
    // plugin's current item at the video that is playing right now (resolved by
    // videoId, the #20/#23 index space) so the active source is preserved.
    //
    // Unlike #30 (which runs while embedRunVideo() is rebuilding the player and
    // a fresh source load is expected), this runs mid-playback with no rebuild.
    // The videojs-playlist public API exposes no "reorder without reload", so
    // re-feeding necessarily reloads the active source; the current time and
    // play/pause state are captured beforehand and restored after the reload
    // using the same one-shot listener + 250ms-seek pattern the resume logic in
    // embedRunVideo() already relies on for both the native and YouTube techs.
    //
    // Heavily guarded and purely additive: it no-ops unless a non-disposed
    // player with the playlist plugin loaded exists, the playlist has at least
    // two items (ordering is meaningless otherwise), the active video resolves
    // inside the freshly converted list, AND the order actually changed — so a
    // sort selection that yields an identical sequence never disturbs playback.
    _resyncPluginPlaylist() {
      // claude - Modify J1 VideoPlayer #31
      // Guard: a live, non-disposed player with the playlist plugin loaded.
      if (!player) return;
      if (typeof player.isDisposed === 'function' && player.isDisposed()) return;
      if (typeof player.playlist !== 'function') return;

      // claude - Modify J1 VideoPlayer #31
      // Guard: the playlist plugin must be enabled in config (same source #30
      // reads). Read defensively straight from the adapter options so this does
      // not depend on the module-level videoPlayerOptions having been assigned.
      let piPlaylist = null;
      try {
        const opts = (j1 && j1.adapter && j1.adapter.videoPlayer && j1.adapter.videoPlayer.videoPlayerOptions)
          ? j1.adapter.videoPlayer.videoPlayerOptions
          : videoPlayerOptions;
        piPlaylist = opts && opts.videoJS && opts.videoJS.plugins
          ? opts.videoJS.plugins.playlist
          : null;
      } catch (e) {
        piPlaylist = null;
      }
      if (!piPlaylist || !piPlaylist.enabled) return;

      // claude - Modify J1 VideoPlayer #31
      // Resolve the video that is playing RIGHT NOW, BEFORE the list is touched.
      // Re-feeding fires 'playlistitem' (the #23 listener) and would otherwise
      // clobber _playlistActiveVideoId, so the active id is captured up front.
      //   1) _playlistActiveVideoId  - the #23 tracker that follows plugin nav.
      //   2) the current plugin item - via the pre-reorder list + currentItem().
      //   3) player.*VideoData       - last-resort tech-side fallback.
      let activeVideoId = _playlistActiveVideoId || null;

      // claude - Modify J1 VideoPlayer #31
      // Snapshot the plugin's current (pre-reorder) list + index. Used both for
      // the activeVideoId fallback and for the order-changed comparison below.
      let currentList = null;
      let currentIdx  = -1;
      try {
        currentList = player.playlist();
        if (typeof player.playlist.currentItem === 'function') {
          currentIdx = player.playlist.currentItem();
        }
      } catch (e) {
        currentList = null;
      }

      if (!activeVideoId && Array.isArray(currentList) &&
          typeof currentIdx === 'number' && currentIdx >= 0 &&
          currentList[currentIdx] && currentList[currentIdx].videoId) {
        activeVideoId = currentList[currentIdx].videoId;
      }

      if (!activeVideoId) {
        if (player.ytVideoData && player.ytVideoData.video_id) {
          activeVideoId = player.ytVideoData.video_id;
        } else if (player.videoData && player.videoData.videoId) {
          activeVideoId = player.videoData.videoId;
        }
      }

      // claude - Modify J1 VideoPlayer #31
      // Build the new plugin source from the SAME display source the panel uses
      // and sort it with the SAME _applySortOrder() before conversion (#30
      // pipeline). _applySortOrder() sorts in place and returns the array, so a
      // defensive .slice() copy is sorted to avoid mutating _searchResults / the
      // stored playlist here.
      const displaySource = this._searchResults || this.load() || [];
      const rawPlaylist   = this._applySortOrder(displaySource.slice());
      const playlist      = this.convertVideoPlayerPlaylist(rawPlaylist, piPlaylist.poster);

      // claude - Modify J1 VideoPlayer #31
      // Guard: ordering only matters with at least two playable items.
      if (!Array.isArray(playlist) || playlist.length < 2) return;

      // claude - Modify J1 VideoPlayer #31
      // Resolve the active video inside the freshly converted list (videoId
      // match, the #20 index space). convertVideoPlayerPlaylist() silently
      // drops entries without playable sources, so a raw index cannot be
      // reused. If the active video is absent from the converted list,
      // do NOT reload — that would interrupt playback for no navigational
      // benefit.
      const syncedIndex = playlist.findIndex((item) => item && item.videoId === activeVideoId);
      if (syncedIndex < 0) {
        // jadams, 2026-06-28: logging disabled
        //isDev && logger.warn('\n' + `playlist re-sync for active videoId '${activeVideoId}' not in converted list: skipping re-feed`);
        return;
      }

      // claude - Modify J1 VideoPlayer #31
      // Guard: skip the re-feed entirely when the order did not actually change
      // (e.g. the chosen sort criterion yields the same sequence). Comparing the
      // videoId sequence of the live plugin list against the new converted list
      // avoids an unnecessary source reload — and the playback hiccup it causes.
      if (Array.isArray(currentList) && currentList.length === playlist.length) {
        let identical = true;
        for (let i = 0; i < playlist.length; i++) {
          const a = currentList[i] && currentList[i].videoId;
          const b = playlist[i] && playlist[i].videoId;
          if (a !== b) { identical = false; break; }
        }
        if (identical) {
          isDev && logger.debug('\n' + 'playlist re-sync: order unchanged, no re-feed');
          return;
        }
      }

      // claude - Modify J1 VideoPlayer #31
      // Capture playback state so the reload (below) is transparent to the user.
      let resumeTime = 0;
      let wasPaused  = true;
      try {
        if (typeof player.currentTime === 'function') resumeTime = player.currentTime() || 0;
        if (typeof player.paused === 'function')      wasPaused  = player.paused();
      } catch (e) {
        resumeTime = 0;
        wasPaused  = true;
      }

      // claude - Modify J1 VideoPlayer #31
      // Re-feed the live plugin and re-point its current item at the active
      // video (same two-step pattern as #30: playlist(list) then currentItem()).
      // The intermediate playlist() load of item 0 fires a transient
      // 'playlistitem' that the #23 listener self-corrects on the currentItem()
      // jump, so the active-item marker lands on the right entry.
      try {
        player.playlist(playlist);
        if (syncedIndex >= 0 && syncedIndex < playlist.length) {
          player.playlist.currentItem(syncedIndex);
        }
      } catch (e) {
        isDev && logger.warn('\n' + `playlist re-sync: re-feed failed: ${e}`);
        return;
      }

      // claude - Modify J1 VideoPlayer #31
      // Restore playback after the source reload triggered by the re-feed.
      // 'loadedmetadata' fires regardless of play state (covers both a playing
      // and a paused video), and the 250ms-deferred seek mirrors the resume
      // logic embedRunVideo() already uses successfully on both techs. Play/
      // pause state is re-asserted because currentItem() may auto-start the
      // reloaded source. All operations are wrapped so a tech-side rejection can
      // never break the sort handler.
      const onResyncLoaded = () => {
        player.off('loadedmetadata', onResyncLoaded);

        setTimeout(() => {
          try {
            if (resumeTime > 0) player.currentTime(resumeTime);
          } catch (e) { /* tech may reject an early seek; harmless */ }
          try {
            if (wasPaused) {
              player.pause();
            } else {
              const p = player.play();
              if (p && typeof p.catch === 'function') p.catch(() => {});
            }
          } catch (e) { /* play()/pause() rejection is non-fatal */ }
        }, 250);
      };
      player.on('loadedmetadata', onResyncLoaded);

      isDev && logger.info('\n' +
        `playlist re-sync: re-fed plugin in new order; active videoId '${activeVideoId}' kept at index ${syncedIndex}`);
    }

    clearSearch() {
      this._searchResults = null;
      this.renderCurrent();
      isDev && logger.debug('\n' + 'playlistManager: search cleared');
    }

  } // END PlaylistManager

  const playlistManager = new PlaylistManager();

  // claude - J1 VideoPlayer MultiInstance #1
  // Seed the owning player id at instance-creation time. This runs BEFORE the
  // initial load()/_manageHiddenMode() check below and BEFORE the
  // initEditPlaylistHandler()/initTogglePlaylistHandler() registrations, so
  // _pid() resolves the per-player (suffixed) element ids and the
  // localStorage keys (STORAGE_KEY/INDEX_KEY, see #40) are player-scoped from
  // the very first read. The adapter may still call setPlayerID() again later
  // — the call is idempotent because the keys are always re-derived from the
  // bare base keys.
  if (instanceID) {
    playlistManager.setPlayerID(instanceID);
  }

  {
    const data = playlistManager.load();
    if (!data || (Array.isArray(data) && data.length === 0)) {
      playlistManager._manageHiddenMode(false);
    }
  }

  // Register the edit_playlist toggle handler once the module initialises.
  // The handler is safe to call here because the DOM elements it references
  // (#edit_playlist, #playlist_edit_screen, #video_container) are declared in
  // the page HTML above the <script> block that loads this module, so they
  // are already present when this line executes.
  initEditPlaylistHandler();

  // Register the toggle_playlist click handler.  The adapter's toggle handler
  // used bare (un-suffixed) element IDs, which broke after every per-player id
  // was made unique.  This module-level handler resolves all ids via _pid().
  initTogglePlaylistHandler();

  // ---------------------------------------------------------------------------
  // Picture-in-Picture helpers (unchanged)
  // ---------------------------------------------------------------------------

  function _isPiPSupported() {
    if ('documentPictureInPicture' in window) return 'documentPiP';
    if (document.pictureInPictureEnabled) return 'videoPiP';
    return null;
  }

  async function _enterDocumentPiP(vjsPlayer) {
    if (!vjsPlayer) return false;
    if (pipWindow && !pipWindow.closed) {
      isDev && logger.info('\n' + 'pip: Document PiP window already open');
      return true;
    }

    try {
      const playerEl = vjsPlayer.el();
      if (!playerEl) return false;

      const width  = Math.min(480, Math.round(window.innerWidth * 0.35));
      const height = Math.round(width * 9 / 16);

      pipWindow = await window.documentPictureInPicture.requestWindow({
        width:  width,
        height: height
      });

      [...document.styleSheets].forEach(sheet => {
        try {
          if (sheet.href) {
            const link  = pipWindow.document.createElement('link');
            link.rel    = 'stylesheet';
            link.href   = sheet.href;
            pipWindow.document.head.appendChild(link);
          } else if (sheet.cssRules) {
            const style = pipWindow.document.createElement('style');
            [...sheet.cssRules].forEach(rule => {
              style.appendChild(pipWindow.document.createTextNode(rule.cssText));
            });
            pipWindow.document.head.appendChild(style);
          }
        } catch (_) {}
      });

      const originalParent = playerEl.parentNode;
      const nextSibling    = playerEl.nextSibling;

      pipWindow.document.body.appendChild(playerEl);

      playerEl.style.width  = '100%';
      playerEl.style.height = '100%';

      pipWindow.addEventListener('pagehide', () => {
        if (originalParent) {
          if (nextSibling && nextSibling.parentNode === originalParent) {
            originalParent.insertBefore(playerEl, nextSibling);
          } else {
            originalParent.appendChild(playerEl);
          }
        }
        playerEl.style.width  = '';
        playerEl.style.height = '';

        pipWindow = null;
        isDev && logger.info('\n' + 'pip: Document PiP window closed, player restored');
      });

      isDev && logger.info('\n' + `pip: entered Document PiP (${width}x${height})`);
      pipEnabled = true;
      return true;

    } catch (err) {
      isDev && logger.warn('\n' + `pip: Document PiP request failed: ${err}`);
      pipWindow = null;
      return false;
    }
  }

  async function _enterVideoPiP(vjsPlayer) {
    if (!vjsPlayer) return false;

    try {
      const tech = vjsPlayer.tech({ IWillNotUseThisInPlugins: true });
      const videoEl = tech && tech.el();

      if (videoEl && typeof videoEl.requestPictureInPicture === 'function') {
        await videoEl.requestPictureInPicture();
        isDev && logger.info('\n' + 'pip: entered standard video PiP');
        pipEnabled = true;
        return true;
      }
    } catch (err) {
      isDev && logger.warn('\n' + `pip: standard video PiP failed: ${err}`);
    }

    return false;
  }

  async function _exitPictureInPicture(vjsPlayer) {
    if (pipWindow && !pipWindow.closed) {
      pipWindow.close();
      pipWindow = null;
      isDev && logger.info('\n' + 'pip: closed Document PiP window');
      return;
    }

    if (document.pictureInPictureElement) {
      try {
        await document.exitPictureInPicture();
        isDev && logger.debug('\n' + 'pip: exited standard video PiP');
      } catch (err) {
        isDev && logger.warn('\n' + `pip: exitPictureInPicture failed: ${err}`);
      }
    }
  }

  async function _requestPictureInPicture(vjsPlayer) {
    const mode = _isPiPSupported();

    if (mode === 'documentPiP') {
      return _enterDocumentPiP(vjsPlayer);
    }

    if (mode === 'videoPiP') {
      return _enterVideoPiP(vjsPlayer);
    }

    isDev && logger.warn('\n' + 'pip: no PiP API supported by this browser');
    return false;
  }

  function _initPiPVisibilityHandler(vjsPlayer) {
    if (pipVisibilityBound) return;
    pipVisibilityBound = true;

    document.addEventListener('visibilitychange', async () => {
      if (!vjsPlayer || vjsPlayer.isDisposed()) return;

      if (document.visibilityState === 'hidden') {
        const paused = vjsPlayer.paused();
        if (!paused) {
          isDev && logger.info('\n' + 'pip: tab hidden while playing, requesting PiP');
          const ok = await _requestPictureInPicture(vjsPlayer);
          if (!ok) {
            isDev && logger.info('\n' + 'pip: PiP unavailable, playback may pause in background');
          }
        }
      } else if (document.visibilityState === 'visible') {
        if (pipWindow && !pipWindow.closed) {
          isDev && logger.info('\n' + 'pip: tab visible again, closing PiP window');
          await _exitPictureInPicture(vjsPlayer);
        }
      }
    });

    isDev && logger.info('\n' + 'pip: auto-PiP visibility handler installed');
  }

  function _playWhenVisible(vjsPlayer) {
    if (!vjsPlayer) return;

    if (document.visibilityState === 'visible') {
      const p = vjsPlayer.play();
      if (p && typeof p.catch === 'function') {
        p.catch(err => {
          isDev && logger.warn('\n' + `play() rejected: ${err}`);
        });
      }
    } else {
      isDev && logger.info('\n' + 'play deferred: page is hidden, attempting PiP before fallback');

      (async () => {
        const pipOk = pipConfigEnabled ? await _requestPictureInPicture(vjsPlayer) : false;
        if (pipOk) {
          const p = vjsPlayer.play();
          if (p && typeof p.catch === 'function') {
            p.catch(err => {
              isDev && logger.warn('\n' + `play() inside PiP rejected: ${err}`);
            });
          }
        } else {
          isDev && logger.debug('\n' + 'pip: falling back to visibility-deferred play()');
          const onVisible = () => {
            if (document.visibilityState === 'visible') {
              document.removeEventListener('visibilitychange', onVisible);
              isDev && logger.debug('\n' + 'page became visible, starting deferred play()');
              const p = vjsPlayer.play();
              if (p && typeof p.catch === 'function') {
                p.catch(err => {
                  isDev && logger.warn('\n' + `deferred play() rejected: ${err}`);
                });
              }
            }
          };
          document.addEventListener('visibilitychange', onVisible);
        }
      })();
    }
  }

  // ---------------------------------------------------------------------------
  // embedRunVideo
  // Extend J1 VideoPlayer #1
  // Extended to support both YouTube video IDs and native file URLs.
  // When the input matches YOUTUBE_PATTERNS the player is created with
  // YouTube tech (techOrder: ['youtube', 'html5'], type: 'video/youtube').
  // For native video files the original HTML5 tech path is unchanged.
  //
  // Renamed parameter: videoId → videoSrc.  The function now accepts a full
  // local or remote video file URL (e.g. /assets/video/my.mp4 or
  // https://cdn.example.com/video.mp4) instead of a YouTube video ID.
  //
  // The videoId for playlist keying is derived from the filename without
  // its extension so existing playlist-management logic is unaffected.
  // ---------------------------------------------------------------------------

  // claude - VideoPlayer permanently turn off YouTube captions #1
  // ---------------------------------------------------------------------------
  // Permanently disable YouTube closed captions / subtitles via the IFrame API.
  //
  // Why the player var alone is not enough:
  //   cc_load_policy=0 only sets the *initial* load policy ("do not show CC by
  //   default"). It does NOT prevent captions from appearing when the viewer's
  //   YouTube account / browser preference has captions switched on, and there
  //   is no player var that hard-disables them.
  //
  // The reliable mechanism (per the IFrame API) is to unload the caption module
  // once it becomes available. The module only loads AFTER playback starts and
  // signals availability through the `onApiChange` event. Because YouTube
  // (re)loads the module on every new video, we must re-apply on each fire —
  // hence a persistent `onApiChange` listener rather than a one-shot call.
  // This keeps captions off across in-player playlist navigation too.
  //
  // Two module names exist: 'captions' (HTML5 player) and 'cc' (legacy AS3).
  // We only act on whichever is currently present (via getOptions) so we never
  // throw on an unloaded module and never loop on the unload-triggered event.
  //
  // @param {object} ytPlayer - underlying YT.Player from the videojs-youtube
  //                            tech (player.tech().ytPlayer)
  // ---------------------------------------------------------------------------
  const _disableYouTubeCaptions = (ytPlayer) => {                           
    if (!ytPlayer) return;                                                  

    const CC_MODULES = ['captions', 'cc'];                                  

    const unloadCaptionModules = () => {                                    
      let loaded = [];                                                      
      try {                                                                 
        loaded = (typeof ytPlayer.getOptions === 'function')                
          ? (ytPlayer.getOptions() || [])                                   
          : [];                                                             
      } catch (e) {                                                         
        loaded = [];                                                        
      }                                                                     

      CC_MODULES.forEach((mod) => {                                         
        if (loaded.indexOf(mod) === -1) return;                             
        try {                                                               
          // Belt: clear the active track first (empty track = captions off)
          if (typeof ytPlayer.setOption === 'function') {
            ytPlayer.setOption(mod, 'track', {});
          }
          // Suspenders: unload the module entirely so the CC button/track go
          if (typeof ytPlayer.unloadModule === 'function') {                
            ytPlayer.unloadModule(mod);
          }                                                                 
          isDev && logger && logger.info('\n' + `YouTube captions disabled (module: ${mod})`);
        } catch (e) {                                                       
          isDev && logger && logger.debug('\n' + `unload of caption module '${mod}' skipped: ${e}`);
        }                                                                   
      });                                                                   
    };                                                                      

    // claude - VideoPlayer permanently turn off YouTube captions #1
    // Best-effort immediate pass (no-op if the module has not loaded yet)
    unloadCaptionModules();

    // claude - VideoPlayer permanently turn off YouTube captions #1
    // Persistent hook: onApiChange fires whenever a module (incl. captions) is
    // loaded/unloaded. Re-apply on every fire so captions never re-appear, even
    // across new videos loaded into the same player by the playlist plugin 
    if (typeof ytPlayer.addEventListener === 'function' && !ytPlayer._j1CcDisableBound) {
      ytPlayer._j1CcDisableBound = true;
      try {                                                                 
        ytPlayer.addEventListener('onApiChange', unloadCaptionModules);
      } catch (e) {
        isDev && logger && logger.debug('\n' + `onApiChange bind for captions skipped: ${e}`);
      }
    }
  };                                                                        

  // claude - VideoPlayer fix videoID #1
  // sanitizeVideoId - normalize a derived videoId so it is safe for playlist
  // keying, localStorage keys and [data-video-id] selectors. Native filenames
  // can carry characters outside the id space - most commonly an embedded dot
  // in quality/version markers, e.g. after stripping the final extension from
  // ".../TV-20251021-0955-0000.1080.mp4" the id is still
  // "TV-20251021-0955-0000.1080" (the ".1080" survives). Every character that
  // is not part of the codebase's canonical id charset [A-Za-z0-9_-] (the same
  // set used in YOUTUBE_ID_RE and the 11-char YouTube check) is replaced by a
  // single hyphen. The transform is deterministic and idempotent - sanitizing
  // an already-clean id (e.g. an 11-char YouTube id) is a no-op - so the same
  // source URL always yields the same key on every derivation site.
  //
  // DESIGN NOTE (for review): the invalid set is the complement of
  // [A-Za-z0-9_-], not "dots only". Narrow the regex to /\./g to strip dots
  // exclusively. Consecutive invalid chars map 1:1 to hyphens (no collapsing);
  // append .replace(/-+/g, '-').replace(/^-+|-+$/g, '') if collapsing/trimming
  // is wanted. This one helper is deliberately shared by both derivation sites
  // (embedRunVideo and inputWrapperHandler.processUrl) so the duplicate-check
  // id can never drift from the persisted key.
  function sanitizeVideoId(rawId) {
    if (!rawId) return rawId;
    return String(rawId).replace(/[^A-Za-z0-9_-]/g, '-');
  }

  /**
   * embedRunVideo - embed and play a video via videoJS.
   * Accepts either a YouTube video ID / URL or a native file URL/path.
   * @param {string} videoSrc  - YouTube video ID or local/remote video URL
   * @param {string} [mode]    - optional player mode ('pause' to start paused)
   */
  const embedRunVideo = (videoSrc, mode) => {
    logger = log4javascript.getLogger(MODULE_NAME);

    isDev && logger.debug('\n' + `embedding video from src: ${videoSrc}`);

    // reset lastState so state change events fire correctly for the new player
    lastState = null;

    // claude - Modify J1 VideoPlayer #23
    // A new player is being built. Forget the playlist-plugin active id from any
    // prior embed so doPostOnPlaying() cannot fall back onto a stale value
    // before the fresh player's 'playlistitem'/videoData resolution repopulates
    // it. (For empty/disabled playlists no 'playlistitem' fires, so leaving a
    // stale id here would otherwise mis-mark the first 'playing' event.)
    _playlistActiveVideoId = null;

    // target mode for the vjs player
    playerMode = (mode === undefined) ? null : mode;

    // Extend J1 VideoPlayer #1
    // Detect whether the input is a YouTube video ID / URL so the right
    // tech and playlist-key derivation are used below.
    const youtubeMatch = (() => {
      for (const pattern of YOUTUBE_PATTERNS) {
        const m = (videoSrc || '').match(pattern);
        if (m) return m[1];
      }
      return null;
    })();

    const isYouTube = !!youtubeMatch;

    // claude - VideoPlayer fix videoID #1
    // const -> let so the derived id can be repaired in place by the sanitize
    // step below. All downstream references - including the pass into
    // createVideoJsPlayer(videoId, ...) further down, from which previousPlayerId
    // is later set - then observe the cleaned id.
    let videoId = isYouTube
      ? youtubeMatch
      : (videoSrc
          ? videoSrc.split('?')[0].split('/').pop().replace(/\.[^.]+$/, '') || videoSrc
          : '');

    // claude - VideoPlayer fix videoID #1
    // Repair (not reject) ids carrying characters invalid for keying. The prior
    // reject guard (kept as a deprecated comment below) rejected any dotted id
    // via `return`, so a native file such as
    // ".../TV-20251021-0955-0000.1080.mp4" -> "TV-20251021-0955-0000.1080"
    // never played. sanitizeVideoId() maps every out-of-charset character to a
    // hyphen -> "TV-20251021-0955-0000-1080". YouTube ids are already clean and
    // pass through untouched. Reassign/log only when something actually changed,
    // to keep the id stable and the logs quiet.
    if (videoId) {
      const sanitizedVideoId = sanitizeVideoId(videoId);
      if (sanitizedVideoId !== videoId) {
        isDev && logger.warn('\n' + `videoId sanitized for keying: "${videoId}" -> "${sanitizedVideoId}"`);
        videoId = sanitizedVideoId;
      }
    }

    // claude - Modify J1 VideoPlayer #34
    // EARLY, isolated playlist creation.
    //
    // Historically the playlist record was created "late", inside
    // doPostOnPlaying() -> playlistManager.addEntry(), which only runs once the
    // player reaches the 'playing' state - tying record creation to playback.
    // Here we create the record the moment the video is *created* (its source
    // is known), independent of whether or when it actually starts playing.
    //
    // Only the fields known now are written. Title/author/duration are resolved
    // asynchronously by the tech and back-filled later via enrichEntry() /
    // updateEntry*() (see onReady and doPostOnPlaying). createEntry() is
    // idempotent: an existing entry for this videoId is left untouched, so
    // re-embedding the same video never duplicates or resets it.
    //
    // Doing it here also means the videojs-playlist plugin, built in onReady
    // from playlistManager.load(), already sees this entry on first setup
    // instead of only after the first 'playing' event.
    //
    if (videoId) {
      if (isYouTube) {
        // For YouTube the poster and canonical links are derivable immediately
        // from the id. `type` is intentionally left to the createEntry default
        // ('video/mp4'), matching the shape addEntry() previously stored - the
        // playable source type is derived independently in
        // _buildPlaylistItemSources() from videoLink, so this has no effect on
        // playback.
        playlistManager.createEntry({
          videoId:   videoId,
          poster:    `//img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          infoLink:  `https://youtu.be/${videoId}`,
          videoLink: `https://youtu.be/${videoId}`
        });
      } else {
        playlistManager.createEntry({
          videoId:   videoId,
          src:       videoSrc,
          videoLink: videoSrc,
          type:      'video/mp4'
        });

        // The source is already known, so a poster can be captured off-screen
        // right away instead of waiting for the 'playing' event. Fire-and-
        // forget: generatePosterForEntry() is config-gated, only writes when
        // the entry still lacks a real poster, and never rejects.
        playlistManager.generatePosterForEntry(videoId)
          .catch((e) => { isDev && logger.warn('\n' + `early native poster generation failed for videoId: ${videoId} - ${e}`); });
      }
    }

    const vjsPlayer = createVideoJsPlayer(videoId, videoSrc, isYouTube, {
      title: '',

      onStateChange: (() => {
        let errorNumber = null;
        return (event) => {
          const state = event.data;

          if (state === lastState || errorNumber) {
            return;
          }

          const stateName = vjsStateEventNameMap[state] || (state < 0 ? 'loadstart' : String(state));
          isDev && logger.debug('\n' + `changed player to state: ${stateName}`);

          // jadams, 2026-06-20: autoplay nextPrevButtons (playlist plugin)
          //
          if (vjsStateEventNameMap[state] === 'loadstart') {
            var piNextPrevButtons = (vjsPlayer.activePlugins_.nextPrevButtons) ? true : false;
            var piPlaylistOptions = j1.adapter.videoPlayer.videoPlayerOptions;

            // claude - Modify J1 VideoPlayer #32
            // Skip the loadstart autoplay while the playlist plugin is still
            // swapping sources during its initial setup. Calling play() here
            // would be aborted by the immediately-following currentItem()
            // src() ("The play() request was interrupted by a new load
            // request"). Genuine prev/next navigation does NOT rebuild the
            // player (so this flag is false then) and still autoplays as
            // before; the deferred autoplay branch in onReady() starts the
            // first playback once the selected source has settled.
            //
            if (piNextPrevButtons && piPlaylistOptions.videoJS.plugins.nextPrevButtons.autoplay && !_playlistSetupInProgress) {
              // claude - Modify J1 VideoPlayer #32
              // Always attach a .catch(): even outside the setup window a
              // benign interruption (e.g. rapid user navigation, a pause()
              // racing the play()) must never surface as an unhandled promise
              // rejection or a red console error.
              //
              const pAutoLoadstart = vjsPlayer.play();
              if (pAutoLoadstart && typeof pAutoLoadstart.catch === 'function') {
                pAutoLoadstart.catch(err => {
                  isDev && logger.warn('\n' + `loadstart autoplay play() rejected: ${err}`);
                });
              }
            }
          }

          if (vjsStateEventNameMap[state] === 'playing') {
            doPostOnPlaying(state);
          }

          // persist the current playback position when the video is
          // paused or has ended so the user can resume later.
          if (vjsStateEventNameMap[state] === 'paused' || vjsStateEventNameMap[state] === 'ended') {
            // claude - Modify J1 VideoPlayer #21
            // The video is no longer playing, so clear the active marker on
            // the playlist card/row. In loop mode the next video's 'playing'
            // event re-marks the following entry via setActiveItem().
            //
            // jadams, 2026-06-18: disabled
            // playlistManager.clearActiveItem();

            try {
              const currentPos    = player.currentTime();
              const totalDuration = player.duration();

              // For YouTube videos use player.ytVideoData.video_id;
              // for native videos use player.videoData.videoId (unchanged from #2).
              const currentVideoId = isYouTube
                ? ((player.ytVideoData && player.ytVideoData.video_id) ? player.ytVideoData.video_id : videoId)
                : ((player.videoData   && player.videoData.videoId)    ? player.videoData.videoId    : videoId);

              if (currentVideoId && currentPos > 0) {
                const positionToSave = (vjsStateEventNameMap[state] === 'ended') ? 0 : currentPos;
                playlistManager.updateEntryPosition(currentVideoId, positionToSave);
              }

              // loop mode
              if (vjsStateEventNameMap[state] === 'ended' && loopConfigEnabled && playlistManager._loopEnabled) {
                const nextId = playlistManager.getNextVideoId(currentVideoId);
                if (nextId) {
                  isDev && logger.debug('\n' + `loop mode: advancing from videoId ${currentVideoId} to next videoId ${nextId}`);
                  // For native entries, resolve src from the playlist entry;
                  // for YouTube entries, the nextId itself is the video ID.
                  const playlist  = playlistManager.load() || [];
                  const nextEntry = playlist.find(item => item.videoId === nextId);
                  const nextSrc   = (nextEntry && nextEntry.src) ? nextEntry.src : nextId;
                  setTimeout(() => {
                    embedRunVideo(nextSrc);
                  }, VIDEO_START_DELAY);
                } else {
                  isDev && logger.debug('\n' + `loop mode: reached last playlist item, stopping loop`);
                }
              }

            } catch (e) {
              isDev && logger.warn('\n' + `failed to save playback position: ${e}`);
            }
          }

          lastState = state;
        };
      })(),

      // videoJS event: onReady
      onReady: (player) => {
        isDev && logger.info('\n' + 'vjs player initialized and ready');

        if (isYouTube) {
          // -------------------------------------------------------------------
          // Metadata is read from the YouTube tech's videoData() / ytPlayer
          // -------------------------------------------------------------------
          const applyVideoData = (videoData) => {
            if (!videoData) return;
            const title  = videoData.title  || '';
            const author = videoData.author || '';

            isDev && logger.debug('\n' + `YT video data resolved - title: ${title}`);

            player.ytVideoData  = videoData;
            player.ytVideoTitle = title;

            const playerEl = player.el();
            if (playerEl) {
              playerEl.setAttribute('aria-label', title);
            }

            document.dispatchEvent(new CustomEvent('ytVideoTitleResolved', {
              detail: { title: title, playerId: player.id_ },
              bubbles: true
            }));
          };

          // immediate read: the tech may already have the data cached
          try {
            const tech = player.tech({ IWillNotUseThisInPlugins: true });
            if (tech && typeof tech.videoData === 'function') {
              const cachedData = tech.videoData();
              if (cachedData && Object.keys(cachedData).length) {
                applyVideoData(cachedData);
              }
            }
          } catch (e) {
            isDev && logger.debug('\n' + `immediate YT video data read skipped: ${e}`);
          }

    
          // Permanently suppress YouTube CC/subtitles for this player. The
          // underlying YT.Player is exposed by the videojs-youtube tech as
          // tech.ytPlayer; _disableYouTubeCaptions() attaches a persistent
          // onApiChange listener so captions stay off across every video the
          // playlist plugin loads into this same player instance.
          try {
            const ccTech     = player.tech({ IWillNotUseThisInPlugins: true });
            const ccYtPlayer = ccTech && ccTech.ytPlayer;
            if (ccYtPlayer) {
              _disableYouTubeCaptions(ccYtPlayer);
            } else {
              // tech.ytPlayer is created asynchronously; retry once it exists ..
              const ccWait = setInterval(() => {
                const t  = player.tech({ IWillNotUseThisInPlugins: true });
                const yt = t && t.ytPlayer;
                if (yt) {
                  clearInterval(ccWait);
                  _disableYouTubeCaptions(yt);
                }
              }, 150);
        
              // stop polling after ~3s so we never leak the interval ..
              setTimeout(() => clearInterval(ccWait), 3000);
            }
          } catch (e) {
            isDev && logger.debug('\n' + `YouTube caption disable skipped: ${e}`);
          }

          // playlistManager, fixed video duration (YouTube)
          player.on('durationchange', () => {
            const durationDisplay = player.controlBar && player.controlBar.durationDisplay;
            if (!durationDisplay) return;

            const durationEl   = durationDisplay.contentEl();
            const durationText = durationEl ? durationEl.textContent : '';
            // claude - J1 VideoPlayer MultiInstance #1
            // Self-reference through the module global (videoPlayer.playlistManager)
            // would resolve to the DEFAULT instance's manager under the multi-instance
            // architecture — i.e. the WRONG player on a multi-player page. Use this
            // instance's closure-local playlistManager instead.
            const seconds      = playlistManager._parseDuration(durationText);

            if (seconds > 0) {
              const currentVideoId = player.ytVideoData && player.ytVideoData.video_id
                ? player.ytVideoData.video_id
                : videoId;
              // claude - J1 VideoPlayer MultiInstance #1
              // Self-reference through the module global (videoPlayer.playlistManager)
              // would resolve to the DEFAULT instance's manager under the multi-instance
              // architecture — i.e. the WRONG player on a multi-player page. Use this
              // instance's closure-local playlistManager instead.
              playlistManager.updateEntryDuration(currentVideoId, seconds);

              player.off('durationchange');
            }
          });

          // resume from saved position if available (YouTube)
          // claude - J1 VideoPlayer MultiInstance #1
          // Self-reference through the module global (videoPlayer.playlistManager)
          // would resolve to the DEFAULT instance's manager under the multi-instance
          // architecture — i.e. the WRONG player on a multi-player page. Use this
          // instance's closure-local playlistManager instead.
          const savedPositionYT = playlistManager.getEntryPosition(videoId);
          if (savedPositionYT > 0) {
            const onFirstPlayingYT = () => {
        
              player.off('playing', onFirstPlayingYT);

              setTimeout(() => {
                player.currentTime(savedPositionYT);
                isDev && logger.info('\n' + `resumed YouTube video id: ${videoId} at last position ${savedPositionYT}s`);
              }, 250);
            };
            player.on('playing', onFirstPlayingYT);
          }

        } else {

          // Native video path
          // -------------------------------------------------------------------
          const applyVideoData = (videoData) => {
            if (!videoData) return;
            const title  = videoData.title  || '';
            const author = videoData.author || '';

            isDev && logger.debug('\n' + `video data resolved - title: ${title}`);

            // claude - VideoPlayer fix videoID #2
            // ROOT CAUSE OF THE DOUBLE-ADD (native videos only):
            // The #1 fix sanitized the derived videoId ONLY at the two INPUT-side
            // derivation sites - embedRunVideo() and inputWrapperHandler
            // .processUrl(). embedRunVideo() therefore PERSISTS the early playlist
            // record (createEntry(), #34) under the SANITIZED key, e.g.
            // "TV-20251021-0955-0000-1080". The native plugin, however, resolves
            // its OWN id straight from the file name and delivers it to us here via
            // the 'videoDataResolved' event with the invalid char still intact,
            // e.g. "TV-20251021-0955-0000.1080" (the dot survives). That raw id is
            // stored on player.videoData.videoId and later read verbatim by
            // doPostOnPlaying() as the key for its defensive createEntry(#34).
            // Because createEntry()'s idempotency test is a strict
            // `item.videoId === entry.videoId`, the dotted key never matches the
            // already-stored hyphenated key, so a SECOND record is unshift()ed ->
            // the video appears twice in localStorage. (YouTube is unaffected: its
            // 11-char id is already clean, so this is a no-op there.)
            //
            // FIX: route this plugin-fed id through the SAME sanitizeVideoId()
            // helper #1 shares across the input-side sites, at the single point it
            // enters this module. This is the DRY, source-level repair: because it
            // runs before `player.videoData = videoData` below, EVERY native
            // consumer of player.videoData.videoId now observes the same key
            // embedRunVideo() persisted - not just doPostOnPlaying()'s createEntry/
            // enrichEntry/setActiveItem, but also updateEntryDuration (on
            // 'durationchange'), updateEntryPosition (on state change) and the
            // activeVideoId resolution used to rebuild the plugin playlist. This
            // closes the last id-derivation site the #1 design note called out,
            // "so the duplicate-check id can never drift from the persisted key".
            //
            // Repair in place and reassign/log only when it actually changed -
            // identical to the #1 pattern; sanitizeVideoId() is deterministic and
            // idempotent, so re-resolving the same source always yields this key.
            //
            // DESIGN NOTE (for review): videoData is the plugin's own object,
            // passed by reference through the event detail. We mutate its .videoId
            // in place (matching #1's "repair, don't reject" approach) because
            // player.videoData is assigned this same reference immediately below
            // and every read goes through it. onVideoDataResolved() removes itself
            // and is the sole consumer, so no other 'videoDataResolved' listener
            // observes the mutation. If a non-mutating copy is preferred, clone
            // videoData first and sanitize the clone.
            if (videoData.videoId) {
              const _sanitizedNativeId = sanitizeVideoId(videoData.videoId);
              if (_sanitizedNativeId !== videoData.videoId) {
                isDev && logger.warn('\n' + `native videoData.videoId sanitized for keying: "${videoData.videoId}" -> "${_sanitizedNativeId}"`);
                videoData.videoId = _sanitizedNativeId;
              }
            }

            player.videoData  = videoData;
            player.videoTitle = title;

            const playerEl = player.el();
            if (playerEl) {
              playerEl.setAttribute('aria-label', title);
            }

            document.dispatchEvent(new CustomEvent('videoTitleResolved', {
              detail: { title: title, playerId: player.id_ },
              bubbles: true
            }));
          };

          const onVideoDataResolved = (e) => {
            document.removeEventListener('videoDataResolved', onVideoDataResolved);
            if (e && e.detail && e.detail.videoData) {
              applyVideoData(e.detail.videoData);
            }
          };
          document.addEventListener('videoDataResolved', onVideoDataResolved);

          // playlistManager, fixed video duration (native)
          player.on('durationchange', () => {
            const durationDisplay = player.controlBar && player.controlBar.durationDisplay;
            if (!durationDisplay) return;

            const durationEl   = durationDisplay.contentEl();
            const durationText = durationEl ? durationEl.textContent : '';
            // claude - J1 VideoPlayer MultiInstance #1
            // Self-reference through the module global (videoPlayer.playlistManager)
            // would resolve to the DEFAULT instance's manager under the multi-instance
            // architecture — i.e. the WRONG player on a multi-player page. Use this
            // instance's closure-local playlistManager instead.
            const seconds      = playlistManager._parseDuration(durationText);

            if (seconds > 0) {
              const currentVideoId = player.videoData && player.videoData.videoId
                ? player.videoData.videoId
                : videoId;
              // claude - J1 VideoPlayer MultiInstance #1
              // Self-reference through the module global (videoPlayer.playlistManager)
              // would resolve to the DEFAULT instance's manager under the multi-instance
              // architecture — i.e. the WRONG player on a multi-player page. Use this
              // instance's closure-local playlistManager instead.
              playlistManager.updateEntryDuration(currentVideoId, seconds);

              player.off('durationchange');
            }
          });

          // resume from saved position if available (native)
          // claude - J1 VideoPlayer MultiInstance #1
          // Self-reference through the module global (videoPlayer.playlistManager)
          // would resolve to the DEFAULT instance's manager under the multi-instance
          // architecture — i.e. the WRONG player on a multi-player page. Use this
          // instance's closure-local playlistManager instead.
          const savedPosition = playlistManager.getEntryPosition(videoId);
          if (savedPosition > 0) {
            const onFirstPlaying = () => {             
              player.off('playing', onFirstPlaying);

              setTimeout(() => {
                player.currentTime(savedPosition);
                isDev && logger.info('\n' + `resumed video with id: ${videoId} at last position ${savedPosition}s`);
              }, 250);
            };

            player.on('playing', onFirstPlaying);
          }
        } // END if isYouTube / else

        videoPlayerOptions = j1.adapter.videoPlayer.videoPlayerOptions;
        loopConfigEnabled  = !!(videoPlayerOptions.playlist && videoPlayerOptions.playlist.loop && videoPlayerOptions.playlist.loop.enabled);
        pipConfigEnabled   = !!(videoPlayerOptions.playlist && videoPlayerOptions.playlist.loop && videoPlayerOptions.playlist.loop.pip);

        if (videoPlayerOptions.videoJS.autoStart) {

          isDev && logger.info('\n' + 'vjs player started');

          const vjsPlaybackRates  = videoPlayerOptions.videoJS.playbackRates.values;

          const piAutoCaption     = videoPlayerOptions.videoJS.plugins.autoCaption;
          const piPlaylist        = videoPlayerOptions.videoJS.plugins.playlist;
          const piHotKeys         = videoPlayerOptions.videoJS.plugins.hotKeys;
          const piSkipButtons     = videoPlayerOptions.videoJS.plugins.skipButtons;
          const piNextPrevButtons = videoPlayerOptions.videoJS.plugins.nextPrevButtons;          
          const piZoomButtons     = videoPlayerOptions.videoJS.plugins.zoomButtons;

          isDev && logger.debug('\n' + 'customize vjs player (controls)');

          const vjsPlayer   = player;
          const vjsVideoId  = videoId;

          // manage playlists (piPlaylist) plugin (first)
          if (piPlaylist.enabled) {

            // claude - Modify J1 VideoPlayer #19
            // Convert the raw playlistManager record set (localStorage shape)
            // into the item shape required by the videojs-playlist plugin
            // (core.js). The raw load() entries have no `sources` array, so
            // passing them straight to vjsPlayer.playlist() would make
            // player.src() fail. The mapping/derivation is centralised in
            // mapVideoPlayerPlaylist + convertVideoPlayerPlaylist().
            //
            // claude - Modify J1 VideoPlayer #30
            // Feed the videojs-playlist plugin a playlist whose order matches
            // exactly what the user sees in the playlist panel.
            //
            // Problem: the panel (renderPlaylist()/renderCards()) renders
            // `this._searchResults || this.load()` AFTER running it through
            // _applySortOrder() (the active sort/"search criterion",
            // _currentSort). The plugin, however, was previously fed the
            // *unsorted* load() order. When a video is selected from the
            // playlist screen, embedRunVideo() rebuilds the player and re-feeds
            // the plugin here, so the prev/next control-bar buttons
            // (nextPrevButtons -> playlist.previous()/.next()) and autoadvance
            // navigated in load() order while the visible list was sorted — the
            // two were out of sync.
            //
            // Fix: build the plugin source from the SAME display source the
            // panel uses (_searchResults || load()) and sort it with the SAME
            // _applySortOrder() before conversion, so the plugin's item order ==
            // the displayed order. _applySortOrder() sorts in place and returns
            // the array, so a defensive .slice() copy is sorted instead of the
            // live _searchResults / stored playlist to avoid mutating them here.
            //
            // Safe with the existing #20 currentItem() sync: that logic resolves
            // the active item by videoId (syncedIndex) against the converted
            // array, so reordering the source before conversion does not affect
            // which item is loaded — only the navigation sequence around it.
            //
            // claude - Modify J1 VideoPlayer #30
            const displaySource = playlistManager._searchResults || playlistManager.load() || [];
            // claude - Modify J1 VideoPlayer #30
            const rawPlaylist   = playlistManager._applySortOrder(displaySource.slice());
            const playlist      = playlistManager.convertVideoPlayerPlaylist(rawPlaylist, piPlaylist.poster);

            // claude - Modify J1 VideoPlayer #32
            // Enter the playlist-setup window. The next source swaps —
            // playlist(playlist) auto-loading item 0 and the currentItem()
            // jump below loading the selected item — are internal and must not
            // trigger the loadstart autoplay (guarded in the loadstart branch
            // of onStateChange via _playlistSetupInProgress).
            //
            _playlistSetupInProgress = true;

            vjsPlayer.playlist(playlist);

            // claude - Modify J1 VideoPlayer #23
            // Mirror plugin-driven item changes onto the active-item indicator.
            //
            // core.js (playItem) fires 'playlistitem' every time the plugin
            // loads a new item — including via the previous/next control-bar
            // buttons (skipButtons / nextPrevButtons -> playlist.previous()/
            // .next()), autoadvance and currentItem(). The event hash is the
            // item object, which carries the J1 `videoId` copied through by
            // mapVideoPlayerPlaylist. Recording it here keeps doPostOnPlaying()
            // from re-marking the previous entry (player.videoData /
            // player.ytVideoData are not refreshed on these in-player source
            // swaps) and the immediate setActiveItem() call makes the marker
            // jump as soon as the user presses prev/next, before 'playing'.
            //
            // Attached AFTER playlist() (so the function exists) and BEFORE the
            // synced currentItem() jump below, so the initial sync is captured
            // too. Video.js passes the trigger hash as the handler's 2nd arg.
            vjsPlayer.on('playlistitem', (event, item) => {
              const switchedId = (item && item.videoId) ? item.videoId : '';
              _playlistActiveVideoId = switchedId || null;
              if (switchedId) {
                isDev && logger.debug('\n' + `playlistitem: active item follows plugin to videoId: ${switchedId}`);
                playlistManager.setActiveItem(switchedId);

                // claude - Modify J1 VideoPlayer #37
                // Keep the centre header span (.video-player-header-title) in
                // sync the moment the videojs-playlist plugin switches item, so
                // a skip-backward / skip-forward / prev / next control-bar click
                // flips the header title to the newly loaded video immediately —
                // not only once (and only if) the 'playing' state is reached.
                //
                // Background: the header was set exclusively from
                // doPostOnPlaying() (#35), which reads the title from the
                // per-tech metadata (player.ytVideoData / player.videoData).
                // On an in-player source swap driven by the plugin that metadata
                // is NOT refreshed (see the #23 note above), so the header kept
                // showing the previously loaded video's title even though the
                // correct video had loaded.
                //
                // The canonical title is read back from the playlist record by
                // the switched videoId (the same source doPostOnPlaying() uses),
                // falling back to the converted item's name and then the videoId
                // so the header is never blank. The authoritative resync added to
                // doPostOnPlaying() (#37) later confirms the same value.
                const _entrySwitched = playlistManager.getEntry(switchedId);
                _updateHeaderTitle(
                  (_entrySwitched && _entrySwitched.title) ||
                  (item && item.name) ||
                  switchedId
                );
              }
            });

            if (piPlaylist.autoadvance) {
              vjsPlayer.playlist.autoadvance(piPlaylist.autoadvance_delay);
            }

            // claude - Modify J1 VideoPlayer #20
            // Sync the (converted) playlist index to the active vjsVideoId.
            //
            // vjsPlayer.playlist() is loaded with the *converted* `playlist`,
            // whose entry order can diverge from `rawPlaylist`:
            // convertVideoPlayerPlaylist() silently drops entries that have no
            // playable `sources` array. A rawPlaylist index can therefore NOT be
            // reused directly as the videojs-playlist currentItem() index.
            //
            // Strategy:
            //
            //   1. Locate the active vjsVideoId inside rawPlaylist (rawIndex) -
            //      the authoritative position in the J1 record set.
            //   2. Resolve the matching index inside the converted `playlist`
            //      (syncedIndex) by videoId - the index space the
            //      videojs-playlist plugin actually addresses.
            //   3. currentIndex := syncedIndex, then load it via
            //      currentItem(currentIndex) so the video identified by
            //      vjsVideoId becomes the current item.
            //
            const rawIndex = rawPlaylist.findIndex(
              (entry) => entry && entry.videoId === vjsVideoId
            );

            // claude - Modify J1 VideoPlayer #20
            // Map the rawPlaylist hit onto its position in the converted
            // playlist (videoId match). Falls back to the existing
            // currentItem() (or 0) when the active video is absent from / was
            // dropped during conversion of the converted playlist.
            //
            let syncedIndex = playlist.findIndex(
              (item) => item && item.videoId === vjsVideoId
            );

            if (syncedIndex < 0) {
              isDev && logger.warn('\n' +
                `playlist sync: vjsVideoId '${vjsVideoId}' not found in converted playlist ` +
                `(rawIndex: ${rawIndex}); keeping current item`);

              const fallbackIndex = vjsPlayer.playlist.currentItem();
              syncedIndex = (typeof fallbackIndex === 'number' && fallbackIndex >= 0)
                ? fallbackIndex
                : 0;
            }

            // claude - Modify J1 VideoPlayer #20
            // currentIndex (for loading the video) is the synced index.
            let currentIndex = syncedIndex;

            // claude - Modify J1 VideoPlayer #19
            // Guard the currentItem() jump so a short or empty converted
            // playlist can never produce an out-of-range index.
            // claude - Modify J1 VideoPlayer #20
            // Load the video specified by vjsVideoId from the synced playlist.
            if (playlist.length > 0 && currentIndex >= 0 && currentIndex < playlist.length) {
              vjsPlayer.playlist.currentItem(currentIndex);
            }

            // claude - Modify J1 VideoPlayer #32
            // Leave the playlist-setup window once the SELECTED source has
            // produced metadata (mirrors the proven #31 'loadedmetadata'
            // settle pattern). The intermediate item-0 load triggered by
            // playlist() is aborted by the currentItem() src() above, so its
            // 'loadedmetadata' never fires — this listener therefore resolves
            // on the final, selected source. After it clears, any further
            // loadstart originates from genuine prev/next navigation, so the
            // loadstart autoplay may run normally without colliding with a
            // pending currentItem() src().
            //
            const _onPlaylistSetupSettled = () => {           
              vjsPlayer.off('loadedmetadata', _onPlaylistSetupSettled);

              _playlistSetupInProgress = false;
              isDev && logger.debug('\n' + 'playlist setup settled; loadstart autoplay re-enabled');
            };
            vjsPlayer.on('loadedmetadata', _onPlaylistSetupSettled);

            // claude - Modify J1 VideoPlayer #32
            // Safety net: if 'loadedmetadata' never arrives (a source error, a
            // disabled tech, or an empty playlist) clear the guard after a
            // bounded delay so the loadstart autoplay is not disabled
            // permanently for subsequent navigations.
            ////
            setTimeout(() => {
              if (_playlistSetupInProgress) {               
                vjsPlayer.off('loadedmetadata', _onPlaylistSetupSettled);

                _playlistSetupInProgress = false;
                isDev && logger.debug('\n' + 'playlist setup guard cleared by timeout fallback');
              }
            }, 2000);

          }

          // add custom progressControlSlider
          const customProgressContainer = vjsPlayer.controlBar.addChild('Component', {
            el: videojs.dom.createEl('div', {
              className: 'vjs-theme-uno custom-progressbar-container'
            })
          });

          const progressControlSlider = vjsPlayer.controlBar.progressControl;
          if (progressControlSlider) {
            customProgressContainer.el().appendChild(progressControlSlider.el());
          }

          const currentTimeDisplay = vjsPlayer.controlBar.currentTimeDisplay;
          if (currentTimeDisplay) {
            customProgressContainer.el().insertBefore(currentTimeDisplay.el(), progressControlSlider.el());
          }

          const durationDisplay = vjsPlayer.controlBar.durationDisplay;
          if (durationDisplay) {
            customProgressContainer.el().appendChild(durationDisplay.el());
          }

          // add|skip playbackRates
          if (videoPlayerOptions.videoJS.playbackRates.enabled) {
            vjsPlayer.playbackRates(vjsPlaybackRates);
          }

          // add|skip skipButtons plugin
          if (piSkipButtons.enabled) {
            let backwardIndex = piSkipButtons.backward;
            let forwardIndex  = piSkipButtons.forwardIndex;

            if (piSkipButtons.surroundPlayButton) {
              backwardIndex = 0;
              forwardIndex  = 1;
            }

            vjsPlayer.skipButtons({
              backwardIndex:  backwardIndex,
              forwardIndex:   forwardIndex,
              backward:       piSkipButtons.backward,
              forward:        piSkipButtons.forward,
            });
          }

          // add|skip nextPrevButtons plugin
          // placed AFTER skipButtons, so (button) placement resolves
          if (piNextPrevButtons.enabled) {
            vjsPlayer.nextPrevButtons();

            // claude - Modify J1 VideoPlayer #25
            // Hide the playlist panel when the user starts the previous/next
            // video from the playlist plugin's navigation buttons
            // (class="vjs-playlist-button skip-next/skip-forward").
            //
            // The #toggle_playlist button owns the panel's open state; once the
            // user navigates to another playlist item from the control bar the
            // panel is no longer relevant and would otherwise stay open on top
            // of the now-playing video. The toggle button continues to control
            // show/hide as before — this only adds an automatic hide for the
            // prev/next case.
            //
            // A single delegated click listener is attached to the control bar
            // (rather than to each button) so it:
            //
            //   • survives any internal re-creation of the button elements by
            //     the plugin (repeat-aware enable/disable rebuilds),
            //   • catches clicks that bubble up from inner icon/span children
            //     (resolved via closest('.vjs-playlist-button')),
            //   • targets ONLY the playlist nav buttons — the skipButtons seek
            //     buttons do not carry the .vjs-playlist-button class.
            //
            // The disabled guard skips boundary-disabled buttons (the repeat-off
            // ends of the playlist) so the panel is closed only when a video is
            // actually started. closePlaylist() is idempotent, so closing an
            // already-closed panel is a harmless no-op (e.g. when the panel was
            // never opened). Each embedRunVideo() builds a fresh player/control
            // bar, so exactly one listener is bound per player and is disposed
            // together with that player.
            //
            const _npbControlBarEl = (vjsPlayer.controlBar && typeof vjsPlayer.controlBar.el === 'function')
              ? vjsPlayer.controlBar.el() 
              : null; // claude - Modify J1 VideoPlayer #25

            // claude - Modify J1 VideoPlayer #25
            if (_npbControlBarEl) {
              _npbControlBarEl.addEventListener('click', (ev) => {
                const navBtn = (ev.target && typeof ev.target.closest === 'function')
                  ? ev.target.closest('.vjs-playlist-button')
                  : null; // claude - Modify J1 VideoPlayer #25

                if (!navBtn) return;

                // claude - Modify J1 VideoPlayer #25
                const isDisabled = navBtn.classList.contains('vjs-disabled')
                  || navBtn.getAttribute('aria-disabled') === 'true'
                  || navBtn.disabled === true;

                if (isDisabled) return;

                // claude - Modify J1 VideoPlayer #25
                if (videoPlayerOptions.playlist.close_on_play) {
                  closePlaylist();
                  isDev && logger.debug('\n' + 'nextPrevButtons: playlist panel hidden after prev/next navigation');
                }
              });
            }
          }

          if (piZoomButtons.enabled && !isYouTube) {
            // piZoomButtons
            vjsPlayer.zoomButtons({
              moveX:  piZoomButtons.moveX,
              moveY:  piZoomButtons.moveY,
              rotate: piZoomButtons.rotate,
              zoom:   piZoomButtons.zoom
            }); 
          }

          // For YouTube, hide the VJS control bar when configured.
          // players.youtube.controls === 0 means the YouTube IFrame API hides
          // its own chrome; the VJS control bar is hidden separately here.
          // For native videos the control bar is always shown.
          const ytControls = videoPlayerOptions.videoJS.players.youtube
            ? videoPlayerOptions.videoJS.players.youtube.controls
            : undefined;
          if (isYouTube && (videoPlayerOptions.videoJS.hideControlBar || ytControls === 0)) {
            isDev && logger.debug('\n' + 'hiding vjs controlbar for YT video');
            vjsPlayer.addClass('vjs-youtube-hide-controlbar');
          }

          // Autoplay: read from players.youtube for YouTube, players.native for
          // native video — both driven by the defaults in videoPlayer.yml.
          const autoplay = isYouTube
            ? (videoPlayerOptions.videoJS.players.youtube && videoPlayerOptions.videoJS.players.youtube.autoplay)
            : (videoPlayerOptions.videoJS.players.native  && videoPlayerOptions.videoJS.players.native.autoplay);

          if (autoplay) {
            if (playerMode === 'pause') {
              setTimeout(() => vjsPlayer.pause(), VIDEO_START_DELAY);
            } else {
              setTimeout(() => _playWhenVisible(vjsPlayer), VIDEO_START_DELAY);
            }
          }

          // PiP support (unchanged logic)
          if (pipConfigEnabled) {
            _initPiPVisibilityHandler(vjsPlayer);
          }

          if (pipConfigEnabled && _isPiPSupported() === 'documentPiP') {
            const PiPButton = videojs.getComponent('Button');

            class DocumentPiPButton extends PiPButton {
              constructor(player, options) {
                super(player, options);
                this.controlText('Picture-in-Picture');
                this.addClass('vjs-pip-button');
              }
              handleClick() {
                if (pipWindow && !pipWindow.closed) {
                  _exitPictureInPicture(player);
                } else {
                  _requestPictureInPicture(player);
                }
              }
            }

            videojs.registerComponent('DocumentPiPButton', DocumentPiPButton);
            vjsPlayer.controlBar.addChild('DocumentPiPButton', {});

            const nativePiP = vjsPlayer.controlBar.getChild('pictureInPictureToggle');
            if (nativePiP) {
              nativePiP.hide();
            }

            isDev && logger.info('\n' + 'pip: custom Document PiP button added to control bar');
          } else {
            const nativePiP = vjsPlayer.controlBar.getChild('pictureInPictureToggle');
            if (nativePiP) {
              nativePiP.hide();
            }
          }
        } // END if videoPlayerOptions.videoJS.autoStart
      } // END onReady
    }); // END vjsPlayer
  }; // END embedRunVideo

  /**
   * doPostOnPlaying - post-processing after state change to 'playing'
   * Extended to handle both YouTube (player.ytVideoData) and native
   * (player.videoData) metadata
   * @param {number} state - player state code
   */
  function doPostOnPlaying(state) {
    const titleElement = document.getElementById(_pid("video_title"));
    const videoTitleElement = document.getElementById('video_title');    
//  const videoTitleElement = document.getElementById(_pid('videoplayer_playlist_parent'));    
    const textEl       = document.getElementById(_pid('video_title_text'));


    isDev && logger.debug('\n' + `do post processing on state: ${vjsStateEventNameMap[state]}`);

    // Choose the right video-data source depending on which tech is active.
    // YouTube: player.ytVideoData (set in onReady YouTube branch).
    // Native:  player.videoData  (set by nativePlayer plugin via 'videoDataResolved').
    const isYouTubePlayer = !!(player && player.ytVideoData);

    // claude - Modify J1 VideoPlayer #21
    // The player just entered the 'playing' state. Resolve the videoId for
    // the active tech (YouTube vs native) and mark its playlist card/row as
    // active. Done before addEntry()/updateWatchDate() below, which trigger
    // renderCurrent(); setting it here lets those re-renders inline the
    // correct data-item-active value, and setActiveItem() also updates any
    // already-rendered element directly.
    //
    // claude - Modify J1 VideoPlayer #23
    // Prefer the id recorded by the 'playlistitem' listener. When the source
    // change was driven by the videojs-playlist plugin (previous/next buttons,
    // autoadvance), the per-tech metadata below is stale — it still describes
    // the entry from the last embedRunVideo() — so resolving from it alone
    // would re-mark the previously playing entry. _playlistActiveVideoId
    // reflects the item the plugin actually loaded; fall back to the per-tech
    // resolution for plain (non-playlist) plays where it is null.
    const _resolvedFromTech = isYouTubePlayer
      ? ((player.ytVideoData && player.ytVideoData.video_id) ? player.ytVideoData.video_id : '')
      : ((player.videoData   && player.videoData.videoId)    ? player.videoData.videoId    : '');
    const _activePlayingId = _playlistActiveVideoId || _resolvedFromTech;
    if (_activePlayingId) {
      playlistManager.setActiveItem(_activePlayingId);
    }

    if (isYouTubePlayer) {
      document.dispatchEvent(new CustomEvent('videoPlayingStarted', {
        detail: { videoId: player.ytVideoData?.video_id || '' },
        bubbles: true
      }));

      // refresh author from live YT player object
      try {
        const tech      = player.tech({ IWillNotUseThisInPlugins: true });
        const ytPlayer  = tech.ytPlayer;
        const freshData = ytPlayer.getVideoData();
        player.ytVideoData.author = freshData.author;
      } catch (_e) {
        // tech not yet fully ready; author stays as-is
      }

      const vd  = player.ytVideoData;
      const vid = vd.video_id || '';

      if (textEl && vd) {
        const title  = vd.title  || player.ytVideoTitle || '';
        const author = vd.author || '';
        textEl.textContent = author ? ` ${author} · ${title}` : title;
      } else if (textEl && player.ytVideoTitle) {
        textEl.textContent = player.ytVideoTitle;
      }

      // Added 'poster' field: resolves to the highest-quality YouTube thumbnail
      // (maxresdefault.jpg) so list and card items show the real poster image
      // instead of falling back to DEFAULT_POSTER.
      //
      // Two fixes in the YouTube media object:
      //
      // 1. infoLink used the wrong URL format ('https://youtu.be/watch?v=ID'
      //    mixes the youtu.be short-link domain with the youtube.com/watch path
      //    and produces a broken link).  Correct format: 'https://youtu.be/ID'.
      // 2. videoLink was missing entirely.  addEntry() falls back to entry.src,
      //    but src is also absent from the YouTube media object, so videoLink
      //    was always stored as ''.  For YouTube items videoLink should equal
      //    the same canonical watch URL as infoLink.
      //
      const media = {
        videoId:      vid,
        title:        vd.title  || player.ytVideoTitle || '',
        author:       vd.author || '',
        infoLink:     vid ? `https://youtu.be/${vid}` : '',
        videoLink:    vid ? `https://youtu.be/${vid}` : '',
        poster:       vid ? `//img.youtube.com/vi/${vid}/maxresdefault.jpg` : '',
        duration:     player.duration(),
        lastPosition: 0
      };

      // claude - Modify J1 VideoPlayer #34
      // Creation now happens early in embedRunVideo(). createEntry() here is a
      // defensive no-op when the record already exists (it is idempotent) and
      // only creates one in the rare case the early creation was skipped (e.g.
      // a direct doPostOnPlaying() path). enrichEntry() then back-fills the
      // metadata that just became available from the live YouTube player
      // (title/author/duration) onto the existing record - something addEntry()
      // could not do because it skips records that already exist.
      //
      playlistManager.createEntry(media);
      playlistManager.enrichEntry(vid, media);

      // claude - Modify J1 VideoPlayer #35
      // Reflect the now-loaded video's title in the centre header span
      // (.video-player-header-title). Read the canonical entry.title back from
      // the playlist (just created / enriched above); fall back to the locally
      // resolved media.title, then to the videoId, so the header is never blank
      // for a loaded video.
      const _entryYT = playlistManager.getEntry(vid);
      _updateHeaderTitle((_entryYT && _entryYT.title) || media.title || vid);

      if (vid && vd.author) {
        playlistManager.updateEntryAuthor(vid, vd.author);
      }

      const durationYT = player.duration();
      if (vid && durationYT > 0) {
        playlistManager.updateEntryDuration(vid, Math.floor(durationYT));
      }

      if (vid) {
        playlistManager.updateWatchDate(vid);
      }

    } else {
      // Native video path (unchanged from #2)
      document.dispatchEvent(new CustomEvent('videoPlayingStarted', {
        detail: { videoId: player.videoData && player.videoData.videoId || '' },
        bubbles: true
      }));

      const vd  = player.videoData || {};
      const vid = vd.videoId || '';

      if (textEl) {
        const title  = vd.title  || player.videoTitle || '';
        const author = vd.author || '';
        textEl.textContent = author ? ` ${author} · ${title}` : title;
      }

      const media = {
        src:          vd.src      || '',
        poster:       vd.poster   || '',
        videoId:      vid,
        title:        vd.title    || player.videoTitle || '',
        author:       vd.author   || '',
        infoLink:     '',
        videoLink:    vd.src      || '',
        duration:     player.duration(),
        lastPosition: 0
      };

      // claude - Modify J1 VideoPlayer #34
      // Creation now happens early in embedRunVideo(). createEntry() here is a
      // defensive no-op when the record already exists (idempotent); enrichEntry()
      // back-fills the title/author/duration resolved during playback onto the
      // existing record. The native poster is captured early in embedRunVideo()
      // and, as a fallback, again below.
      //
      playlistManager.createEntry(media);
      playlistManager.enrichEntry(vid, media);

      // claude - Modify J1 VideoPlayer #35
      // Reflect the now-loaded native video's title in the centre header span
      // (.video-player-header-title). Read entry.title back from the playlist,
      // falling back to the resolved media.title and then the videoId.
      const _entryNV = playlistManager.getEntry(vid);
      _updateHeaderTitle((_entryNV && _entryNV.title) || media.title || vid);

      if (vid && vd.author) {
        playlistManager.updateEntryAuthor(vid, vd.author);
      }

      const duration = player.duration();
      if (vid && duration > 0) {
        playlistManager.updateEntryDuration(vid, Math.floor(duration));
      }

      if (vid) {
        playlistManager.updateWatchDate(vid);
      }

      // claude - Modify J1 VideoPlayer #33
      // The native entry just added above may have arrived without a poster
      // (the media object's poster came through empty). Capture a still frame
      // from the file off-screen and store it so the playlist list/card views
      // show a real thumbnail instead of the DEFAULT_POSTER placeholder.
      // Fire-and-forget: generateNativePoster() never rejects and only writes
      // when the entry still lacks a real poster, so this is safe to run on
      // every native play.
      if (vid && !media.poster) {
        playlistManager.generatePosterForEntry(vid)
          .catch((e) => { isDev && logger.warn('\n' + `native poster generation failed for videoId: ${vid} - ${e}`); });
      }
    }

    // claude - Modify J1 VideoPlayer #37
    // Authoritative header-title resync for plugin-driven source swaps.
    //
    // The per-tech branches above set the centre header span
    // (.video-player-header-title) from player.ytVideoData / player.videoData
    // (#35). On an in-player source swap driven by the videojs-playlist plugin
    // (the playlist nav / skip-backward / skip-forward / prev / next control-bar
    // buttons and autoadvance) that per-tech metadata is NOT refreshed - it still
    // describes the entry from the last embedRunVideo() (see the #23 note above) -
    // so the branch above re-writes the *previously* loaded video's title and the
    // header stops matching the video that actually loaded.
    //
    // _activePlayingId already prefers _playlistActiveVideoId (the id the plugin
    // really switched to, recorded by the 'playlistitem' listener) and falls back
    // to the per-tech id for plain plays, so it is the correct id in BOTH cases.
    // Reading the canonical title back from that entry and writing it LAST (after
    // the per-tech writes above) makes the header follow the plugin without
    // disturbing the normal, non-playlist path: there _activePlayingId equals the
    // per-tech id, so this resolves the same title and the write is idempotent.
    // Only writes when a titled entry resolves, so a missing record never blanks
    // a header the branch above already set.
    if (_activePlayingId) {
      const _entryActive = playlistManager.getEntry(_activePlayingId);
      if (_entryActive && _entryActive.title) {
        _updateHeaderTitle(_entryActive.title);
      }
    }

    if (titleElement) {
      titleElement.style.display = "flex";
    }

    // When the video was started by clicking a playlist card, collapse the
    // playlist panel so the video container has the full viewport while
    // playing.  The flag is reset immediately so subsequent non-playlist
    // plays (e.g. direct embed) are not affected.
    if (_startedFromPlaylist) {
      _startedFromPlaylist = false;

      if (videoPlayerOptions.playlist.close_on_play) {
        closePlaylist();
        closeEditPlaylist();
      }
    }

    // jadams, 2026-07-05: disable scrolling on playimg video
    //
    // if (videoTitleElement) {
    //   scrollToElement(videoTitleElement);
    // }

  }

  /**
   * _resetPlaylistToggleUI
   *
   * Resets the playlist toggle button (#video_player_header_arrows) and its
   * sibling <span> inside #video_player_container to the "closed" state.
   *
   * Background: the toggle button's click handler in the adapter decides
   * whether to open or close the playlist by reading the current <span> text
   * (or button title).  When closePlaylist() is called programmatically from
   * doPostOnPlaying the panel is hidden, but the span / icon are NOT updated
   * because no user click occurred.  As a result the toggle state diverges
   * from the DOM state: the span still reads "Hide Playlist" while the panel
   * is already closed.  The next button click then tries to close an already-
   * closed panel and appears to do nothing; after that it re-opens correctly,
   * but the user has lost one click.  Calling this helper immediately after
   * closePlaylist() restores the consistent "show" state so every subsequent
   * toggle click behaves as expected.
   *
   * The icon base path and filename convention follow the page template:
   *   /assets/theme/j1/modules/videoPlayer/icons/player/dark/playlist-show.svg
   *   /assets/theme/j1/modules/videoPlayer/icons/player/dark/playlist-hide.svg
   * The "show" variant is selected here because the panel is being closed.
   */
  // claude - Modify J1 VideoPlayer #35
  // _updateHeaderTitle
  //
  // Sets the centre header span (.video-player-header-title) to the supplied
  // text so the header shows the title of the currently loaded video. This
  // span previously doubled as the playlist toggle label ("Show/Hide
  // Playlist"); that behaviour has been removed (see _resetPlaylistToggleUI
  // and initTogglePlaylistHandler), making the span a dedicated "now playing"
  // title.
  //
  // The lookup is scoped to THIS player instance's #video_player_container so
  // the correct span is updated when several players share one page. A
  // defensive fall-back to the first <span> inside the container keeps the
  // helper working even if the .video-player-header-title class is ever
  // renamed. An empty / missing title clears the span rather than printing
  // 'undefined'.
  function _updateHeaderTitle(title) {
    const container = document.getElementById(_pid('video_player_container'));
    if (!container) return;

    const span = container.querySelector('.video-player-header-title')
              || container.querySelector('span');
    if (!span) return;

    const text = (title != null && String(title).trim() !== '')
      ? String(title)
      : '';
    span.textContent = text;

    isDev && logger.debug('\n' + `_updateHeaderTitle: header title set to "${text}"`);
  }

  function _resetPlaylistToggleUI() {
    const wrapper = document.getElementById(_pid('video_player_container'));
    if (!wrapper) return;

    // claude - Modify J1 VideoPlayer #35
    // The centre header <span> (.video-player-header-title) no longer doubles
    // as the playlist toggle label; it now shows the title of the currently
    // loaded video (set by _updateHeaderTitle() from doPostOnPlaying()).
    // Writing "Show Playlist" here would clobber that title every time the
    // panel closes, so the legacy span-label write is disabled. Show/hide
    // state is still conveyed by the toggle button's title / aria-label / icon
    // (updated below), so accessibility is unaffected.
    // Original (deprecated, preserved for reference):
    //   const span = wrapper.querySelector('span');
    //   if (span) {
    //     span.textContent = 'Show Playlist';
    //   }
    void wrapper;

    // Corrected button ID from 'video_player_header_arrows' (does not
    // exist in the page template) to 'toggle_playlist' (the actual
    // rendered element ID).
    // The previous ID caused a silent no-op: btn was always null so the
    // icon, title and aria attributes were never reset after closePlaylist().
    //
    const btn = document.getElementById(_pid('toggle_playlist'));
    if (btn) {
      btn.title                             = 'Show playlist';
      btn.setAttribute('aria-label',          'Show playlist');
      btn.setAttribute('aria-expanded',       'false');

      const img = btn.querySelector('img');
      if (img) {
        const currentSrc  = img.getAttribute('src') || '';
        const showIconSrc = currentSrc.replace('playlist-hide.svg', 'playlist-show.svg');

        img.setAttribute('src', showIconSrc);
        img.setAttribute('alt', 'Show playlist');
      }
    }

    isDev && logger.debug('\n' + '_resetPlaylistToggleUI: toggle reset to "Show Playlist" state');
  }

  // ---------------------------------------------------------------------------
  // initEditPlaylistHandler
  //
  // Wires the #edit_playlist button so that clicking it:
  //
  //   1.  Toggles the visibility of #playlist_edit_screen.
  //   2a. ON OPEN : replaces the content of #video_container with the
  //       #playlist_edit_screen div (the edit panel is moved inside the
  //       video container so it occupies the same visual slot as the player).
  //   2b. ON CLOSE: restores #video_container to its saved snapshot and moves
  //       #playlist_edit_screen back to its original position (hidden).
  //
  // Why move instead of overlay?
  //   The #video_container has CSS that sizes and positions the player area.
  //   Injecting the edit panel *inside* that container reuses the same layout
  //   box without adding new positioning rules.  The original container HTML
  //   (module-level `containerHTML`) is restored verbatim on close, which is
  //   the same strategy already used by createVideoJsPlayer().
  //
  // Guard: the handler is registered only once via _editPlaylistHandlerInit.
  // NOTE: _editPlaylistHandlerInit is declared in the module variables section
  // (above) rather than here.  The original `let` placement immediately before
  // this function caused a TDZ ReferenceError because initEditPlaylistHandler()
  // is called at module init time (~line 1956), before this `let` would have
  // been reached.  See the module variables section for the declaration.
  // ---------------------------------------------------------------------------
  //
  function initEditPlaylistHandler() {

    // claude - Modify J1 VideoPlayer #29
    // ------------------------------------------------------------------------
    // DEPRECATED — handler ownership moved to the adapter.
    //
    // The edit-playlist click is now owned exclusively by the adapter's
    // initPlayerUiEvents(playerId) (per-player loop, suffixed ids). That path
    // implements the overlay model (#29): the edit screen is positioned
    // absolutely OVER #video_container as a sibling and the live player is
    // left running underneath — it is never disposed and the container
    // innerHTML is never replaced.
    //
    // This module-level handler used the legacy "move editScreen inside
    // video_container + dispose player + snapshot-restore innerHTML" model,
    // which conflicts with the overlay approach and, in practice, never bound
    // anyway: it runs at module-IIFE load when _playerID is still '' so
    // _pid('edit_playlist') resolves to the unsuffixed id and the guard below
    // bails. We make the deprecation explicit with a hard early-return while
    // preserving the original body for reference (deprecation, not deletion).
    return;
    // ------------------------------------------------------------------------

    // Removed the temporary `return;` that disabled this handler.  Now that
    // every element id is resolved through _pid() the handler correctly finds
    // the suffixed elements (e.g. edit_playlist_myPlayer) even when multiple
    // players share the same page, so it is safe to re-enable it here.
    //
    if (_editPlaylistHandlerInit) return;

    const editBtn     = document.getElementById(_pid('edit_playlist'));
    const editScreen  = document.getElementById(_pid('playlist_edit_screen'));
    const videoContnr = document.getElementById(_pid('video_container'));

    if (!editBtn || !editScreen || !videoContnr) {
      isDev && logger.warn('\n' + 'initEditPlaylistHandler: required element(s) not found — handler skipped');
      return;
    }

    _editPlaylistHandlerInit = true;

    const editScreenOriginalParent  = editScreen.parentNode;
    const editScreenOriginalSibling = editScreen.nextSibling;

    // Track whether the edit panel is currently shown inside video_container.
    let _editScreenVisible = false;

    editBtn.addEventListener('click', () => {

      if (!_editScreenVisible) {
        // --- OPEN ------------------------------------------------------------
        // 1. Dispose any live videoJS player so it does not leak resources
        //    while the video_container is replaced.
        if (player) {
          isDev && logger.debug('\n' + 'initEditPlaylistHandler: disposing videoJS player before showing edit screen');
          player.dispose();
          player = null;
        }

        // 2. Move #playlist_edit_screen into #video_container.
        //    The edit screen was hidden (display:none) in the source HTML;
        //    make it visible now that it occupies the player slot.
        editScreen.style.display  = 'block';
        videoContnr.innerHTML     = '';
        videoContnr.appendChild(editScreen);

        // 3. Update button aria state.
        editBtn.setAttribute('aria-expanded', 'true');
        editBtn.title       = 'Close playlist editor';
        editBtn.setAttribute('aria-label', 'Close playlist editor');

        // Mark the editor as open so _updateTogglePlaylistButton() (and any
        // other consumer) can read the state without tracking a private flag.
        editBtn.setAttribute('data-edit-open', 'true');

        // Block #toggle_playlist while the editor occupies the player slot.
        const toggleBtn = document.getElementById(_pid('toggle_playlist'));
        if (toggleBtn) {
          toggleBtn.setAttribute('disabled', '');
          toggleBtn.setAttribute('aria-disabled', 'true');
          toggleBtn.style.opacity = '0.35';
          toggleBtn.style.cursor  = 'not-allowed';
          toggleBtn.title         = 'Close the playlist editor first';
        }

        _editScreenVisible = true;

        isDev && logger.debug('\n' + 'initEditPlaylistHandler: edit screen shown inside video_container');

      } else {
        // --- CLOSE -----------------------------------------------------------
        // 1. Remove the edit screen from video_container and put it back at
        //    its original DOM position (hidden, as the HTML declares it).
        editScreen.style.display = 'none';

        if (editScreenOriginalParent) {
          if (editScreenOriginalSibling && editScreenOriginalSibling.parentNode === editScreenOriginalParent) {
            editScreenOriginalParent.insertBefore(editScreen, editScreenOriginalSibling);
          } else {
            editScreenOriginalParent.appendChild(editScreen);
          }
        }

        // 2. Restore the video_container to its original snapshot
        //    (same mechanism used by createVideoJsPlayer).
        videoContnr.innerHTML = containerHTML;

        // 3. Update button aria state.
        editBtn.setAttribute('aria-expanded', 'false');
        editBtn.title       = 'Manage playlists';
        editBtn.setAttribute('aria-label', 'Manage playlists');

        // Clear the open marker so the toggle button can be re-enabled.
        editBtn.setAttribute('data-edit-open', 'false');

        // Re-enable #toggle_playlist now that the editor is closed.
        // Delegate to _updateTogglePlaylistButton() so empty-playlist logic
        // is respected automatically (button stays disabled when the list is
        // empty, rather than being blindly re-enabled here).
        playlistManager._updateTogglePlaylistButton();

        _editScreenVisible = false;

        isDev && logger.debug('\n' + 'initEditPlaylistHandler: video_container restored, edit screen hidden');
      }
    });

    isDev && logger.info('\n' + 'initEditPlaylistHandler: edit-playlist toggle handler registered');
  }

  /**
   * scrollToElement - scroll to element's (vertical) top position
   */
  function scrollToElement(elm) {
    if (!elm) return;

    const targetElmPosition = elm.offsetTop;
    const scrollOffset      = (window.innerWidth >= 720) ? -180 : -130;
    const position          = targetElmPosition + scrollOffset;

    isDev && logger.debug('\n' + `scroll page to vertical position: ${position}`);
    window.scrollTo(0, position);
  }

  /**
   * generateId - generate a random alphanumeric ID string
   */
  function generateId(length = 11) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < length; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }

  /**
   * createVideoJsPlayer
   * Extended to support YouTube tech when isYouTube is true.
   * When isYouTube is false the original HTML5-only path is used unchanged.
   *
   * Replaced YouTube-tech player creation with native HTML5 tech (native path).
   * - techOrder: ['html5']   (was ['youtube', 'html5'])
   * - source type: auto-detected from file extension (was 'video/youtube')
   * - source URL:  videoSrc parameter (was '//youtu.be/${videoId}')
   * - nativePlayer plugin registered so custom events are dispatched
   * - 'vjs-youtube' class replaced with 'vjs-native'
   *
   * @param {string}  videoId   - YouTube video ID or filename-without-extension key
   * @param {string}  videoSrc  - YouTube ID / URL or native file URL/path
   * @param {boolean} isYouTube - true → YouTube tech; false → HTML5 tech
   * @param {Object}  options   - player callbacks (onStateChange, onReady, title)
   * @returns {Object|null}     - VideoJS player instance or null on failure
   */
  function createVideoJsPlayer(videoId, videoSrc, isYouTube, options = {}) {

    if (!container) {
      logger.error('\n' + `Container or overlay element not found`);
      return null;
    }

    if (player) {
      const isPlayerLoaded = (document.getElementById(player.id_) !== null) ? true : false;

      // jadams, 2026-06-28: prevent error like:
      // video.js:210 VIDEOJS: ERROR: TypeError: player.off is not a function      
      if (isPlayerLoaded) {
        isDev && logger.info('\n' + `Disposing existing videoJS player: ${player.id_}`);

        if (pipWindow && !pipWindow.closed) {
          pipWindow.close();
          pipWindow = null;
        }
        pipVisibilityBound = false;
        pipEnabled         = false;
    
        // player.dispose();  // trigger player.off
        // player = null;
      }
    }

    const overlayExists = document.getElementById(_pid('emptyPlayerOverlay'));
    if (!overlayExists) {
      isDev && logger.info('\n' + `Restoring container and overlay for new video`);
      container.innerHTML = containerHTML;
    }

    const currentOverlay = document.getElementById(_pid('emptyPlayerOverlay'));
    if (!currentOverlay) {
      isDev && logger.error('\n' + `Overlay element could not be restored`);
      return null;
    }

    // claude - VidoPlayer fix videoID #3
    // The element id is kept as the raw videoId (bare, no 'vjs-' prefix) so
    // player.id_, the videojs player registry key, previousPlayerId and the
    // playlist keys all stay identical - nothing downstream changes.
    //
    // IMPORTANT: an id like "8eba89d3-..._AVC-1080" (ARD Mediathek native
    // files are GUID-named) is a perfectly LEGAL "id" attribute in HTML5,
    // and sanitizeVideoId() (#1) correctly leaves it untouched - every char
    // is inside [A-Za-z0-9_-]. But it is NOT a legal CSS *identifier*: a CSS
    // ident must not start with a digit (nor a hyphen followed by a digit).
    // querySelector('#8eba...') therefore throws a SyntaxError. video.js's
    // videojs(id) -> getPlayer(id) does exactly that querySelector when the
    // player is not yet in its registry, which is why creation crashed for
    // these sources. The fix is applied at the videojs() call below: the
    // freshly created <video> ELEMENT is passed instead of the id string,
    // so no '#id' selector is ever built. getElementById()-based lookups
    // (e.g. the dispose guard above) are unaffected - getElementById has no
    // CSS-identifier restriction.
    const playerElementId = videoId;

    const video       = document.createElement('video');
    video.id          = playerElementId;
    video.className   = 'video-js vjs-theme-uno';
    video.controls    = true;
    video.width       = 640;
    video.height      = 360;

    video.setAttribute('aria-label', options.title || 'Video Player');

    currentOverlay.replaceWith(video);

    let videoConfig;

    if (isYouTube) {
      // YouTube tech configuration: all player parameters are now read from
      // videoPlayerOptions.videoJS.players.youtube (videoPlayer.yml) instead
      // of being hardcoded.
      const vpo     = (typeof j1 !== 'undefined' && j1.adapter && j1.adapter.videoPlayer)
        ? j1.adapter.videoPlayer.videoPlayerOptions
        : null;
      const ytCfg   = (vpo && vpo.videoJS && vpo.videoJS.players && vpo.videoJS.players.youtube)
        ? vpo.videoJS.players.youtube
        : {};

      // Build the YouTube playerVars object from players.youtube defaults.
      // Only numeric / string params that the YouTube IFrame API accepts are
      // forwarded; boolean flags (end, start) are used elsewhere in the module
      // and are intentionally excluded from playerVars.
      const ytPlayerVars = {};
      const ytParamKeys = [
        'cc_load_policy', 'controls', 'disablekb', 'enablejsapi',
        'fs', 'iv_load_policy', 'loop', 'modestbranding', 'rel', 'showinfo'
      ];
      ytParamKeys.forEach(key => {
        if (key in ytCfg) ytPlayerVars[key] = ytCfg[key];
      });


      // Hard-set the initial caption load policy to 0 ("do not show captions by
      // default") regardless of the players.youtube config value. This only
      // governs the INITIAL state; the permanent enforcement is done at runtime
      // via _disableYouTubeCaptions() (onApiChange -> unloadModule). Setting it
      // here avoids a brief caption flash before the module is unloaded.
      ytPlayerVars.cc_load_policy = 0;

      videoConfig = {
        fluid:     !!(ytCfg.fluid !== undefined ? ytCfg.fluid : true),
        techOrder: ['youtube', 'html5'],
        sources: [{
          type: 'video/youtube',
          src:  `//youtu.be/${videoId}`
        }],
        youtube: {
          playerVars: ytPlayerVars
        },
        controlBar: {
          pictureInPictureToggle: false,
          volumePanel: {
            inline: false
          }
        }
      };

      isDev && logger.info('\n' + `createVideoJsPlayer: YouTube playerVars from players.youtube: ${JSON.stringify(ytPlayerVars)}`);

    } else {
      // Native HTML5 tech configuration: all player parameters are now read
      // from videoPlayerOptions.videoJS.players.native (videoPlayer.yml)
      // instead of being hardcoded.  Static defaults are used as fallback
      // values when videoPlayerOptions is not yet available.
      const vpo      = (typeof j1 !== 'undefined' && j1.adapter && j1.adapter.videoPlayer)
        ? j1.adapter.videoPlayer.videoPlayerOptions
        : null;
      const ntvCfg   = (vpo && vpo.videoJS && vpo.videoJS.players && vpo.videoJS.players.native)
        ? vpo.videoJS.players.native
        : {};

      // Auto-detect MIME type from the file extension so that MP4, WebM
      // and OGV sources are all accepted without hardcoding.
      const extMap = {
        mp4:  'video/mp4',
        webm: 'video/webm',
        ogv:  'video/ogg',
        ogg:  'video/ogg',
        m4v:  'video/mp4',
        mov:  'video/mp4'
      };

      const srcExt  = (videoSrc || '').split('?')[0].split('.').pop().toLowerCase();
      const srcType = extMap[srcExt] || 'video/mp4';

      // videoJS configuration: HTML5 tech only.
      // Boolean/string player params are taken from players.native defaults;
      // static fallback values match the previous hardcoded behaviour.
      videoConfig = {
        fluid:       !!(ntvCfg.fluid       !== undefined ? ntvCfg.fluid       : true),
        fill:        !!(ntvCfg.fill        !== undefined ? ntvCfg.fill        : false),
        responsive:  !!(ntvCfg.responsive  !== undefined ? ntvCfg.responsive  : true),
        playsinline: !!(ntvCfg.playsinline !== undefined ? ntvCfg.playsinline : true),
        preload:     ntvCfg.preload || 'auto',
        sources: [{
          type: srcType,
          src:  videoSrc
        }],
        controlBar: {
          pictureInPictureToggle: false,
          volumePanel: {
            inline: false
          }
        }
      };

      // Apply poster from players.native if no dedicated poster is present
      // on the entry itself (poster resolution happens later in nativePlayer
      // plugin; this sets the initial VJS poster attribute).
      if (ntvCfg.default_poster) {
        videoConfig.poster = ntvCfg.default_poster;
      }

      isDev && logger.info('\n' + `createVideoJsPlayer: native config from players.native: fluid=${videoConfig.fluid}, responsive=${videoConfig.responsive}, preload=${videoConfig.preload}`);
    }

    if (typeof videojs !== 'undefined') {
      // claude - VidoPlayer fix videoID #3
      // Companion guard: because dispose() is intentionally skipped above
      // (see the "player.off is not a function" note), a previously created
      // player can linger in video.js's global registry under the same id.
      // With the string-based call this returned that STALE player (its DOM
      // element long since replaced via container.innerHTML) instead of a
      // new one. Clearing the slot to null first - video.js's own convention
      // for disposed players - guarantees the element-based call below always
      // yields a fresh, working player, and keeps registry lookups by id
      // (videojs.getPlayer) pointing at the live instance afterwards.
      try {
        const vjsRegistry = (typeof videojs.getPlayers === 'function') ? videojs.getPlayers() : null;
        if (vjsRegistry && vjsRegistry[playerElementId]) {
          isDev && logger.info('\n' + `clearing stale videojs registry entry for id: ${playerElementId}`);
          vjsRegistry[playerElementId] = null;
        }
      } catch (e) {
        isDev && logger.warn('\n' + `videojs registry cleanup skipped: ${e}`);
      }

      // claude - VidoPlayer fix videoID #3
      // Pass the <video> ELEMENT created above - NOT the id string. When
      // videojs() receives a string it routes through videojs.getPlayer(),
      // which resolves an unknown id via document.querySelector('#' + id).
      // A videoId with a leading digit (e.g. ARD Mediathek GUID filenames:
      // "8eba89d3-..._AVC-1080") is a valid HTML id but an invalid CSS
      // identifier, so that querySelector throws:
      //   SyntaxError: '#8eba...' is not a valid selector
      // Passing the element skips the selector path entirely and works for
      // ANY id (this also covers YouTube ids that start with a digit, e.g.
      // "9bZkp7q19f0", which had the same latent problem). video.js still
      // registers the player under video.id, so later registry lookups via
      // videojs.getPlayer(videoId) / player.id_ keep working unchanged.
      player = videojs(video, videoConfig, function onPlayerReady() {
        isDev && logger.info('\n' + `player ready on id: ${playerElementId}`);

        if (options.onStateChange) {
          const vjsPlayer = this;

          Object.keys(vjsStateEventMap).forEach(function(eventName) {
            vjsPlayer.on(eventName, function() {
              options.onStateChange({ data: vjsStateEventMap[eventName] });
            });
          });
        }

        if (!isYouTube) {
          // Register the nativePlayer plugin so it starts dispatching the
          // 'videoDataResolved', 'videoEnded' and 'videoManualPlay' custom
          // DOM events that the adapter (onReady) and loop mode rely on.
          if (typeof this.nativePlayer === 'function') {
            this.nativePlayer({ title: options.title || '' });
            isDev && logger.info('\n' + `nativePlayer plugin activated on: ${playerElementId}`);
          } else {
            isDev && logger.warn('\n' + `nativePlayer plugin not available - custom events will not be dispatched`);
          }
        }

        if (options.onReady) {
          options.onReady(this);
        }
      });
    }

    previousPlayerId = videoId;

    return player;
  } // END createVideoJsPlayer()

  // ---------------------------------------------------------------------------
  // Helper Classes
  // ---------------------------------------------------------------------------

  /**
   * inputWrapperHandler
   * Supports both YouTube URLs/IDs (routed to YouTube tech) and native
   * local/remote video URLs (routed to HTML5 tech).  YouTube detection
   * uses YOUTUBE_PATTERNS, native video detection uses VIDEO_URL_PATTERNS.
   * The class keeps the same public interface.
   */
  class inputWrapperHandler {
    constructor() {
      this.elements = this.cacheElements();
      this.init();
    }

    cacheElements() {
      return {
        pasteButton:      document.getElementById(_pid('pasteButton')),
        videoUrlInput:    document.getElementById(_pid('videoUrlInput')),
        loadVideoButton:  document.getElementById('loadVideo'),
        clearInputButton: document.getElementById(_pid('playlistInputClear'))
      };
    }

    init() {
      const { pasteButton, videoUrlInput, loadVideoButton, clearInputButton } = this.elements;

      if (pasteButton) {
        pasteButton.addEventListener('click', () => this.handlePasteClick());
      }

      if (loadVideoButton) {
        loadVideoButton.addEventListener('click', () => this.handleLoadVideo());
      }

      if (clearInputButton) {
        clearInputButton.addEventListener('click', () => this.handleClearInput());
      }

      if (videoUrlInput) {
        videoUrlInput.addEventListener('paste', (e) => this.handleDirectPaste(e));
        videoUrlInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.handleLoadVideo();
          }
        });

        videoUrlInput.addEventListener('input', (e) => {
          this._toggleClearButton(e.target.value);
        });

        videoUrlInput.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            this.handleClearInput();
            videoUrlInput.blur();
          }
        });
      }
    }

    async handlePasteClick() {
      try {
        if (!navigator.clipboard || !navigator.clipboard.readText) {
          isDev && logger.warn('\n' + MESSAGES.NO_CLIPBOARD_API);
          return;
        }

        window.focus();
        this.elements.videoUrlInput.focus();

        const text = await navigator.clipboard.readText();
        this.elements.videoUrlInput.value = text.trim();
        this._toggleClearButton(text.trim());
        this.processUrl();
      } catch (err) {
        isDev && logger.error('\n' + `Clipboard read error: ${err}`);
      }
    }

    handleDirectPaste(_event) {
      setTimeout(() => {
        this._toggleClearButton(this.elements.videoUrlInput.value);
        this.processUrl();
      }, PASTE_DELAY);
    }

    handleLoadVideo() {
      this.processUrl();
    }

    handleClearInput() {
      this.elements.videoUrlInput.value = '';
      this._toggleClearButton('');
      this.elements.videoUrlInput.focus();
    }

    _toggleClearButton(value) {
      const { clearInputButton } = this.elements;
      if (clearInputButton) {
        clearInputButton.style.display = (value && value.trim()) ? 'inline-flex' : 'none';
      }
    }

    processUrl() {
      const url = this.elements.videoUrlInput.value.trim();
      if (url === "") {
        isDev && logger.warn('\n' + MESSAGES.NO_URL);
        return;
      }

      // Try YouTube first; fall back to native video URL matching.
      const youtubeId = this.extractVideoId(url);
      if (youtubeId) {
        // duplicate check using the YouTube video ID
        if (previousPlayerId !== null && youtubeId === previousPlayerId) {
          isDev && logger.warn('\n' + `player already exists with id: ${youtubeId}`);
          return;
        }
        isDev && logger.info('\n' + `Loading YouTube video with id: ${youtubeId}`);
        this.loadYtVideo(youtubeId);

        // closeEditPlaylist(btn, playerId) — same pattern as closePlaylist.
        // force closinb the playlisz_edit_screen when a playlist is loaded
        const button  = _pid('edit_playlist');
        const playerID = button.replace("edit_playlist_", "");
        j1.adapter.videoPlayer.closeEditPlaylist(button, playerID);

        // update the playListButton (to be enabled when a playlist is loaded)
        playlistManager._updateTogglePlaylistButton();   

        return;
      }

      // extractVideoSrc returns the raw URL/path for native video files.
      const videoSrc = this.extractVideoSrc(url);

      // claude - VideoPlayer fix videoID #1
      // Apply the same sanitize embedRunVideo() uses so this duplicate-check id
      // matches previousPlayerId (set from embedRunVideo's cleaned id). Without
      // it, a native id containing an invalid char (e.g. a dot) would be compared
      // unsanitized here vs. sanitized there and never match, silently defeating
      // the "player already exists" guard. null/'' pass through unchanged
      // (sanitizeVideoId returns falsy input as-is).
      const videoId  = videoSrc
        ? sanitizeVideoId(videoSrc.split('?')[0].split('/').pop().replace(/\.[^.]+$/, '') || videoSrc)
        : null;

      if (previousPlayerId !== null && videoId === previousPlayerId) {
        isDev && logger.warn('\n' + `player already exists with id: ${videoId}`);
        return;
      }

      if (videoSrc) {
        isDev && logger.info('\n' + `Loading video from src: ${videoSrc}`);
        this.loadVideo(videoSrc);

        //  closeEditPlaylist(btn, playerId) — same pattern as closePlaylist.
        // force closinb the playlisz_edit_screen when a playlist is loaded
        const button  = _pid('edit_playlist');
        const playerID = button.replace("edit_playlist_", "");
        j1.adapter.videoPlayer.closeEditPlaylist(button, playerID);

        // update the playListButton (to be enabled when a playlist is loaded)
        playlistManager._updateTogglePlaylistButton();
      } else {
        isDev && logger.error('\n' + MESSAGES.INVALID_URL);
      }
    } // END processUrl()

    /**
     * extractVideoId
     * Detects YouTube URLs and bare video IDs using YOUTUBE_PATTERNS.
     * Returns the 11-character video ID on a match, otherwise returns null.
     * @param {string} url - raw input from the URL field
     * @returns {string|null} - YouTube video ID or null
     */
    extractVideoId(url) {
      for (const pattern of YOUTUBE_PATTERNS) {
        const match = (url || '').match(pattern);
        if (match) {
          return match[1];
        }
      }
      return null;
    }

    /**
     * loadYtVideo
     * Loads a YouTube video by ID through the YouTube tech path.
     * @param {string} videoId - YouTube video ID
     */
    loadYtVideo(videoId) {
      isDev && logger.info('\n' + `Loading YouTube video with id: ${videoId}`);

      const event = new CustomEvent('videoLoad', {
        detail: { videoId },
        bubbles: true
      });

      document.dispatchEvent(event);

      document.addEventListener('videoPlayingStarted', () => {
        this.elements.videoUrlInput.value = '';
        this._toggleClearButton('');
        isDev && logger.debug('\n' + 'inputWrapperHandler: input cleared after video started');
      }, { once: true });

      embedRunVideo(videoId);
    }

    /**
     * extractVideoSrc
     * Replaces extractVideoId (YouTube).  Returns the trimmed URL/path when
     * it matches VIDEO_URL_PATTERNS, otherwise returns null.
     * A bare value with no extension is also accepted as a fallback so that
     * relative filenames without dots still go through to the player.
     * @param {string} url - raw input from the URL field
     * @returns {string|null} - validated video src or null
     */
    extractVideoSrc(url) {
      const trimmed = (url || '').trim();
      if (!trimmed) return null;

      for (const pattern of VIDEO_URL_PATTERNS) {
        if (pattern.test(trimmed)) {
          return trimmed;
        }
      }

      // Accept any non-empty string as a last resort so that unusual but
      // valid server-relative URLs (e.g. /stream/live) still work.
      return trimmed || null;
    }

    /**
     * loadVideo
     * Renamed from loadYtVideo (YouTube) to loadVideo (native).
     * Dispatches 'videoLoad' with the video src URL instead of a YouTube ID.
     * @param {string} videoSrc - validated video URL/path
     */
    loadVideo(videoSrc) {
      isDev && logger.info('\n' + `Loading video from: ${videoSrc}`);

      const event = new CustomEvent('videoLoad', {
        detail: { videoSrc },
        bubbles: true
      });

      document.dispatchEvent(event);

      document.addEventListener('videoPlayingStarted', () => {
        this.elements.videoUrlInput.value = '';
        this._toggleClearButton('');
        isDev && logger.debug('\n' + 'inputWrapperHandler: input cleared after video started');
      }, { once: true });

      embedRunVideo(videoSrc);
    }
  }

  // ---------------------------------------------------------------------------
  // playlistIOHandler
  // ---------------------------------------------------------------------------
  class playlistIOHandler {

    constructor(options) {
      // Use the scoped video_container_{{player.id}} id instead of the
      // class selector '.video-container' so the correct player container is
      // captured when multiple players exist on the same page.
      container     = document.getElementById(_pid('video_container'));
      containerHTML = container ? container.innerHTML : '';

      this._videoPlayerOptions = options || null;
      this.elements            = this.cacheElements();
      this.init();
    }

    cacheElements() {
      return {
        importButton:         document.getElementById(_pid('playlistImportButton')),
        exportButton:         document.getElementById(_pid('playlistExportButton')),
        importFile:           document.getElementById(_pid('playlistImportFile')),
        clearButton:          document.getElementById(_pid('playlistClearButton')),
        serverPlaylistSelect: document.getElementById(_pid('serverPlaylistSelect')),
        serverPlaylistLoad:   document.getElementById(_pid('serverPlaylistLoadButton')),
        serverSelectClear:    document.getElementById(_pid('playlistSelectClear'))
      };
    }

    init() {
      const { importButton, exportButton, importFile, clearButton, serverPlaylistSelect, serverPlaylistLoad, serverSelectClear } = this.elements;

      if (importButton) {
        importButton.addEventListener('click', () => this.handleImport());
      }

      if (exportButton) {
        exportButton.addEventListener('click', () => this.handleExport());
      }

      if (importFile) {
        importFile.addEventListener('change', (e) => this.handleFileSelected(e));
      }

      if (clearButton) {
        clearButton.addEventListener('click', () => this.handleClear());
      }

      if (serverPlaylistLoad) {
        serverPlaylistLoad.addEventListener('click', () => this.handleLoadFromServer());
      }

      if (serverSelectClear) {
        serverSelectClear.addEventListener('click', () => this.handleClearServerSelect());
      }

      if (serverPlaylistSelect) {
        serverPlaylistSelect.addEventListener('change', () => {
          this._toggleServerSelectClear(serverPlaylistSelect.value);
        });
        this._serverSelectChangeBound = true;
      }

      this.loadPlaylistIndex();

      isDev && logger.info('\n' + 'playlistManager: IOHandler initialized');
    }

    handleImport() {
      const { importFile } = this.elements;
      if (importFile) {
        importFile.value = '';
        importFile.click();
      }
    }

    // called on handleImport()
    //
    handleFileSelected(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);

          const hasMetaData = (data && typeof data === 'object' && data.backup_date) ? true : false;
          const playlist    = hasMetaData ? data.playlist : data;

          if (hasMetaData) {
            const bkupDate = data.backup_date.replace('T', ' ').substring(0, 16);
            isDev && logger.info('\n' + `import playlist from backup file of date: ${bkupDate}`);
          }

          playlist.forEach(entry => playlistManager._normalizeEntry(entry));

          if (playlistManager._mergeMode) {
            const existing    = playlistManager.load() || [];
            const existingIds = new Set(existing.map(e => e.videoId));
            const newEntries  = playlist.filter(e => !existingIds.has(e.videoId));
            const merged      = existing.concat(newEntries);
            playlistManager.save(merged);
            isDev && logger.debug('\n' + `merged ${newEntries.length} new items (${playlist.length - newEntries.length} duplicates skipped) from file`);
          } else {
            playlistManager.save(playlist);
          }

          const loaded     = playlistManager.load() || [];
          const hasSeries  = loaded.some(entry => entry.series > 0);
          const hasEpisode = loaded.some(entry => entry.episode > 0);

          if (hasSeries || hasEpisode) {
            // claude - J1 VideoPlayer MultiInstance #4
            // Match the player-scoped sort <select> id so the imported playlist's
            // auto-sort reflects in THIS player's own control.
            // Original (deprecated, preserved for reference):
            //   const sortSelect = document.getElementById('playlistSortSelect');
            const sortSelect = document.getElementById(_pid('playlistSortSelect'));
            if (sortSelect) {
              sortSelect.value = 'episode';
            }
            playlistManager.sortPlaylist('episode');
            isDev && logger.info('\n' + 'playlistManager: series/episode entries detected - auto-sorted by episode');
          }

          if (!playlistManager._searchIndex && !playlistManager._loadSearchIndex()) {
            isDev && logger.info('\n' + 'playlistManager: build search index from scratch');
            playlistManager.buildSearchIndex();
          }

          const overlayExists = document.getElementById(_pid('emptyPlayerOverlay'));
          if (!overlayExists) {
            isDev && logger.debug('\n' + `Restoring container and overlay for new video`);
            container.innerHTML = containerHTML;
          }

          // closeEditPlaylist(btn, playerId) — same pattern as closePlaylist.
          // force closinb the playlisz_edit_screen when a playlist is loaded
          const button  = _pid('edit_playlist');
          const playerID = button.replace("edit_playlist_", "");
          j1.adapter.videoPlayer.closeEditPlaylist(button, playerID);

          // update the playListButton (to be enabled when a playlist is loaded)
          playlistManager._updateTogglePlaylistButton();

          playlistManager.renderCurrent();

          // claude - Modify J1 VideoPlayer #33
          // Backfill posters for imported native-video entries that arrived
          // without one. Runs asynchronously after the initial render so the
          // list appears immediately (with DEFAULT_POSTER placeholders) and the
          // real thumbnails fill in as each frame is captured.
          playlistManager.generateMissingNativePosters()
            .catch((e) => { isDev && logger.warn('\n' + `poster backfill (file import) failed: ${e}`); });

          // claude - Modify J1 VideoPlayer #27
          // Mirror of "Modify J1 VideoPlayer #26" (handleLoadFromServer): when a
          // playlist file is imported here, load the first video of the
          // (display-ordered) list into the player and start it in the 'paused'
          // state. The display order is reproduced by applying the active sort
          // criterion (_currentSort) to a fresh copy of the stored playlist —
          // the same ordering renderCards()/renderPlaylist() apply — so the
          // entry chosen here matches the first row the user sees. Going through
          // the playlistManager.embedRunVideo(videoId, 'pause') wrapper resolves
          // the entry's src and, via playerMode === 'pause', pauses playback
          // right after start (see the autoplay branch in embedRunVideo). The
          // 'pause' mode (instead of playEntry()) is deliberate: it does NOT set
          // _startedFromPlaylist, so the playlist panel is left open after load.
          // As with #26, the paused-after-start behaviour depends on the
          // autoplay config being enabled.
          //
          const currentList = playlistManager.load() || [];
          playlistManager._applySortOrder(currentList);
          const firstEntry = currentList[0];
          if (firstEntry && firstEntry.videoId) {
            isDev && logger.info('\n' + `playlistManager: loading first imported-playlist video in paused state (videoId: ${firstEntry.videoId})`);
            playlistManager.embedRunVideo(firstEntry.videoId, 'pause');
          } else {
            isDev && logger.warn('\n' + 'playlistManager: no playable first entry found after playlist file import');
          }

          // document.getElementById(_pid('playlistSortSelect')); 
          const videoTitleElement = document.getElementById(_pid('videoplayer_playlist_parent'));
          // const videoTitleElement = document.getElementById('video_title');
          if (videoTitleElement) {
            scrollToElement(videoTitleElement);
          }

        } catch (err) {
          logger.error('\n' + `import from file failed: ${err}`);
        }
      };

      reader.readAsText(file);
    }

    handleExport() {
      playlistManager.exportToFile();
    }

    handleClear() {
      const opts = this._videoPlayerOptions;

      // jadams, 2026-06-06, reload should made unnecessary. Requures
      // additional checks for the toggle_playlist button if a playlist
      // is loaded/available
      //
      // "Clear with backup": trigger a downloadable safety backup of the
      // current playlist BEFORE it is removed. The anchor download is
      // initiated synchronously, so it is committed by the browser before
      // the subsequent clearPlaylist()/location.reload() runs. backupToFile()
      // is a no-op (returns false, no download) when the playlist is already
      // empty, matching clearPlaylist()'s own empty-guard.
      playlistManager.backupToFile();

      const reload  = true;
      const cleared = playlistManager.clearPlaylist();
      if (cleared && reload) {
        location.reload();
      }
    }

    handleClearServerSelect() {
      const { serverPlaylistSelect } = this.elements;
      if (serverPlaylistSelect) {
        serverPlaylistSelect.selectedIndex = 0;
        this._toggleServerSelectClear('');
        isDev && logger.info('\n' + 'playlistManager: server playlist selection cleared');
      }
    }

    _toggleServerSelectClear(value) {
      const { serverSelectClear } = this.elements;
      if (serverSelectClear) {
        serverSelectClear.style.display = (value && value.trim()) ? 'inline-flex' : 'none';
      }
    }

    loadPlaylistIndex(attempt = 1, maxAttempts = 5) {
      let selectEl = this.elements.serverPlaylistSelect;
      if (!selectEl) {
        selectEl = document.getElementById(_pid('serverPlaylistSelect'));
        if (selectEl) {
          this.elements.serverPlaylistSelect = selectEl;

          if (!this._serverSelectChangeBound) {
            selectEl.addEventListener('change', () => {
              this._toggleServerSelectClear(selectEl.value);
            });
            this._serverSelectChangeBound = true;
          }
        }
      }

      if (!selectEl) {
        if (attempt <= maxAttempts) {
          const delay = 500 * attempt;
          isDev && logger.warn('\n' + `loadPlaylistIndex: serverPlaylistSelect not in DOM, retry ${attempt}/${maxAttempts} in ${delay}ms`);
          setTimeout(() => this.loadPlaylistIndex(attempt + 1, maxAttempts), delay);
        } else {
          logger.error('\n' + 'loadPlaylistIndex: serverPlaylistSelect element not found after ' + maxAttempts + ' attempts');
        }
        return;
      }

      fetch(PLAYLIST_INDEX)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(index => {
          if (!Array.isArray(index) || index.length === 0) {
            isDev && logger.warn('\n' + 'playlist index is empty or not an array');
            return;
          }

          selectEl.innerHTML = `
            <option value="" disabled selected>
              Select a playlist to import ...
            </option>
          `;

          index.forEach(entry => {
            const option       = document.createElement('option');
            option.value       = entry.file;
            option.textContent = entry.name || entry.file;
            selectEl.appendChild(option);
          });

          isDev && logger.debug('\n' + `playlistManager: loaded ${index.length} playlists from index`);
        })
        .catch(err => {
          logger.error('\n' + `playlistManager: failed to load playlist index: ${err}`);

          if (attempt < maxAttempts) {
            const delay = 1000 * attempt;
            isDev && logger.warn('\n' + `loadPlaylistIndex: fetch failed, retry ${attempt}/${maxAttempts} in ${delay}ms`);
            setTimeout(() => this.loadPlaylistIndex(attempt + 1, maxAttempts), delay);
          } else {
            logger.error('\n' + 'loadPlaylistIndex: all ' + maxAttempts + ' attempts failed - playlist index not loaded');
          }
        });
    }

    async handleLoadFromServer() {
      const { serverPlaylistSelect }  = this.elements;
      const selectedFile              = serverPlaylistSelect ? serverPlaylistSelect.value : '';

      if (!selectedFile) {
        isDev && logger.warn('\n' + 'playlistManager: no server playlist selected');
        return;
      }

      const url = `${PLAYLIST_URL_BASE}/${selectedFile}`;
      isDev && logger.info('\n' + `playlistManager: loading server playlist from: ${url}`);

      await playlistManager.importFromUrlAsync(url);

      const loaded     = playlistManager.load() || [];
      const hasSeries  = loaded.some(entry => entry.series > 0);
      const hasEpisode = loaded.some(entry => entry.episode > 0);

      if (hasSeries || hasEpisode) {
        // claude - J1 VideoPlayer MultiInstance #4
        // Match the player-scoped sort <select> id (server-playlist load path).
        // Original (deprecated, preserved for reference):
        //   const sortSelect = document.getElementById('playlistSortSelect');
        const sortSelect = document.getElementById(_pid('playlistSortSelect'));
        if (sortSelect) {
          sortSelect.value = 'episode';
        }
        playlistManager.sortPlaylist('episode');
        isDev && logger.debug('\n' + 'playlistManager: series/episode entries detected - auto-sorted by episode');
      }

      if (!playlistManager._searchIndex && !playlistManager._loadSearchIndex()) {
        isDev && logger.debug('\n' + 'playlistManager: build search index from scratch');
        playlistManager.buildSearchIndex();
      }

      serverPlaylistSelect.value = '';

      const overlayExists = document.getElementById(_pid('emptyPlayerOverlay'));
      if (!overlayExists) {
        isDev && logger.debug('\n' + `Restoring container and overlay for new video`);
        container.innerHTML = containerHTML;
      }

      //  closeEditPlaylist(btn, playerId) — same pattern as closePlaylist.
      // force closinb the playlisz_edit_screen when a playlist is loaded
      const button  = _pid('edit_playlist');
      const playerID = button.replace("edit_playlist_", "");
      j1.adapter.videoPlayer.closeEditPlaylist(button, playerID);

      // update the playListButton (to be enabled when a playlist is loaded)
      playlistManager._updateTogglePlaylistButton();

      // claude - Modify J1 VideoPlayer #33
      // Backfill posters for server-loaded native-video entries that arrived
      // without one (mirror of the handleFileSelected() backfill). Runs
      // asynchronously so the list appears immediately and the real thumbnails
      // fill in as each frame is captured off-screen.
      playlistManager.generateMissingNativePosters()
        .catch((e) => { isDev && logger.warn('\n' + `poster backfill (server load) failed: ${e}`); });

      // claude - Modify J1 VideoPlayer #26
      // When a playlist is loaded from the server, load the first video of the
      // (display-ordered) list into the player and start it in the 'paused'
      // state. The display order is reproduced by applying the active sort
      // criterion (_currentSort) to a fresh copy of the stored playlist — the
      // same ordering renderCards()/renderPlaylist() apply — so the entry
      // chosen here matches the first row the user sees. Going through the
      // playlistManager.embedRunVideo(videoId, 'pause') wrapper resolves the
      // entry's src and, via playerMode === 'pause', pauses playback right
      // after start (see the autoplay branch in embedRunVideo). The 'pause'
      // mode (instead of playEntry()) is deliberate: it does NOT set
      // _startedFromPlaylist, so the playlist panel is left open after load.
      //
      const currentList = playlistManager.load() || [];
      playlistManager._applySortOrder(currentList);
      const firstEntry = currentList[0];
      if (firstEntry && firstEntry.videoId) {
        isDev && logger.info('\n' + `playlistManager: loading first server-playlist video in paused state (videoId: ${firstEntry.videoId})`);
        playlistManager.embedRunVideo(firstEntry.videoId, 'pause');
      } else {
        isDev && logger.warn('\n' + 'playlistManager: no playable first entry found after server playlist load');
      }

      // const videoTitleElement = document.getElementById('video_title');
      const videoTitleElement = document.getElementById(_pid('videoplayer_playlist_parent'));
      if (videoTitleElement) {
        scrollToElement(videoTitleElement);
      }

    }
  } // END playlistIOHandler

  // ---------------------------------------------------------------------------
  // playlistSearchHandler (unchanged)
  // ---------------------------------------------------------------------------
  class playlistSearchHandler {

    constructor() {
      this.elements     = this.cacheElements();
      this._debounceTimer = null;
      this.init();
    }

    cacheElements() {
      return {
        searchInput:  document.getElementById(_pid('playlistSearchInput')),
        clearButton:  document.getElementById(_pid('playlistSearchClear')),
        resultCount:  document.getElementById(_pid('playlistSearchResultCount'))
      };
    }

    init() {
      const { searchInput, clearButton } = this.elements;

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this._toggleClearButton(e.target.value);
          this._debounceSearch(e.target.value, 300);
        });

        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(this._debounceTimer);
            this._executeSearch(searchInput.value);
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            this._clearSearch();
            searchInput.blur();
          }
        });
      }

      if (clearButton) {
        clearButton.addEventListener('click', () => {
          this._clearSearch();
          if (searchInput) searchInput.focus();
        });
      }

      isDev && logger.info('\n' + 'playlistManager: searchHandler initialized');
    }

    _debounceSearch(query, delayMs) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => {
        this._executeSearch(query);
      }, delayMs);
    }

    _toggleClearButton(value) {
      const { clearButton } = this.elements;
      if (clearButton) {
        clearButton.style.display = (value && value.trim()) ? 'inline-flex' : 'none';
      }
    }

    _executeSearch(query) {
      const { searchInput, clearButton, resultCount } = this.elements;
      const trimmed = (query || '').trim();

      if (!trimmed) {
        this._clearSearch();
        return;
      }

      const results = playlistManager.searchPlaylist(trimmed);

      if (resultCount) {
        resultCount.textContent = `${results.length} item${results.length !== 1 ? 's' : ''} found`;        
        resultCount.style.display = 'inline';
      }

      if (clearButton) {
        clearButton.style.display = 'inline-flex';
      }
    }

    _clearSearch() {
      const { searchInput, clearButton, resultCount } = this.elements;

      if (searchInput) {
        searchInput.value = '';
      }

      if (clearButton) {
        clearButton.style.display = 'none';
      }

      if (resultCount) {
        resultCount.textContent = '';
        resultCount.style.display = 'none';
      }

      playlistManager.clearSearch();
    }

  } // END playlistSearchHandler

  // ---------------------------------------------------------------------------
  // playlistModeSwitchHandler
  // ---------------------------------------------------------------------------
  class playlistModeSwitchHandler {

    constructor() {
      this.elements = this.cacheElements();
      this.init();
    }

    cacheElements() {
      // claude - J1 VideoPlayer MultiInstance #4
      // Resolve the title bar within THIS player's own #playlist_screen panel
      // (falling back to #playlistBlock) instead of the first
      // '.playlist-block-title' in the whole document. On a multi-player page the
      // bare document.querySelector() always returned player 1's title bar, so a
      // later player's handler kept operating on player 1 and never populated its
      // own #playlistBlock_<id> — which is exactly why the second player's
      // playlist block stayed empty (mode/merge switches absent). _pid() scopes
      // the lookup to the owning player; the page-global querySelector remains as
      // the single-player fallback when no player id is set.
      // Original (deprecated, preserved for reference):
      //   titleBar:       document.querySelector('.playlist-block-title'),
      const _scope = document.getElementById(_pid('playlist_screen')) || document.getElementById(_pid('playlistBlock'));
      return {
        titleBar:       _scope ? _scope.querySelector('.playlist-block-title') : document.querySelector('.playlist-block-title'),
        listModeSwitch: null
      };
    }

    init() {
      const { titleBar } = this.elements;
      if (!titleBar) {
        isDev && logger.warn('\n' + 'playlistModeSwitchHandler: .playlist-block-title not found');
        return;
      }

      // claude - J1 VideoPlayer MultiInstance #4
      // Player-scope the switch id so each player creates and owns its own
      // control. With the bare id, once player 1 had created #playlistModeSwitch
      // the lookup here found it for every later player, took the "reuse existing
      // static switch" branch, and never built a switch in the later player's
      // title bar. _pid('playlistModeSwitch') keys the control to this player.
      // Original (deprecated, preserved for reference):
      //   let listModeSwitch = document.getElementById('playlistModeSwitch');
      let listModeSwitch = document.getElementById(_pid('playlistModeSwitch'));

      if (!listModeSwitch) {
        listModeSwitch            = document.createElement('div');
        // claude - J1 VideoPlayer MultiInstance #4
        // Original (deprecated, preserved for reference):
  //    listModeSwitch.id         = 'playlistModeSwitch';
        listModeSwitch.id         = _pid('playlistModeSwitch');
        listModeSwitch.className  = 'switch not-spoken';

        // claude - J1 VideoPlayer MultiInstance #4
        // Player-scope the checkbox id too (it is read back below via
        // getElementById(_pid('playlistMode'))). The label wraps the input, so
        // the label/for association is preserved without a `for` attribute.
        // Original (deprecated, preserved for reference):
        //   <input id="playlistMode" type="checkbox" name="playlistMode" checked>
        listModeSwitch.innerHTML  = `
          <label>
            <input id="${_pid('playlistMode')}" type="checkbox" name="playlistMode" checked>
            <span class="bmd-switch-track"></span>
            Cards
          </label>
        `;

        // claude - J1 VideoPlayer MultiInstance #4
        // Original (deprecated, preserved for reference):
//      const sortSelect = document.getElementById('playlistSortSelect');
        const sortSelect = document.getElementById(_pid('playlistSortSelect'));
        if (sortSelect) {
          titleBar.insertBefore(listModeSwitch, sortSelect);
        } else {
          titleBar.appendChild(listModeSwitch);
        }

        isDev && logger.debug('\n' + 'playlistModeSwitchHandler: created dynamic switch');
      } else {
        isDev && logger.debug('\n' + 'playlistModeSwitchHandler: reusing existing static switch');
      }

      // claude - J1 VideoPlayer MultiInstance #4
      // Original (deprecated, preserved for reference):
//    const checkbox = document.getElementById('playlistMode');
      const checkbox = document.getElementById(_pid('playlistMode'));
      if (!checkbox) {
        logger.error('\n' + 'playlistModeSwitchHandler: checkbox #playlistMode not found');
        return;
      }

      // jadams
      checkbox.checked = (playlistManager._displayMode === 'cards');

      checkbox.addEventListener('change', (e) => {
        // claude - J1 VideoPlayer MultiInstance #6
        // Player-scope both mode writes so a toggle persists only THIS player's
        // preference. _pid('playlistMode') matches the constructor read and the
        // checkbox id created in init() (fix #4), keeping key and DOM in lockstep.
        if (e.target.checked) {
          playlistManager._displayMode = 'cards';
          // claude - J1 VideoPlayer MultiInstance #6
          // Original (deprecated, preserved for reference):
//        localStorage.setItem('playlistMode', 'cards');
          localStorage.setItem(_pid('playlistMode'), 'cards');
          isDev && logger.info('\n' + 'playlistModeSwitchHandler: switched to card mode');
        } else {
          playlistManager._displayMode = 'list';
          // claude - J1 VideoPlayer MultiInstance #6
          // Original (deprecated, preserved for reference):
//        localStorage.setItem('playlistMode', 'list');
          localStorage.setItem(_pid('playlistMode'), 'list');
          isDev && logger.info('\n' + 'playlistModeSwitchHandler: switched to list mode');
        }
        playlistManager.renderCurrent();
      });

      this.elements.listModeSwitch = listModeSwitch;

      const data = playlistManager.load() || [];
      if (data.length === 0) {
        listModeSwitch.style.display = 'none';
      }

      isDev && logger.info('\n' + 'playlistModeSwitchHandler: modeSwitchHandler initialized');
    }

  } // END playlistModeSwitchHandler

  // ---------------------------------------------------------------------------
  // playlistMergeSwitchHandler
  // ---------------------------------------------------------------------------
  class playlistMergeSwitchHandler {

    constructor(options) {
      this._videoPlayerOptions = options || null;
      this.elements            = this.cacheElements();
      this.init();
    }

    cacheElements() {
      // claude - J1 VideoPlayer MultiInstance #4
      // Same per-player title-bar scoping as playlistModeSwitchHandler — see the
      // note there. Without it the merge switch was built into (or reused from)
      // player 1's title bar and never appeared for later players.
      // Original (deprecated, preserved for reference):
      //   titleBar:        document.querySelector('.playlist-block-title'),
      const _scope = document.getElementById(_pid('playlist_screen')) || document.getElementById(_pid('playlistBlock'));
      return {
        titleBar:        _scope ? _scope.querySelector('.playlist-block-title') : document.querySelector('.playlist-block-title'),
        mergeModeSwitch: null
      };
    }

    init() {
      const opts = this._videoPlayerOptions;
      if (opts === null || !opts.enabled) {
        return;
      }

      const { titleBar } = this.elements;
      if (!titleBar) {
        isDev && logger.warn('\n' + 'playlistMergeSwitchHandler: .playlist-block-title not found');
        return;
      }

      // claude - J1 VideoPlayer MultiInstance #4
      // Player-scope the merge switch id (see playlistModeSwitchHandler note).
      // Original (deprecated, preserved for reference):
      //   let mergeModeSwitch = document.getElementById('playlistMergeSwitch');
      let mergeModeSwitch = document.getElementById(_pid('playlistMergeSwitch'));

      if (!mergeModeSwitch) {
        mergeModeSwitch           = document.createElement('div');
        // claude - J1 VideoPlayer MultiInstance #4
        // Original (deprecated, preserved for reference):
        //   mergeModeSwitch.id        = 'playlistMergeSwitch';
        mergeModeSwitch.id        = _pid('playlistMergeSwitch');
        mergeModeSwitch.className = 'switch not-spoken';
        // claude - J1 VideoPlayer MultiInstance #4
        // Player-scope the checkbox id (read back below via _pid('mergeMode')).
        // Original (deprecated, preserved for reference):
        //   <input id="mergeMode" type="checkbox" name="mergeMode">
        mergeModeSwitch.innerHTML = `
          <label>
            <input id="${_pid('mergeMode')}" type="checkbox" name="mergeMode">
            <span class="bmd-switch-track"></span>
            Merge
          </label>
        `;

        // claude - J1 VideoPlayer MultiInstance #4
        // Original (deprecated, preserved for reference):
        //   const listModeSwitch = document.getElementById('playlistModeSwitch');
        //   const sortSelect     = document.getElementById('playlistSortSelect');
        const listModeSwitch = document.getElementById(_pid('playlistModeSwitch'));
        const sortSelect     = document.getElementById(_pid('playlistSortSelect'));

        if (listModeSwitch && listModeSwitch.nextSibling) {
          titleBar.insertBefore(mergeModeSwitch, listModeSwitch.nextSibling);
        } else if (sortSelect) {
          titleBar.insertBefore(mergeModeSwitch, sortSelect);
        } else {
          titleBar.appendChild(mergeModeSwitch);
        }

        isDev && logger.debug('\n' + 'playlistMergeSwitchHandler: created dynamic switch');
      } else {
        isDev && logger.debug('\n' + 'playlistMergeSwitchHandler: reusing existing static switch');
      }

      // claude - J1 VideoPlayer MultiInstance #4
      // Original (deprecated, preserved for reference):
      //   const checkbox = document.getElementById('mergeMode');
      const checkbox = document.getElementById(_pid('mergeMode'));
      if (!checkbox) {
        logger.error('\n' + 'playlistMergeSwitchHandler: checkbox #mergeMode not found');
        return;
      }

      checkbox.checked = playlistManager._mergeMode;

      checkbox.addEventListener('change', (e) => {
        // claude - J1 VideoPlayer MultiInstance #6
        // Player-scope both merge writes so a toggle persists only THIS player's
        // preference. _pid('mergeMode') matches the constructor read and the
        // checkbox id created in init() (fix #4), keeping key and DOM in lockstep.
        if (e.target.checked) {
          playlistManager._mergeMode = true;

          // claude - J1 VideoPlayer MultiInstance #6
          // Original (deprecated, preserved for reference):
          //   localStorage.setItem('mergeMode', 'true');
          localStorage.setItem(_pid('mergeMode'), 'true');
          isDev && logger.debug('\n' + 'playlistMergeSwitchHandler: merge mode enabled');
        } else {
          playlistManager._mergeMode = false;

          // claude - J1 VideoPlayer MultiInstance #6
          // Original (deprecated, preserved for reference):
          //   localStorage.setItem('mergeMode', 'false');
          localStorage.setItem(_pid('mergeMode'), 'false');
          isDev && logger.debug('\n' + 'playlistMergeSwitchHandler: merge mode disabled');
        }
        playlistManager.renderCurrent();
      });

      this.elements.mergeModeSwitch = mergeModeSwitch;

      const data = playlistManager.load() || [];
      if (data.length === 0) {
        mergeModeSwitch.style.display = 'none';
      }

      isDev && logger.info('\n' + 'playlistManager: mergeSwitchHandler initialized');
    }

  } // END playlistMergeSwitchHandler

  // ---------------------------------------------------------------------------
  // playlistLoopSwitchHandler
  // ---------------------------------------------------------------------------
  class playlistLoopSwitchHandler {

    constructor(options) {
      this._videoPlayerOptions = options || null;
      this.elements            = this.cacheElements();
      this.init();
    }

    cacheElements() {
      // claude - J1 VideoPlayer MultiInstance #4
      // Per-player title-bar scoping (see playlistModeSwitchHandler note).
      // Original (deprecated, preserved for reference):
      //   titleBar:       document.querySelector('.playlist-block-title'),
      const _scope = document.getElementById(_pid('playlist_screen')) || document.getElementById(_pid('playlistBlock'));
      return {
        titleBar:       _scope ? _scope.querySelector('.playlist-block-title') : document.querySelector('.playlist-block-title'),
        loopModeSwitch: null
      };
    }

    init() {
      const opts = this._videoPlayerOptions;

      if (opts === null || !opts.enabled) {
        return;
      }

      const { titleBar } = this.elements;
      if (!titleBar) {
        isDev && logger.warn('\n' + 'playlistLoopSwitchHandler: .playlist-block-title not found');
        return;
      }

      loopConfigEnabled = !!(opts.playlist && opts.playlist.loop && opts.playlist.loop.enabled);
      pipConfigEnabled  = !!(opts.playlist && opts.playlist.loop && opts.playlist.loop.pip);

      if (!loopConfigEnabled) {
        isDev && logger.debug('\n' + 'playlistLoopSwitchHandler: loop mode disabled by config, skipping init');
        return;
      }

      // claude - J1 VideoPlayer MultiInstance #4
      // Player-scope the loop switch id (see playlistModeSwitchHandler note).
      // NB: the existing 'playlisLoopSwitch' spelling is an established series
      // identifier and is preserved verbatim; only the _pid() scope is added.
      // Original (deprecated, preserved for reference):
      //   let loopModeSwitch = document.getElementById('playlisLoopSwitch');
      let loopModeSwitch = document.getElementById(_pid('playlisLoopSwitch'));

      if (!loopModeSwitch) {
        loopModeSwitch            = document.createElement('div');

        // claude - J1 VideoPlayer MultiInstance #4
        // Original (deprecated, preserved for reference):
        //   loopModeSwitch.id         = 'playlisLoopSwitch';
        loopModeSwitch.id         = _pid('playlisLoopSwitch');
        loopModeSwitch.className  = 'switch not-spoken';
        // claude - J1 VideoPlayer MultiInstance #4
        // Player-scope the checkbox id (read back below via _pid('loopMode')).
        // Original (deprecated, preserved for reference):
        //   <input id="loopMode" type="checkbox" name="loopMode">
        loopModeSwitch.innerHTML  = `
          <label>
            <input id="${_pid('loopMode')}" type="checkbox" name="loopMode">
            <span class="bmd-switch-track"></span>
            Loop
          </label>
        `;

        // claude - J1 VideoPlayer MultiInstance #4
        // Original (deprecated, preserved for reference):
        //   const mergeModeSwitch = document.getElementById('playlistMergeSwitch');
        //   const sortSelect      = document.getElementById('playlistSortSelect');
        const mergeModeSwitch = document.getElementById(_pid('playlistMergeSwitch'));
        const sortSelect      = document.getElementById(_pid('playlistSortSelect'));

        if (mergeModeSwitch && mergeModeSwitch.nextSibling) {
          titleBar.insertBefore(loopModeSwitch, mergeModeSwitch.nextSibling);
        } else if (sortSelect) {
          titleBar.insertBefore(loopModeSwitch, sortSelect);
        } else {
          titleBar.appendChild(loopModeSwitch);
        }

        isDev && logger.debug('\n' + 'playlistLoopSwitchHandler: created dynamic switch');
      } else {
        isDev && logger.debug('\n' + 'playlistLoopSwitchHandler: reusing existing static switch');
      }

      // claude - J1 VideoPlayer MultiInstance #4
      // Original (deprecated, preserved for reference):
      //   const checkbox = document.getElementById('loopMode');
      const checkbox = document.getElementById(_pid('loopMode'));
      if (!checkbox) {
        logger.error('\n' + 'playlistLoopSwitchHandler: checkbox #loopMode not found');
        return;
      }

      checkbox.checked = playlistManager._loopEnabled;

      checkbox.addEventListener('change', (e) => {
        // claude - J1 VideoPlayer MultiInstance #6
        // Player-scope both loop writes so a toggle persists only THIS player's
        // preference. _pid('playlistLoop') matches the constructor read and the
        // loop checkbox id created in init() (fix #4), key and DOM in lockstep.
        if (e.target.checked) {
          playlistManager._loopEnabled = true;
          // Original (deprecated, preserved for reference):
          //   localStorage.setItem('playlistLoop', 'true');
          localStorage.setItem(_pid('playlistLoop'), 'true');
          isDev && logger.debug('\n' + 'playlistLoopSwitchHandler: loop mode enabled');
        } else {
          playlistManager._loopEnabled = false;
          // Original (deprecated, preserved for reference):
          //   localStorage.setItem('playlistLoop', 'false');
          localStorage.setItem(_pid('playlistLoop'), 'false');
          isDev && logger.debug('\n' + 'playlistLoopSwitchHandler: loop mode disabled');
        }
      });

      this.elements.loopModeSwitch = loopModeSwitch;

      const data      = playlistManager.load() || [];
      const allSeries = data.length > 0 && data.every(e => e.series && e.series >= 1);
      if (!allSeries) {
        loopModeSwitch.style.display = 'none';
        if (playlistManager._loopEnabled) {
          playlistManager._loopEnabled = false;
          // claude - J1 VideoPlayer MultiInstance #6
          // Player-scope this UI-preference write (see the change-listener note).
          // Original (deprecated, preserved for reference):
          //   localStorage.setItem('playlistLoop', 'false');
          localStorage.setItem(_pid('playlistLoop'), 'false');
        }
        checkbox.checked = false;
      }

      isDev && logger.info('\n' + 'playlistManager: loopSwitchHandler initialized');
    }

  } // END playlistLoopSwitchHandler

  // ---------------------------------------------------------------------------
  // playlistSortHandler
  // ---------------------------------------------------------------------------
  class playlistSortHandler {

    constructor() {
      this.elements = this.cacheElements();
      this.init();
    }

    cacheElements() {
      // claude - J1 VideoPlayer MultiInstance #4
      // Per-player title-bar scoping (see playlistModeSwitchHandler note).
      // Original (deprecated, preserved for reference):
      //   titleBar:   document.querySelector('.playlist-block-title'),
      const _scope = document.getElementById(_pid('playlist_screen')) || document.getElementById(_pid('playlistBlock'));
      return {
        titleBar:   _scope ? _scope.querySelector('.playlist-block-title') : document.querySelector('.playlist-block-title'),
        sortSelect: null
      };
    }

    init() {
      const { titleBar } = this.elements;
      if (!titleBar) {
        isDev && logger.warn('\n' + 'playlistSortHandler: .playlist-block-title not found');
        return;
      }

      const canonicalOptions = [
        { value: 'watchDate',    label: 'Date (newest)' },
        { value: 'watchDateAsc', label: 'Date (oldest)' },
        { value: 'issueDate',    label: 'Issue Date (newest)' },
        { value: 'issueDateAsc', label: 'Issue Date (oldest)' },
        { value: 'duration',     label: 'Duration (longest)' },
        { value: 'durationAsc',  label: 'Duration (shortest)' },
        { value: 'title',        label: 'Title' },
        { value: 'author',       label: 'Author' },
        { value: 'category',     label: 'Category' },
        { value: 'description',  label: 'Description' },
        { value: 'rating',       label: 'Rating' },
        { value: 'episode',      label: 'Episode' },
        { value: 'type',         label: 'Type' }
      ];

      // claude - J1 VideoPlayer MultiInstance #4
      // Player-scope the sort <select> id so each player builds and owns its own
      // control in its own title bar (see playlistModeSwitchHandler note).
      // Original (deprecated, preserved for reference):
      //   let select = document.getElementById('playlistSortSelect');
      let select = document.getElementById(_pid('playlistSortSelect'));

      if (select) {
        this._ensureOptions(select, canonicalOptions);
        isDev && logger.debug('\n' + 'playlistSortHandler: reusing existing static <select>');
      } else {
        select            = document.createElement('select');
        // claude - J1 VideoPlayer MultiInstance #4
        // Original (deprecated, preserved for reference):
        //   select.id         = 'playlistSortSelect';
        select.id         = _pid('playlistSortSelect');
        select.className  = 'playlist-sort-select';
        select.title      = 'Sort playlist';
        select.setAttribute('aria-label', 'Sort playlist');

        canonicalOptions.forEach(opt => {
          const o       = document.createElement('option');
          o.value       = opt.value;
          o.textContent = opt.label;
          select.appendChild(o);
        });

        titleBar.appendChild(select);
      }

      // claude - J1 VideoPlayer MultiInstance #6
      // Player-scope the sort-mode read. The bare 'searchMode' key is origin-global,
      // so on a multi-player page both sort <select>s restored the same criterion
      // on (re)load. _pid('searchMode') suffixes it per player, matching the write
      // in the change listener below. (Key name 'searchMode' is an established
      // series identifier and is preserved verbatim; only the _pid() scope is added.)
      // Original (deprecated, preserved for reference):
      //   const storedSortMode = localStorage.getItem('searchMode');
      const storedSortMode = localStorage.getItem(_pid('searchMode'));
      const sortCriterion  = storedSortMode || playlistManager._currentSort || 'watchDate';

      playlistManager._currentSort = sortCriterion;
      select.value = sortCriterion;

      isDev && logger.debug('\n' + `playlistSortHandler: sort criterion restored to "${sortCriterion}" (stored: ${storedSortMode || 'none'})`);

      const playlist = playlistManager.load() || [];
      if (playlist.length > 0) {
        playlistManager._applySortOrder(playlist);
        playlistManager.save(playlist);
        playlistManager.renderCurrent();
      }

      // claude - Modify J1 VideoPlayer #41
      // When a playlist is already present in localStorage on (re)load, restore
      // the same "first entry loaded in paused state" behaviour the IO handlers
      // apply after a user-triggered load (#26/#27). This runs here because
      // playlistSortHandler.init() is a page-load handler that already touches
      // the stored playlist (load/sort/render above) and runs after the adapter
      // has wired videojs + videoPlayerOptions, so embedRunVideo() is callable.
      // The method is once-only-guarded, no-ops on an empty list, and skips
      // gracefully if the adapter is not ready yet (see autoLoadFirstEntryOnReload).
      playlistManager.autoLoadFirstEntryOnReload();

      select.addEventListener('change', (e) => {
        // claude - J1 VideoPlayer MultiInstance #6
        // Player-scope the sort-mode write (see the read note above).
        // Original (deprecated, preserved for reference):
        //   localStorage.setItem('searchMode', e.target.value);
        localStorage.setItem(_pid('searchMode'), e.target.value); // claude - J1 VideoPlayer MultiInstance #6
        playlistManager.sortPlaylist(e.target.value);
      });

      this.elements.sortSelect = select;

      const data = playlistManager.load() || [];
      if (data.length === 0) {
        select.style.display = 'none';
      }

      isDev && logger.debug('\n' + 'playlistManager: sortHandler initialized');
    }

    _ensureOptions(selectEl, canonical) {
      const existing = new Set(
        Array.from(selectEl.options).map(o => o.value)
      );

      canonical.forEach(opt => {
        if (!existing.has(opt.value)) {
          const o       = document.createElement('option');
          o.value       = opt.value;
          o.textContent = opt.label;
          selectEl.appendChild(o);

          isDev && logger.debug('\n' + `playlistSortHandler: injected missing option "${opt.value}"`);
        }
      });
    }

  } // END playlistSortHandler

  // ---------------------------------------------------------------------------
  // inputValueBackgroundHandler
  // ---------------------------------------------------------------------------
  function inputValueBackgroundHandler() {

    // claude - J1 VideoPlayer MultiInstance #1
    // Page-global one-shot guard. This handler wires DOCUMENT-level listeners
    // (input / change / animationstart / visibilitychange) plus a 500 ms
    // interval that syncs EVERY matching input on the page — it is
    // page-scoped, not player-scoped. Under the multi-instance architecture
    // this function exists once per player instance, so without a SHARED
    // guard every instance whose adapter calls it would register a duplicate
    // listener set and a duplicate interval. The guard therefore lives in the
    // shared module scope (outside createVideoPlayerInstance): the first
    // caller wins page-wide, all later instances no-op here.
    if (_sharedInputValueBackgroundHandlerInit) {
      isDev && logger.debug('\n' + 'inputValueBackgroundHandler: already initialized page-wide — skipped');
      return;
    }
    _sharedInputValueBackgroundHandlerInit = true;

    const SELECTOR = [
      'input[type="text"]',
      'input[type="search"]',
      'input[type="date"]',
      'input[type="url"]',
      'input[type="email"]',
      'input[type="tel"]',
      'input[type="number"]',
      'input:not([type])',
      'select[form="playlist"]',
      'select[form="series"]',
      'select[form="type"]',
      'textarea'
    ].join(', ');

    const BG_FILLED  = getComputedStyle(document.documentElement)
                        .getPropertyValue('--input-background').trim() || '#E1F5FE';
    const BG_EMPTY   = getComputedStyle(document.documentElement)
                        .getPropertyValue('--card-background').trim()  || '#ffffff';
    const TEXT_COLOR = getComputedStyle(document.documentElement)
                        .getPropertyValue('--text-color').trim()       || '#1d1d1f';

    function hasValue(el) {
      if (el instanceof HTMLSelectElement) {
        return el.selectedIndex > 0 || (el.value !== '' && el.value !== el.options[0]?.value);
      }
      return el.value.trim() !== '';
    }

    function syncBackground(el) {
      if (hasValue(el)) {
        el.style.setProperty('background-color', BG_FILLED, 'important');
        el.style.setProperty('color', TEXT_COLOR, 'important');
        el.dataset.valueFilled = 'true';
      } else {
        el.style.setProperty('background-color', BG_EMPTY, 'important');
        el.style.removeProperty('color');
        delete el.dataset.valueFilled;
      }
    }

    // Claude - J1 videoPlayer optimizations #2 (f)
    // Performance: syncAll() is driven by a PERMANENT setInterval(…, 500)
    // below (needed to catch browser autofill and programmatic value changes
    // that fire no input/change event). That means a full-document
    // querySelectorAll + per-element class sync twice a second for the whole
    // page lifetime — including while the tab is in the background, where the
    // work is invisible by definition. The poll now no-ops while
    // document.hidden is true; a visibilitychange listener runs one immediate
    // catch-up pass when the tab becomes visible again, so any value change
    // that happened while hidden is reflected without waiting for the next
    // tick. Foreground behaviour is completely unchanged.
    function syncAll() {
      // Claude - J1 videoPlayer optimizations #2 (f)
      if (document.hidden) return;
      document.querySelectorAll(SELECTOR).forEach(syncBackground);
    }

    // Claude - J1 videoPlayer optimizations #2 (f)
    // Immediate catch-up pass when the tab returns to the foreground.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) syncAll();
    });

    document.addEventListener('input', (e) => {
      if (e.target.matches && e.target.matches(SELECTOR)) {
        syncBackground(e.target);
      }
    }, true);

    document.addEventListener('change', (e) => {
      if (e.target.matches && e.target.matches(SELECTOR)) {
        syncBackground(e.target);
      }
    }, true);

    setTimeout(syncAll, 250);
    setInterval(syncAll, 500);

    document.addEventListener('animationstart', (e) => {
      if (e.target.matches && e.target.matches(SELECTOR)) {
        setTimeout(() => syncBackground(e.target), 50);
      }
    }, true);

    isDev && logger.debug('\n' + 'inputValueBackgroundHandler: initialized');
  }

  // ---------------------------------------------------------------------------
  // navbarSmoothScrollHandler
  // ---------------------------------------------------------------------------
  function navbarSmoothScrollHandler() {

    // claude - J1 VideoPlayer MultiInstance #1
    // Page-global one-shot guard (shared module scope — see the matching note
    // in inputValueBackgroundHandler). The nav menu is page chrome, not a
    // per-player element, so its click handlers must be registered exactly
    // once no matter how many player instances call this. The guard is only
    // SET further below, after the navMenu/anchors existence checks passed,
    // so a first caller that found no menu does not block a later one.
    if (_sharedNavbarSmoothScrollHandlerInit) {
      isDev && logger.debug('\n' + 'navbarSmoothScrollHandler: already initialized page-wide — skipped');
      return;
    }

    const navMenu = document.getElementById('navigator_nav_menu');
    if (!navMenu) {
      isDev && logger.warn('\n' + 'navbarSmoothScrollHandler: navigator_nav_menu not found');
      return;
    }

    const anchors = navMenu.querySelectorAll('a.nav-link[href^="/#"]');
    if (!anchors.length) {
      // isDev && logger.warn('\n' +  'navbarSmoothScrollHandler: no same-page anchor links found');
      return;
    }

    // claude - J1 VideoPlayer MultiInstance #1
    // All existence checks passed — mark the page-global registration done
    // before wiring the handlers (see guard at the top of this function).
    _sharedNavbarSmoothScrollHandlerInit = true;

    anchors.forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        const hash = href.replace(/^\/?/, '');

        e.preventDefault();
        e.stopPropagation();

        window.location.hash = hash;

        if (typeof j1 !== 'undefined' && typeof j1.scrollToAnchor === 'function') {
          j1.scrollToAnchor();
        } else {
          isDev && logger.warn('\n' +  'navbarSmoothScrollHandler: j1.scrollToAnchor not available');
        }
      });
    });

    isDev && logger.info('\n' + 'navbarSmoothScrollHandler: registered ' + anchors.length + ' click handler(s)');
  }

  // ---------------------------------------------------------------------------
  // initTogglePlaylistHandler
  //
  // Wires the #toggle_playlist button so that clicking it shows or hides the
  // #playlist_screen panel.  Prior to this fix the toggle handler lived
  // exclusively in the adapter, which used bare (un-suffixed) element IDs.
  // After the "Unique J1 VideoPlayer" changes every element id is suffixed
  // with _{{player.id}}, so the adapter's bare-id lookups silently failed.
  //
  // This module-level handler replaces the adapter's toggle click handler for
  // the per-player elements.  It:
  //   • resolves all ids through _pid() so multi-player pages work correctly
  //   • guards against duplicate registration with _togglePlaylistHandlerInit
  //   • delegates the early-return guard to _updateTogglePlaylistButton() so
  //     the disabled-when-empty and disabled-when-edit-open rules are respected
  //   • updates the button's icon, span label, title, and aria attributes in
  //     sync with the actual panel visibility (show ↔ hide)
  //
  // NOTE: _togglePlaylistHandlerInit is declared in the module variables section
  // (near the top of this factory) rather than here.  The original `let`
  // placement immediately before this function caused a TDZ ReferenceError
  // ("Cannot access '_togglePlaylistHandlerInit' before initialization") because
  // initTogglePlaylistHandler() is called at module init time (~line 2063),
  // before this `let` would have been reached at runtime.  See the module
  // variables section for the declaration.
  // ---------------------------------------------------------------------------
  //
  function initTogglePlaylistHandler() {
    if (_togglePlaylistHandlerInit) return;

    const btn         = document.getElementById(_pid('toggle_playlist'));
    const screen      = document.getElementById(_pid('playlist_screen'));
    const container   = document.getElementById(_pid('video_player_container'));

    if (!btn || !screen || !container) {
      isDev && logger.warn('\n' + 'initTogglePlaylistHandler: required element(s) not found — handler skipped');
      return;
    }

    _togglePlaylistHandlerInit = true;

    // claude - Modify J1 VideoPlayer #35
    // The centre header span is now a "now playing" title that is filled on
    // play by _updateHeaderTitle(). If the rendered template still seeded that
    // span with the legacy toggle label, clear the stale text so it isn't
    // shown before the first video loads. Only the known legacy labels are
    // cleared, so a real title set by an early play is never clobbered.
    const _titleSpan = container.querySelector('.video-player-header-title')
                    || container.querySelector('span');
    if (_titleSpan) {
      const _legacy = (_titleSpan.textContent || '').trim();
      if (_legacy === 'Show Playlist' || _legacy === 'Hide Playlist') {
        _titleSpan.textContent = '';
      }
    }

    btn.addEventListener('click', () => {
      // Re-check disabled state at click time (guards empty-playlist / edit-open).
      if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;

      const isVisible = screen.style.display !== 'none' && screen.style.display !== '';

      if (isVisible) {
        // --- HIDE ------------------------------------------------------------
        closePlaylist();
      } else {
        // --- SHOW ------------------------------------------------------------
        screen.style.display = 'block';

        btn.title = 'Hide playlist';
        btn.setAttribute('aria-label',    'Hide playlist');
        btn.setAttribute('aria-expanded', 'true');

        // claude - Modify J1 VideoPlayer #35
        // The centre header span (.video-player-header-title) is now a
        // "now playing" title, not the toggle label, so the legacy
        // "Hide Playlist" span write is disabled. The button's title /
        // aria-label / icon (set above and below) still signal the open state.
        // Original (deprecated, preserved for reference):
        //   const span = container.querySelector('span');
        //   if (span) span.textContent = 'Hide Playlist';
        void container;

        const img = btn.querySelector('img');
        if (img) {
          const currentSrc  = img.getAttribute('src') || '';
          const hideIconSrc = currentSrc.replace('playlist-show.svg', 'playlist-hide.svg');
          img.setAttribute('src', hideIconSrc);
          img.setAttribute('alt', 'Hide playlist');
        }

        isDev && logger.debug('\n' + 'initTogglePlaylistHandler: playlist panel shown');
      }
    });

    isDev && logger.info('\n' + 'initTogglePlaylistHandler: toggle-playlist click handler registered');
  }

  // ---------------------------------------------------------------------------
  // closePlaylist
  //
  // Hides the #playlist_screen panel and resets the #toggle_playlist button
  // to its "Show Playlist" state.  All element ids are resolved through _pid()
  // so this works correctly for every uniquely-named player on the page.
  //
  // This is the module-local implementation that replaces the adapter's
  // closePlaylist() calls; it is also exposed in the public API so the adapter
  // can delegate to it.
  // ---------------------------------------------------------------------------
  function closePlaylist() {
    const screen = document.getElementById(_pid('playlist_screen'));
    if (screen) {
      screen.style.display = 'none';
    }

    // Reset the toggle button back to the "Show Playlist" state so it is
    // always in sync with the now-hidden panel.
    _resetPlaylistToggleUI();

    isDev && logger.debug('\n' + 'closePlaylist: playlist panel closed');
  }

  // ---------------------------------------------------------------------------
  // closeEditPlaylist
  //
  // Programmatically closes the playlist edit screen and restores the
  // #video_container to the snapshot saved in `containerHTML`.  All element
  // ids are resolved through _pid().
  //
  // This mirrors the CLOSE branch of initEditPlaylistHandler so the edit
  // panel state is always consistent whether the user clicks the button or
  // whether the module closes it programmatically (e.g. from doPostOnPlaying).
  // ---------------------------------------------------------------------------
  function closeEditPlaylist() {
    const editBtn     = document.getElementById(_pid('edit_playlist'));
    const editScreen  = document.getElementById(_pid('playlist_edit_screen'));
    const videoContnr = document.getElementById(_pid('video_container'));

    // Previously this function early-returned (doing nothing) unless the
    // edit button carried data-edit-open="true".  That made a programmatic
    // call from the adapter on page load a silent no-op, so the caller could
    // not rely on closeEditPlaylist() to enforce the closed state.
    // The function is now idempotent: it always hides #playlist_edit_screen
    // and resets the #edit_playlist button to its "Manage playlists" state,
    // while the single DESTRUCTIVE step — overwriting #video_container with
    // the saved snapshot — still runs ONLY when the editor was genuinely
    // open (data-edit-open="true").
    // The wasOpen guard preserves the original protection that prevented
    // this call from wiping a live, playing video (e.g. when invoked from
    // doPostOnPlaying after a playlist card was started).
    const wasOpen = !!editBtn && editBtn.getAttribute('data-edit-open') === 'true';

    if (editScreen) {
      editScreen.style.display = 'none';
    }

    // claude - Modify J1 VideoPlayer #29
    // Under the overlay model the edit screen is positioned OVER
    // #video_container as a sibling and never replaces its contents, so the
    // snapshot-restore step below is no longer required and would, if it ran,
    // wipe a live player. The legacy "move editScreen inside container" path
    // that this restore paired with is now disabled (see initEditPlaylistHandler
    // deprecation), so this branch is gated off. Preserved (not deleted) for
    // reference. The `void` keeps `containerHTML`/`videoContnr` referenced.
    if (false && wasOpen && videoContnr && containerHTML) {
      videoContnr.innerHTML = containerHTML;
    }
    void wasOpen; void videoContnr; void containerHTML;

    // Reset button aria / title / open-marker state (idempotent).
    if (editBtn) {
      editBtn.setAttribute('aria-expanded', 'false');
      editBtn.title = 'Manage playlists';
      editBtn.setAttribute('aria-label',  'Manage playlists');
      editBtn.setAttribute('data-edit-open', 'false');
    }

    // Re-enable #toggle_playlist now that the editor is closed, delegating
    // to the guard method so the empty-playlist rule is respected.
    playlistManager._updateTogglePlaylistButton();

    isDev && logger.debug('\n' + `closeEditPlaylist: playlist edit screen closed (wasOpen=${wasOpen})`);
  }

  // ---------------------------------------------------------------------------
  // Instance API
  //
  // claude - J1 VideoPlayer MultiInstance #1
  // This object is no longer the module-global export: it is the PER-INSTANCE
  // API returned by createVideoPlayerInstance() for exactly one player. The
  // module export (see the registry section at the end of the file) hands out
  // one of these per player id via createInstance()/getInstance() and mirrors
  // the default instance's members for backward compatibility.
  //
  // claude - J1 VideoPlayer MultiInstance #2
  // Update: these members are now attached DIRECTLY to the owning VideoPlayer
  // class instance (Object.assign in the VideoPlayer constructor, see the
  // module API section at the end of the file). The default-instance mirror
  // described above has been retired — every consumer addresses a concrete
  // player id via the videoPlayer(id, options) factory, as in video.js.
  // ---------------------------------------------------------------------------
  return {
    // claude - J1 VideoPlayer MultiInstance #1
    // per-instance identification
    instanceID:                   instanceID,
    getPlayerID:                  function () { return _playerID; },

    playlistManager:              playlistManager,
    playlistIOHandler:            playlistIOHandler,
    playlistSearchHandler:        playlistSearchHandler,
    playlistModeSwitchHandler:    playlistModeSwitchHandler,
    playlistMergeSwitchHandler:   playlistMergeSwitchHandler,
    playlistLoopSwitchHandler:    playlistLoopSwitchHandler,
    playlistSortHandler:          playlistSortHandler,
    inputWrapperHandler:          inputWrapperHandler,
    inputValueBackgroundHandler:  inputValueBackgroundHandler,
    navbarSmoothScrollHandler:    navbarSmoothScrollHandler,
    initTogglePlaylistHandler:    initTogglePlaylistHandler,
    closePlaylist:                closePlaylist,
    closeEditPlaylist:            closeEditPlaylist
  };

  } // END createVideoPlayerInstance

  // claude - J1 VideoPlayer MultiInstance #2
  // ===========================================================================
  // Original #1 module (registry) API (deprecated, preserved for reference):
  // the closure-registry functions (createInstance/getInstance/hasInstance/
  // listInstances/removeInstance), the ambient DEFAULT instance and the
  // legacy lazy-getter surface. Retired because the ambient default instance
  // let a multi-player adapter silently drive every player through ONE shared
  // instance. Replaced by the video.js-aligned class/factory/registry section
  // below. Every original line follows, commented out and unchanged.
  // ===========================================================================
  //   // claude - J1 VideoPlayer MultiInstance #1
  //   // ======================================================================
  //   // Module (registry) API — this is what the UMD wrapper exports as
  //   // `videoPlayer` (browser global) / module.exports / AMD.
  //   // ======================================================================
  //
  //   // ----------------------------------------------------------------------
  //   // createInstance
  //   //
  //   // Returns the instance registered under instanceID, creating it on first
  //   // call (create-or-get, idempotent). This is the entry point a multi-player
  //   // adapter uses once per player:
  //   //
  //   //     const vp = videoPlayer.createInstance('player_1');
  //   //     vp.playlistManager.setAdapterOptions(options);
  //   //     new vp.playlistIOHandler({ ... });
  //   //
  //   // @param  {string} instanceID - player id; '' selects the default instance
  //   // @return {Object}            - the per-instance API
  //   // ----------------------------------------------------------------------
  //   function createInstance(instanceID = '') {
  //     const key = String(instanceID || '');
  //     if (_instances.has(key)) {
  //       return _instances.get(key);
  //     }
  //     const instance = createVideoPlayerInstance(key);
  //     _instances.set(key, instance);
  //     return instance;
  //   }
  //
  //   // ----------------------------------------------------------------------
  //   // getInstance
  //   //
  //   // Read-only lookup: returns the instance registered under instanceID or
  //   // null when it has not been created yet (never creates).
  //   // ----------------------------------------------------------------------
  //   function getInstance(instanceID = '') {
  //     return _instances.get(String(instanceID || '')) || null;
  //   }
  //
  //   // ----------------------------------------------------------------------
  //   // hasInstance / listInstances / removeInstance
  //   //
  //   // Registry housekeeping. removeInstance() only drops the registry
  //   // reference so the id can be re-created (e.g. SPA-style page swaps that
  //   // rebuild the player DOM); it does NOT tear down DOM listeners or dispose
  //   // the video.js player of the removed instance — a full destroy() lifecycle
  //   // is out of scope for MultiInstance #1 (the singleton had none either).
  //   // ----------------------------------------------------------------------
  //   function hasInstance(instanceID = '') {
  //     return _instances.has(String(instanceID || ''));
  //   }
  //
  //   function listInstances() {
  //     return Array.from(_instances.keys());
  //   }
  //
  //   function removeInstance(instanceID = '') {
  //     return _instances.delete(String(instanceID || ''));
  //   }
  //
  //   // ----------------------------------------------------------------------
  //   // Default (legacy) instance
  //   //
  //   // Created lazily under the empty id '' on first access of any legacy
  //   // property below. It behaves exactly like the former singleton: bare
  //   // (un-suffixed) element ids via _pid() fallback, bare 'playlist'/'index'
  //   // localStorage keys, bare MODULE_NAME logger — until/unless the adapter
  //   // calls setPlayerID(), as before.
  //   //
  //   // Timing note: the former singleton ran its init side effects (initial
  //   // load check, initEditPlaylistHandler, initTogglePlaylistHandler) at
  //   // script-load time; the default instance runs them on FIRST ACCESS of the
  //   // legacy surface instead. Adapters touch the module immediately at their
  //   // own init (setAdapterOptions / handler construction), so the effective
  //   // ordering is unchanged; pages that never touch the module now simply pay
  //   // no cost at all.
  //   // ----------------------------------------------------------------------
  //   let _defaultInstance = null;
  //
  //   function _getDefaultInstance() {
  //     if (!_defaultInstance) {
  //       _defaultInstance = createInstance('');
  //     }
  //     return _defaultInstance;
  //   }
  //
  //   const moduleAPI = {
  //     createInstance:       createInstance,
  //     getInstance:          getInstance,
  //     hasInstance:          hasInstance,
  //     listInstances:        listInstances,
  //     removeInstance:       removeInstance,
  //     getDefaultInstance:   _getDefaultInstance
  //   };
  //
  //   // ----------------------------------------------------------------------
  //   // Backward-compatible legacy surface
  //   //
  //   // Every member of the former singleton API is mirrored on the module object
  //   // through a lazy getter that delegates to the default instance. Existing
  //   // adapter code — `videoPlayer.playlistManager.…`,
  //   // `new videoPlayer.playlistIOHandler({…})`, `videoPlayer.closePlaylist()`,
  //   // etc. — keeps working with zero changes on single-player pages.
  //   // ----------------------------------------------------------------------
  //   const LEGACY_INSTANCE_KEYS = [
  //     'playlistManager',
  //     'playlistIOHandler',
  //     'playlistSearchHandler',
  //     'playlistModeSwitchHandler',
  //     'playlistMergeSwitchHandler',
  //     'playlistLoopSwitchHandler',
  //     'playlistSortHandler',
  //     'inputWrapperHandler',
  //     'inputValueBackgroundHandler',
  //     'navbarSmoothScrollHandler',
  //     'initTogglePlaylistHandler',
  //     'closePlaylist',
  //     'closeEditPlaylist'
  //   ];
  //
  //   LEGACY_INSTANCE_KEYS.forEach(function (key) {
  //     Object.defineProperty(moduleAPI, key, {
  //       configurable: true,
  //       enumerable:   true,
  //       get:          function () { return _getDefaultInstance()[key]; }
  //     });
  //   });
  //
  //   return moduleAPI;

  // claude - J1 VideoPlayer MultiInstance #2
  // ===========================================================================
  // Module API — video.js-aligned multi-instance architecture
  //
  // This section is what the UMD wrapper exports as `videoPlayer` (browser
  // global) / module.exports / AMD. The export is now the CALLABLE
  // create-or-get factory videoPlayer(id, options) — the exact structure of
  // the global videojs(id, options) function of the videoJS module — backed
  // by the VideoPlayer class (video.js: Player) and its static instance
  // registry VideoPlayer.players (video.js: Player.players).
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // claude - J1 VideoPlayer MultiInstance #2
  // class VideoPlayer — the per-player instance class (video.js: class Player)
  //
  // The constructor builds the complete per-player implementation by running
  // createVideoPlayerInstance(id) — all state, the PlaylistManager and every
  // handler class live in the members it returns — and attaches those members
  // to the class instance, the same way a video.js Player constructor creates
  // and attaches its child components. The instance then registers itself in
  // the static VideoPlayer.players registry.
  //
  // Do NOT call `new VideoPlayer()` from adapter code — use the videoPlayer()
  // factory below (create-or-get), exactly like the global videojs() factory.
  // ---------------------------------------------------------------------------
  class VideoPlayer {

    constructor(playerId = '', options = null) {
      const id = String(playerId || '');

      // duplicate protection: the factory normally prevents this; guard the
      // direct-constructor path as well (video.js errors on re-initialising
      // an element that already owns a player)
      if (VideoPlayer.players[id]) {
        throw new Error(
          `videoPlayer: instance "${id}" already exists — ` +
          'use the videoPlayer(id) factory (create-or-get) instead of new VideoPlayer()'
        );
      }

      // per-instance identification (video.js: player.id_ / player.options_)
      this.id_      = id;
      this.options_ = options || null;

      // Build the per-player implementation (state, PlaylistManager, handler
      // classes, public methods) and attach all members to this instance.
      // The members are self-contained closures over the instance id, so no
      // `this` re-binding is required here.
      Object.assign(this, createVideoPlayerInstance(id));

      // Apply adapter/player options when handed to the factory (video.js
      // parity: videojs(id, options) applies options on creation). The
      // adapter's later explicit setAdapterOptions() call stays valid — the
      // method is an idempotent assignment.
      if (options) {
        this.playlistManager.setAdapterOptions(options);
      }

      // register AFTER a fully successful build so a constructor exception
      // can never leave a half-built instance in the registry
      VideoPlayer.players[id] = this;
    }

    // video.js parity accessors
    id()      { return this.id_; }
    options() { return this.options_; }

    // -------------------------------------------------------------------------
    // dispose()
    // Removes this instance from the registry so its id can be re-created
    // (e.g. SPA-style page swaps that rebuild the player DOM).
    //
    // NOTE (unchanged limitation, carried over from #1 removeInstance()):
    // DOM listeners and the underlying video.js player of this instance are
    // NOT torn down here — a full destroy() lifecycle is out of scope for
    // MultiInstance #2 (the singleton never had one either). Flagged for a
    // future numbered fix.
    // -------------------------------------------------------------------------
    dispose() {
      delete VideoPlayer.players[this.id_];
    }

  } // END class VideoPlayer

  // claude - J1 VideoPlayer MultiInstance #2
  // Static instance registry, keyed by player id (video.js: Player.players).
  // Object.create(null) avoids prototype-key collisions for ids like
  // 'toString' (same rationale as _autoLoadFirstOnReloadDoneByPid, see #43).
  VideoPlayer.players = Object.create(null);

  // ---------------------------------------------------------------------------
  // claude - J1 VideoPlayer MultiInstance #2
  // videoPlayer() — the module factory and the module export
  //
  // Mirrors the global videojs(id, options) function: returns the already
  // registered instance for `playerId` when one exists (create-or-get),
  // otherwise creates, registers and returns a new VideoPlayer. Options
  // passed for an ALREADY EXISTING instance are ignored, as in video.js.
  //
  // Adapter usage (see adapter/js/videoPlayer.js, MultiInstance #2):
  //
  //     const vp = videoPlayer(playerId, options);   // create-or-get
  //     vp.playlistManager.setPlayerID(playerId);
  //     new vp.playlistIOHandler(options);
  //     ...
  // ---------------------------------------------------------------------------
  function videoPlayer(playerId = '', options = null) {
    const id       = String(playerId || '');
    const existing = VideoPlayer.players[id];

    if (existing) {
      return existing;
    }
    return new VideoPlayer(id, options);
  }

  // claude - J1 VideoPlayer MultiInstance #2
  // video.js-parity module surface
  videoPlayer.VERSION     = VERSION;                    // videojs.VERSION
  videoPlayer.VideoPlayer = VideoPlayer;                // instance class export
  videoPlayer.players     = VideoPlayer.players;        // live registry reference

  videoPlayer.getPlayer = function (playerId = '') {
    return VideoPlayer.players[String(playerId || '')] || null;
  };

  videoPlayer.getPlayers = function () {
    return VideoPlayer.players;
  };

  // ---------------------------------------------------------------------------
  // claude - J1 VideoPlayer MultiInstance #2
  // Deprecated #1 registry API — thin compatibility aliases
  //
  // Kept so any remaining #1-style caller keeps working against the ONE new
  // registry (a second, diverging registry must never exist). New code uses
  // the factory / getPlayer() / getPlayers() / dispose() instead. Note that
  // the ambient DEFAULT instance ('' auto-creation via property getters) is
  // intentionally NOT carried over — it caused the multi-player failure.
  // ---------------------------------------------------------------------------

  // deprecated -> videoPlayer(id)
  videoPlayer.createInstance = function (instanceID = '') {
    return videoPlayer(instanceID);
  };

   // deprecated -> getPlayer(id)
  videoPlayer.getInstance = function (instanceID = '') {
    return videoPlayer.getPlayer(instanceID);
  };

  // deprecated -> !!getPlayer(id)
  videoPlayer.hasInstance = function (instanceID = '') { 
    return !!videoPlayer.getPlayer(instanceID);
  };

  // deprecated -> Object.keys(players)
  videoPlayer.listInstances = function () {
    return Object.keys(VideoPlayer.players);
  };

  // deprecated -> vp.dispose()
  videoPlayer.removeInstance = function (instanceID = '') {
    const vp = videoPlayer.getPlayer(instanceID);
    if (!vp) { return false; }
    vp.dispose();
    return true;
  };

  // claude - J1 VideoPlayer MultiInstance #2
  // The callable factory is the module export (video.js: the global videojs
  // function). Replaces the former `return moduleAPI;` preserved above.
  //
  return videoPlayer;

}));