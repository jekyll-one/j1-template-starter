# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/carousel-block.rb
# Asciidoctor extension for J1 Carousel (Owl Carousel)
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

# A block macro that embeds a Carousel block into the output document
#
# Usage
#
#   carousel::carousel_id[role="additional classes"]
#
# Example:
#
#   .Carousel title
#   carousel::owl_demo_simple[role="mb-5"]
#
Asciidoctor::Extensions.register do

  class ImageBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :carousel
    name_positional_attributes 'role'
    default_attrs 'role' => 'mt-3 mb-3'

    def process parent, target, attributes

      title_html  = (attributes.has_key? 'title') ? %(<div class="carousel-title">#{attributes['title']}</div>\n) : nil
      html        = %(
        <div class="#{attributes['role']}">
          #{title_html}
          <div id="#{target}" class="slider"></div>
        </div>
      )

      create_pass_block parent, html, attributes, subs: nil
    end
  end

  block_macro ImageBlockMacro
end
