# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/gist-block.rb
# Asciidoctor extension for J1 Theme
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

# A block macro that embeds a Gist into the output document
#
# Usage
#
#   gist::12345[]
#
# Example:
#
#   .Guard setup to live preview AsciiDoc output
#   gist::mojavelinux/5546622[]
#
Asciidoctor::Extensions.register do

  class GistBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :gist
    name_positional_attributes 'role'
    default_attrs 'role' => 'mt-3 mb-3'

    def process parent, target, attributes

      title_html  = (attributes.has_key? 'title') ? %(<div class="title notranslate">#{attributes['title']}</div>\n) : nil
      html        = %(
        <div class="#{attributes['role']}">
          <div class="openblock gist">
             #{title_html}
             <div class="content">
               <script src="https://gist.github.com/#{target}.js"></script>
             </div>
          </div>
        </div>
      )

      create_pass_block parent, html, attributes, subs: nil
    end
  end

  block_macro GistBlockMacro
end
