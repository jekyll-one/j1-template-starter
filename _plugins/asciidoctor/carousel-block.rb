# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/carousel-block.rb
# Asciidoctor extension for J1 Carousel (Owl Carousel)
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

# A block macro that embeds a Carousel block into the output document
#
# Usage
#
#   carousel::carousel:id[role="additional classes"]
#
# Example:
#
#   .The carousel title
#   carousel::owl_demo_simple[role="mb-5"]
#
Asciidoctor::Extensions.register do

  class ImageBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :carousel
    name_positional_attributes 'role'

    def process parent, target, attrs

      title_html  = (attrs.has_key? 'title') ? %(<div class="carousel-title">#{attrs['title']}</div>\n) : nil
      html = %(#{title_html} <div id="#{target}" class="#{attrs['role']}"></div>)
      create_pass_block parent, html, attrs, subs: nil
    end
  end

  block_macro ImageBlockMacro

end
