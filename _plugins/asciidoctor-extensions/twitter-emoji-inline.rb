# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/twitter-emoji-inline.rb
# Asciidoctor extension for J1 Template
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

SIZE_MAP = {'1x' => 18, 'lg' => 24, '2x' => 34, '3x' => 50, '4x' => 68, '5x' => 85}
SIZE_MAP.default = 24

Asciidoctor::Extensions.register do
  class EmojiInlineMacro < Extensions::InlineMacroProcessor
    use_dsl
    named :emoji
    name_positional_attributes 'size', 'modifier'
    default_attrs 'size' => '1x', 'modifier' => ''

    def process parent, target, attributes
      doc = parent.document
      # Use twemoji only
      size_class = (size = attributes['size']) ? %(twa-#{size}) : nil
      modifier_class = (modifier = attributes['modifier']) ? %(twa-#{modifier}) : nil
      emoji_name = target.tr '_', '-'
      %(<i class="twa #{size_class} twa-#{emoji_name} twa-#{modifier}"></i>)
    end
  end
  inline_macro EmojiInlineMacro
end
