# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/mdil-icon-inline.rb
# Asciidoctor extension for J1 Theme
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

# A inline macro that places an MDIL icon into the output document
#
# Usage
#
#   mdil:<name>[<size>, <modifier>]
#
# Example:
#
#   mdil:account[mdil-48px, <modifier>]
#
Asciidoctor::Extensions.register do
  class MdilIconInlineMacro < Extensions::InlineMacroProcessor
    use_dsl
    named :mdil
    name_positional_attributes 'size', 'modifier'
    default_attrs 'size' => '1x', 'modifier' => ''

    def process parent, target, attributes
      doc = parent.document
      size_class = (size = attributes['size']) ? %(mdil-#{size}) : nil
      modifier_class = (modifier = attributes['modifier']) ? %(#{modifier}) : nil
      icon_name = target.tr '_', '-'
      %(<i class="mdil #{size_class} #{modifier} mdil-#{icon_name}"></i>)
    end
  end

  inline_macro MdilIconInlineMacro
end
