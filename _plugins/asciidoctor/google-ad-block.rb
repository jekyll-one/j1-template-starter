# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/google-adsense-block.rb
# Asciidoctor extension for J1 Ads (Google Adsense)
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

# ------------------------------------------------------------------------------
# A block macro that embeds a (Google Adsense) Ad block
# into the output document
#
# Usage:
#
#   gad::ad_id[role="additional container classes"]
#
# Example:
#
#   gad::ad_1234567890["mb-5"]
#
# ------------------------------------------------------------------------------
Asciidoctor::Extensions.register do

  class GoogleAdsensekBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :gad
    name_positional_attributes 'role'
    default_attrs 'role' => 'mt-3 mb-3'

    def process parent, target, attributes

      html = %(
        <div class="#{attributes['role']}">
          <div id="#{target}" class="gad-container speak2me-ignore"></div>
        </div>
      )

      create_pass_block parent, html, attributes, subs: nil
    end
  end

  block_macro GoogleAdsensekBlockMacro
end
