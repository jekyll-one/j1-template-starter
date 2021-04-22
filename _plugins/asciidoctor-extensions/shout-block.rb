# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/shout-block.rb
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
