# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/wistia-block.rb
# Asciidoctor extension for Vimeo Video
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2023-2025 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE
# ------------------------------------------------------------------------------
require 'asciidoctor/extensions' unless RUBY_ENGINE == 'opal'
include Asciidoctor

# ------------------------------------------------------------------------------
# A block macro that embeds a video from the Vimeo platform
# into the output document
#
# Usage:
#
#   wistia::video_id[theme="vjs_theme_name" role="CSS classes"]
#
# Example:
#
#   .Video title
#   wistia::179528528[theme="city" role="mt-5 mb-5"]
#
# ------------------------------------------------------------------------------
# See:
# https://www.tutorialspoint.com/creating-a-responsive-video-player-using-video-js
# ------------------------------------------------------------------------------

Asciidoctor::Extensions.register do

  class WistiaBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :wistia
    name_positional_attributes 'caption', 'start','poster', 'theme', 'custom_buttons', 'role'
    default_attrs 'caption' => 'true',
                  'start' => '00:00:00',
                  'poster' => '/assets/video/poster/wistia/wistia-blue.jpg',
                  'theme' => 'uno',
                  'custom_buttons' => true,
                  'role' => 'mt-3 mb-3'

    def process parent, target, attributes

      # ========================================================================
      # load VideoJS configuration data
      # ------------------------------------------------------------------------
      # NOTE:
      # Settings folder _data is NOT available in the website
      #-------------------------------------------------------------------------
      current_path                = File.expand_path(Dir.getwd)
      default_config_path         = File.join(current_path, '/_data/modules/defaults')
      user_config_path            = File.join(current_path, '/_data/modules')

      videojs_config_file_name    = 'videojs.yml'
      videojs_default_config_file = File.join(default_config_path, videojs_config_file_name)
      videojs_user_config_file    = File.join(user_config_path, videojs_config_file_name)

      videojsDefaultSettings      = YAML::load(File.open(videojs_default_config_file))
      videojsUserSettings         = YAML::load(File.open(videojs_user_config_file))
      videojsDefaultSettingsJson  = videojsDefaultSettings.to_json;
      videojsUserSettingsJson     = videojsUserSettings.to_json;

      # ========================================================================
      # set plugin specific data
      # ------------------------------------------------------------------------
      #
      chars           = [('a'..'z'), ('A'..'Z'), ('0'..'9')].map(&:to_a).flatten
      video_id        = (0...11).map { chars[rand(chars.length)] }.join

      title_html      = (attributes.has_key? 'title') ? %(<div class="video-title">#{attributes['title']}</div>\n) : nil
      poster_image    = (poster = attributes['poster']) ? %(#{poster}) : nil
      theme_name      = (theme = attributes['theme']) ? %(#{theme}) : nil
      caption_enabled = (caption = attributes['caption'])  ? true : false
      custom_buttons  = (custom_buttons = attributes['custom_buttons']) ? %(#{custom_buttons}) : nil
      poster_attr     = %(poster="#{poster_image}")

      if attributes['poster'] == 'auto'
        poster_attr = ''
      end

      html = %(
        <div class="wistia-player #{attributes['role']}">
          #{title_html}
          <video
            id="#{video_id}"
            class="video-js vjs-theme-#{theme_name}"
            width="640" height="360"
            #{poster_attr}
            aria-label="#{attributes['title']}"
            data-setup='{
              "fluid" : true,
              "techOrder": [
                "wistia", "html5"
              ],
              "sources": [{
                "type": "video/wistia",
                "src": "#{target}"
              }],
              "wistia": {
                "playback_css_class": "wistia_embed wistia_async_29b0fbf547",
                "autoplay": false
              },
              "controlBar": {
                "pictureInPictureToggle": false,
                "volumePanel": {
                  "inline": false
                }                
              }
            }'
          > </video>
        </div>

        <script>
        $(function() {

        // =================================================================
        // take over VideoJS configuration data (JSON data from Ruby)
        // -----------------------------------------------------------------            
        var videojsDefaultConfigJson = '#{videojsDefaultSettingsJson}';
        var videojsUserConfigJson    = '#{videojsUserSettingsJson}';

        // =================================================================
        // create config objects from JSON data
        // -----------------------------------------------------------------             
        var videojsDefaultSettings   = JSON.parse(videojsDefaultConfigJson);
        var videojsUserSettings      = JSON.parse(videojsUserConfigJson);

        // merge config objects (jQuery)
        var videojsConfig = $.extend(true, {}, videojsDefaultSettings.defaults, videojsUserSettings.settings);

        // =================================================================
        // VideoJS player settings
        // -----------------------------------------------------------------
        const vjsPlayerType     = 'ytp';
        const vjsPlaybackRates  = videojsConfig.playbackRates.values;          

        // =================================================================
        // VideoJS plugin settings
        // ----------------------------------------------------------------- 
        const piAutoCaption     = videojsConfig.plugins.autoCaption;
        const piHotKeys         = videojsConfig.plugins.hotKeys;
        const piSkipButtons     = videojsConfig.plugins.skipButtons;
        const piZoomButtons     = videojsConfig.plugins.zoomButtons;

        // =================================================================
        // helper functions
        // -----------------------------------------------------------------            
        function addCaptionAfterImage(imageSrc) {
            const image = document.querySelector(`img[src="${imageSrc}"]`);

            if (image) {
            // create div|caption container
            const newDiv = document.createElement('div');
            newDiv.classList.add('caption');
            newDiv.textContent = '#{attributes['title']}';

            // insert div|caption container AFTER the image
            image.parentNode.insertBefore(newDiv, image.nextSibling);
            } else {
            console.error(`Kein Bild mit src="${imageSrc}" gefunden.`);
            }
        }

        // =================================================================
        // initialize the VideoJS player (on page ready)
        // -----------------------------------------------------------------             
        var dependencies_met_page_ready = setInterval (function (options) {
            var pageState      = $('#content').css("display");
            var pageVisible    = (pageState == 'block') ? true : false;
            var j1CoreFinished = (j1.getState() === 'finished') ? true : false;

            if (j1CoreFinished && pageVisible) {
            var vjs_player  = document.getElementById("#{video_id}");

            // add|skip captions (on poster image)
            if ('#{caption_enabled}' === 'true') {
                addCaptionAfterImage('#{poster_image}');
            }

            // scroll page to the players top position
            // -------------------------------------------------------------
            vjs_player.addEventListener('click', function(event) {
                const targetDiv         = document.getElementById("#{video_id}");
                const targetDivPosition = targetDiv.offsetTop;
                var scrollOffset        = (window.innerWidth >= 720) ? -130 : -110;

                // scroll player to top position
                window.scrollTo(0, targetDivPosition + scrollOffset);
            }); // END EventListener 'click'

            clearInterval(dependencies_met_page_ready);
            }
        }, 10);

        // customize the yt player (already) created
        // -----------------------------------------------------------------
        var dependencies_met_vjs_player_exist = setInterval (function (options) {
            var vjsPlayerExist          = document.getElementById("#{video_id}") ? true : false;
            var vjsPlayerCustomButtons  = ("#{custom_buttons}" === 'true') ? true : false;

            if (vjsPlayerExist && vjsPlayerCustomButtons) {
            // apply player customization on 'player ready'
            videojs("#{video_id}").ready(function() {
                var vjsPlayer = this;

                // add|skip playbackRates
                //
                if (videojsConfig.playbackRates.enabled) {
                vjsPlayer.playbackRates(vjsPlaybackRates);
                }

                // add|skip hotKeys plugin
                //
                if (piHotKeys.enabled) {
                vjsPlayer.hotKeys({
                    volumeStep:                         piHotKeys.volumeStep,
                    seekStep:                           piHotKeys.seekStep,
                    enableMute:                         piHotKeys.enableMute,
                    enableFullscreen:                   piHotKeys.enableFullscreen,
                    enableNumbers:                      piHotKeys.enableNumbers,
                    enableVolumeScroll:                 piHotKeys.enableVolumeScroll,
                    enableHoverScroll:                  piHotKeys.enableHoverScroll,
                    alwaysCaptureHotkeys:               piHotKeys.alwaysCaptureHotkeys,
                    captureDocumentHotkeys:             piHotKeys.captureDocumentHotkeys,
                    documentHotkeysFocusElementFilter:  e => e.tagName.toLowerCase() === "body",

                    // Mimic VLC seek behavior (default to: 15)
                    seekStep: function(e) {
                    if (e.ctrlKey && e.altKey) {
                        return 5*60;
                    } else if (e.ctrlKey) {
                        return 60;
                    } else if (e.altKey) {
                        return 10;
                    } else {
                        return 15;
                    }
                    },

                    // Enhance existing simple hotkey by complex hotkeys
                    fullscreenKey: function(e) {
                    // fullscreen with the F key or Ctrl+Enter
                    return ((e.which === 70) || (e.ctrlKey && e.which === 13));
                    },  

                }); // END VideoJS hotKeys plugin
                }

                // add|skip skipButtons plugin
                if (piSkipButtons.enabled) {
                var backwardIndex = piSkipButtons.backward;
                var forwardIndex  = piSkipButtons.forwardIndex;

                // property 'surroundPlayButton' takes precendence
                //
                if (piSkipButtons.surroundPlayButton) {
                    var backwardIndex = 0;
                    var forwardIndex  = 1;
                }

                vjsPlayer.skipButtons({
                    backwardIndex:  backwardIndex,
                    forwardIndex:   forwardIndex,
                    backward:       piSkipButtons.backward,
                    forward:        piSkipButtons.forward,
                });
                }

                // add|skip zoomButtons plugin
                if (piZoomButtons.enabled && vjsPlayerType === 'native') {
                    vjsPlayer.zoomButtons({
                        moveX:  piZoomButtons.moveX,
                        moveY:  piZoomButtons.moveY,
                        rotate: piZoomButtons.rotate,
                        zoom:   piZoomButtons.zoom
                    });                    
                }

                // set start position of current video (on play)
                // -----------------------------------------------------------
                var appliedOnce = false;
                vjsPlayer.on("play", function() {
                var startFromSecond = new Date('1970-01-01T' + "#{attributes['start']}" + 'Z').getTime() / 1000;
                if (!appliedOnce) {
                    vjsPlayer.currentTime(startFromSecond);
                    appliedOnce = true;
                }
              });

            }); // END yt player ready (set custom controls)

            clearInterval(dependencies_met_vjs_player_exist);
            } // END if 'vjsPlayerExist'

        }, 10); // END 'dependencies_met_vjs_player_exist'

        }); // END 'document ready'

      </script>
      )

      create_pass_block parent, html, attributes, subs: nil
    end
  end

  block_macro WistiaBlockMacro
end