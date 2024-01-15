# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/callout-block.rb
# Asciidoctor extension for callouts as a (HTML-)block
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

# A block macro that embeds a Callout block into the output document
#
# Usage
#
#   callout::<num>[<text>, <modifier]
#
# Example:
#
#   callout::1[Web Browser]
#
Asciidoctor::Extensions.register do

  class CalloutBlockMacro < Extensions::BlockMacroProcessor
    use_dsl
    named :callout
    name_positional_attributes 'text', 'modifier'
    default_attributes 'text' => 'callout text to be specified',
                        'modifier' => 'ml-2 mb-1'

    def process parent, target, attributes

      doc             = parent.document
      modifier_class  = (modifier = attributes['modifier']) ? %(#{modifier}) : nil
      text_content    = (text = attributes['text']) ? %(#{text}) : nil

      html = %(
        <div class="paragraph speak2me-ignore">
        	<p class="#{modifier}"> <i class="conum" data-value="#{target}"></i> #{text} </p>
        </div>
      )

      create_pass_block parent, html, attributes, subs: nil
    end
  end

  block_macro CalloutBlockMacro
end
