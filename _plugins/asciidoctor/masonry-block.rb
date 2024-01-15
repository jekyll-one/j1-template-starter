# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/slick-block.rb
# Asciidoctor extension for J1 Slick (Carousel)
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

  class MasonryBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :masonry
    name_positional_attributes 'role'
    default_attributes 'role' => 'mt-3 mb-3'

    def process parent, target, attributes

      title_html  = (attributes.has_key? 'title') ? %(<div class="masonry-title">#{attributes['title']}</div>\n) : nil
      html        = %(
        <div class="#{attributes['role']}">
          #{title_html}
          <div id="#{target}_parent" class="masonry masonry-parent"></div>
        </div>
      )

      create_pass_block parent, html, attributes, subs: nil
    end
  end

  block_macro MasonryBlockMacro
end
