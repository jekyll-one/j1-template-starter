# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/flag-icon-inline.rb
# Asciidoctor flag icon extension for J1 Theme
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2023 Juergen Adams
#
# J1 Theme is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
# ------------------------------------------------------------------------------
# <i class="flag-icon flag-icon-gr rectangle size-xs"></i>
# <i class="flag-icon flag-icon-gr squared size-xs"></i>
# ------------------------------------------------------------------------------

require 'asciidoctor/extensions' unless RUBY_ENGINE == 'opal'
include Asciidoctor

Asciidoctor::Extensions.register do
  class FlagIconInlineMacro < Extensions::InlineMacroProcessor
    use_dsl
    named :flag
    name_positional_attributes 'style', 'size', 'modifier'
    default_attrs 'style' => 'rectangle', 'size' => '', 'modifier' => ''

    def process parent, target, attributes
      doc = parent.document
      style_class = (style = attributes['style']) ? %(#{style}) : nil
      size_class = (size = attributes['size']) ? %(size-#{size}) : nil
      modifier_class = (modifier = attributes['modifier']) ? %(#{modifier}) : nil
      country_name = target.tr '_', '-'
      %(<i class="flag-icon flag-icon-#{country_name} #{style_class} #{size_class} #{modifier}"></i>)
    end
  end
  inline_macro FlagIconInlineMacro
end
