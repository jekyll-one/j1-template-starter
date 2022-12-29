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

# A block macro that embeds a (Master) Slider (patent) block
# into the output document
#
# Usage:
#
#   masterslider::slider_id[role="additional classes"]
#
# Example:
#
#   .The slider title
#   masterslider::ms_00001[role="mt-3 mb-5"]
#
Asciidoctor::Extensions.register do

  class MasterSliderBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :masterslider
    name_positional_attributes 'role'

    def process parent, target, attrs

      title_html  = (attrs.has_key? 'title') ? %(<div class="slider-title">#{attrs['title']}</div>\n) : nil
      html = %(#{title_html} <div id="p_#{target}" class="master-slider-parent #{attrs['role']}"></div>)
      create_pass_block parent, html, attrs, subs: nil
    end
  end

  block_macro MasterSliderBlockMacro

end
