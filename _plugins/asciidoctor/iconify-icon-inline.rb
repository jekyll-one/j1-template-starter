# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/mdi-icon-inline.rb
# Asciidoctor extension for J1 Theme
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2023 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
# ------------------------------------------------------------------------------
require 'asciidoctor/extensions' unless RUBY_ENGINE == 'opal'
include Asciidoctor

Asciidoctor::Extensions.register do
  class IconifyIconInlineMacro < Extensions::InlineMacroProcessor
    use_dsl
    named :iconify
    name_positional_attributes 'size', 'modifier'
    default_attrs 'size' => '1x', 'modifier' => ''

    def process parent, target, attributes

      doc             = parent.document
      size_class      = (size = attributes['size']) ? %(#{size}) : nil
      modifier_class  = (modifier = attributes['modifier']) ? %(#{modifier}) : nil
      icon_name       = target.tr '_', '-'

      %(<span class="iconify iconify-#{size_class} #{modifier}" data-icon="#{icon_name}" data-inline="false"></span>)
    end
  end

  inline_macro IconifyIconInlineMacro
end
