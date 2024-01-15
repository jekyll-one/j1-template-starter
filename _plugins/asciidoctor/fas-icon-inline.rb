# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/fas-icon-inline.rb
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

Asciidoctor::Extensions.register do
  class FasIconInlineMacro < Extensions::InlineMacroProcessor
    use_dsl
    named :fas
    name_positional_attributes 'size', 'modifier'
    default_attrs 'size' => '1x', 'modifier' => ''

    def process parent, target, attributes

      doc             = parent.document
      size_class      = (size = attributes['size']) ? %(fa-#{size}) : nil
      modifier_class  = (modifier = attributes['modifier']) ? %(#{modifier}) : nil
      icon_name       = target.tr '_', '-'

      %(<i class="fa fas fa-#{icon_name} #{size_class} #{modifier}"></i>)
    end
  end

  inline_macro FasIconInlineMacro
end
