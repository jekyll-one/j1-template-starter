# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/gallery-block.rb
# Asciidoctor extension for J1 Galleries
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2023 Juergen Adams
#
# J1 Theme is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
# ------------------------------------------------------------------------------
require 'asciidoctor/extensions' unless RUBY_ENGINE == 'opal'
include Asciidoctor

# A block macro that embeds a Gallery block into the output document
#
# Usage
#
#   gallery::gallery_id[role="additional classes"]
#
# Example:
#
#   .The gallery title
#   gallery::jg_live_demo[]
#
Asciidoctor::Extensions.register do

  class ImageBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :gallery
    name_positional_attributes 'role'

    def process parent, target, attrs
      title_html  = (attrs.has_key? 'title') ? %(<div class="gallery-title">#{attrs['title']}</div>\n) : nil
      html = %(#{title_html} <div id="#{target}" class="gallery #{attrs['role']}"></div>)
      create_pass_block parent, html, attrs, subs: nil
    end
  end

  block_macro ImageBlockMacro

end
