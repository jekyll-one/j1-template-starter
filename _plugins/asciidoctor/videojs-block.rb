# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/video-block.rb
# Asciidoctor extension for local J1 HTML5 Video
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2023 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
#
# ------------------------------------------------------------------------------
require 'asciidoctor/extensions' unless RUBY_ENGINE == 'opal'
include Asciidoctor

# ------------------------------------------------------------------------------
# A block macro that embeds a local video into the output document
#
# Usage:
#
#   video::video_path[poster="full_image_path" theme="vjs_theme_name" role="CSS classes"]
#
# Example:
#
#   .Video title
#   video::nV8UZJNBY6Y[poster="/assets/images/icons/videojs/videojs-poster.png" theme="city" role="mt-5 mb-5"]
#
# ------------------------------------------------------------------------------
# See:
# https://www.tutorialspoint.com/creating-a-responsive-video-player-using-video-js
# ------------------------------------------------------------------------------

Asciidoctor::Extensions.register do

  class VideoJSBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :videojs
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
                "pictureInPictureToggle": false
              }
            }'
          > </video>
        </div>
      )
      create_pass_block parent, html, attributes, subs: nil
    end
  end

  block_macro VideoJSBlockMacro
end
