# ------------------------------------------------------------------------------
# ~/_plugins/uglify.rb
# Liquid filter for J1 Template to uglify JS
#
# Product/Info:
# http://jekyll.one
#
# Copyright (C) 2021 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/J1 Template/blob/master/LICENSE
# ------------------------------------------------------------------------------
# => Uglifier.compile(File.read(input))
# ------------------------------------------------------------------------------
#  NOTE:
#  CustomFilters cannot be used in SAFE mode (e.g not usable for
#  rendering pages with Jekyll on GitHub
#
#  USAGE:
#    {% capture cache_name %}
#
#      liquid code to generate HTML output goes here
#
#    {% endcapture %}
#    {{ cache_name | uglify }}
# ------------------------------------------------------------------------------
# noinspection SpellCheckingInspection
# rubocop:disable Lint/UnneededDisable
# rubocop:disable Style/Documentation
# rubocop:disable Metrics/LineLength
# rubocop:disable Layout/TrailingWhitespace
# rubocop:disable Layout/SpaceAroundOperators
# rubocop:disable Layout/ExtraSpacing
# rubocop:disable Metrics/AbcSize
# ------------------------------------------------------------------------------
require 'json/minify'

module Jekyll
  module MinifyJSON
    def minifyJSON(input)
      minified = JSON.minify(input)
      input = minified
    end
  end
end

Liquid::Template.register_filter(Jekyll::MinifyJSON)
