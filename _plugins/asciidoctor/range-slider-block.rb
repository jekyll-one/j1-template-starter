# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/range-slider-block.rb
# Asciidoctor extension for J1 range-slider (Owl range-slider)
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
    default_attrs 'role' => ''

    def process parent, target, attrs
      html = %(<div id="#{target}" class="range-slider speak2me-ignore #{attrs['role']}"></div>)
      create_pass_block parent, html, attrs, subs: nil
    end
  end

  block_macro SliderBlockMacro

end
