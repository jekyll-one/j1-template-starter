# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/conum.rb
# Asciidoctor extension for conums
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2022 Juergen Adams
#
# J1 Theme is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
#
# ------------------------------------------------------------------------------
require 'asciidoctor/extensions' unless RUBY_ENGINE == 'opal'
include Asciidoctor

# A inline macro that embeds a conum into the output document
#
# Usage
# ------------------------------------------------------------------------------
#   conum::<num>[]
#
# Example:
#
#   conum:1[]
#
# ------------------------------------------------------------------------------
Asciidoctor::Extensions.register do
  inline_macro do
    named :conum
    process do |parent, target, attrs|
      # TODO validate that this conum is valid
      Asciidoctor::Inline.new(parent, :callout, target.to_i).convert
    end
  end
end
