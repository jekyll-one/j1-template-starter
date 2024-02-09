# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/wistia-block.rb
# Asciidoctor extension for Wistia Video
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
# A block macro that embeds a video from the Wistia platform
# into the output document
#
# Usage:
#
#   wistia::video_id[theme="vjs_theme_name" role="CSS classes"]
#
# Example:
#
#   .Video title
#   wistia::29b0fbf547[theme="city" role="mt-5 mb-5"]
#
# ------------------------------------------------------------------------------
# See:
# https://www.tutorialspoint.com/creating-a-responsive-video-player-using-video-js
# ------------------------------------------------------------------------------

Asciidoctor::Extensions.register do

  class WistiaBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :wistia
    name_positional_attributes 'theme', 'role'
    default_attrs 'theme' => 'uno',
                  'role' => 'mt-3 mb-3'

    def process parent, target, attributes

      chars         = [('a'..'z'), ('A'..'Z'), ('0'..'9')].map(&:to_a).flatten
      video_id      = (0...11).map { chars[rand(chars.length)] }.join
      title_html    = (attributes.has_key? 'title') ? %(<div class="video-title">#{attributes['title']}</div>\n) : nil
      theme_name    = (theme = attributes['theme'])  ? %(#{theme}) : nil

      html = %(
        <div class="wistia-player #{attributes['role']}">
          #{title_html}
          <video
            id="#{video_id}"
            class="video-js vjs-theme-#{theme_name}"
            controls
            width="640" height="360"
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
                "pictureInPictureToggle": false
              }
            }'
          > </video>
        </div>
      )

      create_pass_block parent, html, attributes, subs: nil
    end
  end

  block_macro WistiaBlockMacro
end
