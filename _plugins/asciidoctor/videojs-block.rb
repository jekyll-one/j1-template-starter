# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/video-block.rb
# Asciidoctor extension for local HTML5 Video
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2023, 2024 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
# ------------------------------------------------------------------------------
require 'asciidoctor/extensions' unless RUBY_ENGINE == 'opal'
include Asciidoctor

# ------------------------------------------------------------------------------
# A block macro that embeds a local video using VideoJS into the output document
#
# Usage:
#
#   .Title
#   video::video_path[start="hh:mm:ss" poster="full_image_path" theme="vjs_theme_name" zoom="true|false" role="CSS classes"]
#
# Example:
#
#   .MP4 Video, Rolling Wild
#   videojs::/assets/videos/gallery/html5/video2.mp4[start="00:00:50" poster="/assets/videos/gallery/video1-poster.jpg" role="mt-4 mb-5"]
#
# ------------------------------------------------------------------------------
# See:
# https://www.tutorialspoint.com/creating-a-responsive-video-player-using-video-js
# ------------------------------------------------------------------------------

Asciidoctor::Extensions.register do

  class VideoJSBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :videojs
    name_positional_attributes 'start', 'poster', 'theme', 'zoom', 'role'
    default_attrs 'start' => '00:00:00',
                  'poster' => '/assets/videos/gallery/videojs-poster.png',
                  'theme' => 'uno',
                  'zoom' => false,
                  'role' => 'mt-3 mb-3'

    def process parent, target, attributes

      chars         = [('a'..'z'), ('A'..'Z'), ('0'..'9')].map(&:to_a).flatten
      video_id      = (0...11).map { chars[rand(chars.length)] }.join

      title_html    = (attributes.has_key? 'title') ? %(<div class="video-title">#{attributes['title']}</div>\n) : nil
      poster_image  = (poster = attributes['poster']) ? %(#{poster}) : nil
      theme_name    = (theme  = attributes['theme'])  ? %(#{theme}) : nil

      html = %(
        <div class="videojs-player #{attributes['role']}">
          #{title_html}
          <video
            id="#{video_id}"
            class="video-js vjs-theme-#{theme_name}"
            controls
            width="640" height="360"
            poster="#{poster_image}"
            aria-label="#{attributes['title']}"
            data-setup='{
              "fluid" : true,
              "sources": [{
                "type": "video/mp4",
                "src": "#{target}"
              }],
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
            var dependencies_met_page_ready = setInterval (function (options) {
              var pageState   = $('#no_flicker').css("display");
              var pageVisible = (pageState == 'block') ? true : false;

              if (j1.getState() === 'finished' && pageVisible) {
                videojs("#{video_id}").ready(function() {
                  var videojsPlayer = this;
                  videojsPlayer.on("play", function() {
                    var startFromSecond = new Date('1970-01-01T' + "#{attributes['start']}" + 'Z').getTime() / 1000;
                    videojsPlayer.currentTime(startFromSecond);
                  });
                });
                clearInterval(dependencies_met_page_ready);
              }
            }, 10);
          });
        </script>
      )

      create_pass_block parent, html, attributes, subs: nil
    end
  end

  block_macro VideoJSBlockMacro
end
