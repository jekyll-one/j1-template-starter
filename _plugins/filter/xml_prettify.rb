# ------------------------------------------------------------------------------
# ~/_plugins/xml_prettify.rb
# Liquid filter for J1 Template to beautify XML code
#
# Product/Info:
# http://jekyll.one
#
# Copyright (C) 2022 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/J1 Template/blob/master/LICENSE
# ------------------------------------------------------------------------------
#  NOTE:
#  CustomFilters cannot be used in SAFE mode (e.g not usable for
#  rendering pages with Jekyll on GitHub
#
#  USAGE:
#    {% capture cache_name %}
#
#      liquid code to generate XML output goes here
#
#    {% endcapture %}
#    {{ cache_name | xml_pretty_print }}
# ------------------------------------------------------------------------------
require 'nokogiri'

module Jekyll
  module XmlPrettyPrint
    def xml_pretty_print(input)
      # xml cleanup
      Nokogiri::XML(input).root.to_xml
    end
  end
end

Liquid::Template.register_filter(Jekyll::XmlPrettyPrint)
