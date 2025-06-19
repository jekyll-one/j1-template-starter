# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/slim-select-block.rb
# Asciidoctor extension for the J1 slimSelect module
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

# A block macro that embeds a <div> block into the output document
#
# Usage
#
#   slimSelect::wrapper_id[role="additional classes"]
#
# Example:
#
#   slimSelect::icon_library_select_wrapper[role="mt-4 mb-3"]
#
Asciidoctor::Extensions.register do

  class SlimSelectBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :slimSelect
    name_positional_attributes 'role'
    default_attrs 'role' => 'mt-0 mb-0'

    def process parent, target, attributes
      html = %(
        <div id="#{target}" class="#{attributes['role']}></div>
      )

      create_pass_block parent, html, attributes, subs: nil
    end
  end

  block_macro SlimSelectBlockMacro
end
