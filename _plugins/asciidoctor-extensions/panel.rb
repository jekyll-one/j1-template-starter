# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/banner.rb
# Asciidoctor extension for J1 Banner blocks
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2021 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/J1 Template/blob/master/LICENSE
#
# ------------------------------------------------------------------------------
require 'asciidoctor/extensions' unless RUBY_ENGINE == 'opal'
include Asciidoctor

# A block macro that embeds a banner block into the output document
#
# Usage
#
#   banner::banner_id[role="additional classes"]
#
# Example:
#
#   banner::home_teaser_banner[role="mb-5"]
#
Asciidoctor::Extensions.register do

  class J1BlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :panel
    name_positional_attributes 'role'

    def process parent, target, attrs
      html = %(<div id="#{target}" class="#{attrs['role']}"></div>)
      create_pass_block parent, html, attrs, subs: nil
    end
  end

  block_macro J1BlockMacro

end
