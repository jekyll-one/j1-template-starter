# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/iframe-block.rb
# Asciidoctor extension for the J1 iFramer module
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

# A block macro that embeds a iframe block into the output document
#
# Usage
#
#   iframe::iframe_id[role="additional classes"]
#
# Example:
#
#   iframe::magic_iframe[role="mt-4 mb-5"]
#
Asciidoctor::Extensions.register do

  class IFrameBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :iframe
    name_positional_attributes 'role'
    default_attrs 'role' => 'mt-4 mb-4'

    def process parent, target, attributes
      html = %(
        <p id="resize_stats"></p>
        <div id="#{target}_parent" class="iframe #{attributes['role']}"></div>
      )

      create_pass_block parent, html, attributes, subs: nil
    end
  end

  block_macro IFrameBlockMacro
end
