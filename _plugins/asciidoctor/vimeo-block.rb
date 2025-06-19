# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/vimeo-block.rb
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
#   vimeo::video_id[poster="image" theme="vjs_theme" role="CSS classes"]
#
# Example:
#
#   .Video title
#   vimeo::179528528[theme="city" role="mt-5 mb-5"]
#
# ------------------------------------------------------------------------------
# See:
# https://www.tutorialspoint.com/creating-a-responsive-video-player-using-video-js
# ------------------------------------------------------------------------------

Asciidoctor::Extensions.register do

  class VimeoBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :vimeo
    name_positional_attributes 'caption', 'poster', 'theme', 'role'
    default_attrs 'caption' => 'true',
                  'poster' => '/assets/video/poster/vimeo/banner/vimeo-blue.jpg',
                  'theme' => 'uno',
                  'role' => 'mt-3 mb-3'

    def process parent, target, attributes

      chars           = [('a'..'z'), ('A'..'Z'), ('0'..'9')].map(&:to_a).flatten
      video_id        = (0...11).map {chars[rand(chars.length)]}.join

      title_html      = (attributes.has_key? 'title') ? %(<div class="video-title"> <i class="mdib mdib-video mdib-24px mr-2"></i> #{attributes['title']} </div>\n) : nil
      poster_image    = (poster = attributes['poster']) ? %(#{poster}) : nil
      theme_name      = (theme = attributes['theme']) ? %(#{theme}) : nil
      caption_enabled = (caption  = attributes['caption'])  ? true : false

      poster_attr     = %(poster="#{poster_image}")
      if attributes['poster'] == 'auto'
        poster_attr = ''
      end

      html = %(
        <div class="vimeo-player bottom #{attributes['role']}">
          #{title_html}
          <video
            id="#{video_id}"
            class="video-js vjs-theme-#{theme_name}"
            width="640" height="360"
            #{poster_attr}
            alt="#{attributes['title']}"
            aria-label="#{attributes['title']}"
            data-setup='{
              "fluid" : true,
              "techOrder": [
                "vimeo", "html5"
              ],
              "sources": [{
                "type": "video/vimeo",
                "src": "//vimeo.com/#{target}"
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

            var dependencies_met_page_ready = setInterval (function (options) {
              var pageState      = $('#content').css("display");
              var pageVisible    = (pageState == 'block') ? true : false;
              var j1CoreFinished = (j1.getState() === 'finished') ? true : false;

              if (j1CoreFinished && pageVisible) {
                if ('#{caption_enabled}' === 'true') {
                  addCaptionAfterImage('#{poster_image}');
                }

                // scroll to player top position
                // -------------------------------------------------------------
                var vjs_player = document.getElementById("#{video_id}");

                vjs_player.addEventListener('click', function(event) {
                  event.preventDefault();
                  event.stopPropagation();

                  var scrollOffset = (window.innerWidth >= 720) ? -130 : -110;

                  // scroll player to top position
                  const targetDiv         = document.getElementById("#{video_id}");
                  const targetDivPosition = targetDiv.offsetTop;
                  window.scrollTo(0, targetDivPosition + scrollOffset);
                }); // END EventListener 'click'

                clearInterval(dependencies_met_page_ready);
              }
            }, 10);
          });
        </script>
      )

      create_pass_block parent, html, attributes, subs: nil
    end
  end

  block_macro VimeoBlockMacro
end
