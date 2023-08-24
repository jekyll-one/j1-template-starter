# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/google-adsense-block.rb
# Asciidoctor extension for J1 Ads (Google Adsense)
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

    def process parent, target, attrs

      html = %(<div id="#{target}" class="gad-container speak2me-ignore #{attrs['role']}"></div>)
      create_pass_block parent, html, attrs, subs: nil
    end
  end

  block_macro GoogleAdsensekBlockMacro

end
