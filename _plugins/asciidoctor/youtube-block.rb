# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/youtube-block.rb
# Asciidoctor extension for YouTube Video
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
# A block macro that embeds a video from the YouTube platform
# into the output document
#
# Usage:
#
#   youtube::video_id[poster="full_image_path" theme="vjs_theme_name" role="CSS classes"]
#
# Example:
#
#   .Video title
#   youtube::nV8UZJNBY6Y[poster="/assets/images/icons/videojs/videojs-poster.png" theme="city" role="mt-5 mb-5"]
#
# ------------------------------------------------------------------------------
# See:
# https://www.tutorialspoint.com/creating-a-responsive-video-player-using-video-js
# ------------------------------------------------------------------------------
# NOTE
# Bei YouTube Nocookie handelt es sich um einen Code zum
# Einbetten inklusive entsprechender URL, der es Webseitenbetreibern
# erlaubt, Videos ohne Tracking Cookies auf ihren Webseiten zu
# integrieren. Der Code muss für jedes eingebettete Video generiert
# und eingefügt werden.
#
# See: https://www.datenschutz.org/youtube-nocookie/
# ------------------------------------------------------------------------------

Asciidoctor::Extensions.register do

  class YouTubeBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :youtube
    name_positional_attributes 'poster', 'theme', 'role'
    default_attrs 'poster' => '/assets/images/icons/videojs/videojs-poster.png',
                  'theme' => 'uno',
                  'role' => 'mt-3 mb-3'

    def process parent, target, attributes

      chars         = [('a'..'z'), ('A'..'Z'), ('0'..'9')].map(&:to_a).flatten
      video_id      = (0...11).map { chars[rand(chars.length)] }.join

      title_html    = (attributes.has_key? 'title') ? %(<div class="video-title">#{attributes['title']}</div>\n) : nil
      poster_image  = (poster = attributes['poster']) ? %(#{poster}) : nil
      theme_name    = (theme  = attributes['theme'])  ? %(#{theme}) : nil

      html = %(
        <div class="youtube-player #{attributes['role']}">
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
              "techOrder": [
                "youtube", "html5"
              ],
              "sources": [{
                "type": "video/youtube",
                "src": "//youtube-nocookie.com/watch?v=#{target}"
              }],
              "controlBar": {
                "pictureInPictureToggle": false
              }
            }'
          > </video>
        </div>
      )
      create_pass_block parent, html, attributes, subs: nil
    end
  end

  block_macro YouTubeBlockMacro
end
