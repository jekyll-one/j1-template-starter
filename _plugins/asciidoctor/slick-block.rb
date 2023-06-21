# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/slick-block.rb
# Asciidoctor extension for J1 Slick (Carousel)
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2023 Juergen Adams
#
# J1 Theme is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
#
# ------------------------------------------------------------------------------
require 'asciidoctor/extensions' unless RUBY_ENGINE == 'opal'
include Asciidoctor

# ------------------------------------------------------------------------------
# A block macro that embeds a (Slick) Slider (parent) block
# into the output document
#
# Usage:
#
#   slick::slider_id[role="additional classes"]
#
# Example:
#
#   .The slider title
#   slick::image_slider[role="mt-3 mb-5"]
#
# ------------------------------------------------------------------------------
Asciidoctor::Extensions.register do

  class SlickBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :slick
    name_positional_attributes 'role'

    def process parent, target, attrs

      title_html  = (attrs.has_key? 'title') ? %(<div class="slider-title notranslate">#{attrs['title']}</div>\n) : nil
      html = %(#{title_html} <div id="#{target}_parent" class="slider-parent #{attrs['role']}"></div>)
      create_pass_block parent, html, attrs, subs: nil
    end
  end

  block_macro SlickBlockMacro

end
