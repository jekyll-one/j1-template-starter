# ------------------------------------------------------------------------------
# ~/_plugins/uglify.rb
# Liquid filter for J1 Theme to uglify JS
#
# Product/Info:
# http://jekyll.one
#
# Copyright (C) 2022 Juergen Adams
#
# J1 Theme is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
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
# NOTE: To be checked if the gem uglifier can be replaced by the
# JS module "Terser" already used for package 200_theme_js
# ------------------------------------------------------------------------------
require 'uglifier'

module Jekyll
  module MinifyJS
    def minifyJS(input)
      # see: https://github.com/mishoo/UglifyJS/issues/495
      # quote_style 3 -- always use the original quotes
      minified = Uglifier.compile(input,
                    harmony: true,
                    :output => {
                        :quote_style => 3
                    }
                 )
      input = minified
    end
  end
end

Liquid::Template.register_filter(Jekyll::MinifyJS)
