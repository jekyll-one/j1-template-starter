# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/mdib-icon-inline.rb
# Asciidoctor extension for J1 Theme
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

# A inline macro that places an MDIB icon into the output document
#
# Usage
#
#   mdib:<name>[<size>, <modifier>]
#
# Example:
#
#   mdib:account[mdib-48px, <modifier>]
#
Asciidoctor::Extensions.register do
  class MdibIconInlineMacro < Extensions::InlineMacroProcessor
    use_dsl
    named :mdib
    name_positional_attributes 'size', 'modifier'
    default_attrs 'size' => '1x', 'modifier' => ''

    def process parent, target, attributes
      doc = parent.document
      size_class = (size = attributes['size']) ? %(mdib-#{size}) : nil
      modifier_class = (modifier = attributes['modifier']) ? %(#{modifier}) : nil
      icon_name = target.tr '_', '-'
      %(<i class="mdib #{size_class} #{modifier} mdib-#{icon_name}"></i>)
    end
  end
  inline_macro MdibIconInlineMacro
end
