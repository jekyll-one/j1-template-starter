# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/shout-block.rb
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

PeriodRx = /\.(?= |$)/

# An extension that transforms the contents of a paragraph
# to uppercase.
#
# Usage
#
#   [shout, 5]
#   Time to get a move on.
#
Asciidoctor::Extensions.register do

  class ShoutBlock < Extensions::BlockProcessor
#    PeriodRx = /\.(?= |$)/

    use_dsl

    named :shout
    on_context :paragraph
    name_positional_attributes 'vol'
    parse_content_as :simple

    def process parent, reader, attrs
      volume = ((attrs.delete 'vol') || 1).to_i
      create_paragraph parent, (reader.lines.map {|l| l.upcase.gsub PeriodRx, '!' * volume }), attrs
    end
  end

  block ShoutBlock

end
