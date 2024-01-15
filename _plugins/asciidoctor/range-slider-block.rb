# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/range-slider-block.rb
# Asciidoctor extension for J1 range-slider (Owl range-slider)
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

# A block macro that embeds a range-slider block into the output document
#
# Usage
#
#   range_slider::slider-id[role="additional classes"]
#
# Example:
#
#   range_slider::example_slider[role="mb-5"]
#
Asciidoctor::Extensions.register do

  class SliderBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :range_slider
    name_positional_attributes 'role'
    default_attributes 'role' => ''

    def process parent, target, attributes

      html = %(
        <div class="#{attributes['role']}">
          <div id="#{target}" class="range-slider speak2me-ignore"></div>
        </div>
      )

      create_pass_block parent, html, attributes, subs: nil
    end
  end

  block_macro SliderBlockMacro
end
