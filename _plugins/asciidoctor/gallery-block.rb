# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/gallery-block.rb
# Asciidoctor extension for J1 Galleries
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

# A block macro that embeds a Gallery block into the output document
#
# Usage
#
#   gallery::gallery_id[role="additional classes"]
#
# Example:
#
#   .The gallery title
#   gallery::jg_live_demo[role="mt-4 mb-5"]
#
Asciidoctor::Extensions.register do

  class ImageBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :gallery
    name_positional_attributes 'role'
    default_attrs 'role' => 'mt-4 mb-4'

    def process parent, target, attributes

      title_html = (attributes.has_key? 'title') ? %(<div class="gallery-title"> <i class="mdib mdib-collage mdib-24px mr-2"></i> #{attributes['title']} </div>\n) : nil

      html = %(
        <div class="#{attributes['role']}">
          #{title_html}
          <div id="#{target}_parent" class="gallery"></div>
        </div>
      )

      create_pass_block parent, html, attributes, subs: nil
    end
  end

  block_macro ImageBlockMacro
end
