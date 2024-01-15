# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/admonition-block-question.rb
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
require 'asciidoctor/extensions'
include Asciidoctor

# An extension that introduces a custom admonition type, complete
# with a custom icon.
#
# Usage
#
#   [QUESTION]
#   ====
#   What's the main tool for selecting colors?
#   ====
#
# or
#
#   [QUESTION]
#   What's the main tool for selecting colors?
#
Asciidoctor::Extensions.register do

  class CustomAdmonitionBlockAnswer < Extensions::BlockProcessor
    use_dsl
    named :ANSWER
    on_contexts :example, :paragraph

    def process parent, reader, attrs

      attrs['name'] = 'answer'
      attrs['caption'] = 'Answer'

      create_block parent, :admonition, reader.lines, attrs, content_model: :compound
    end
  end

  block CustomAdmonitionBlockAnswer
end
