# ------------------------------------------------------------------------------
# ~/_plugins/filter/prettify.rb
# Liquid filter for J1 Theme to beautify HTML code
#
# Product/Info:
# http://jekyll.one
#
# Copyright (C) 2023, 2024 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
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
#    {{ cache_name | pretty_print }}
# ------------------------------------------------------------------------------
require 'nokogiri'
require 'nokogiri-pretty'
require 'htmlbeautifier'

module Jekyll
  module PrettyPrint
    def pretty_print(input)
      # 1st_stage cleanup
      content = Nokogiri::HTML input
      parsed_content = content.to_html
      # 2nd_stage cleanup
      pretty = HtmlBeautifier.beautify(parsed_content)
    end
  end
end

Liquid::Template.register_filter(Jekyll::PrettyPrint)
