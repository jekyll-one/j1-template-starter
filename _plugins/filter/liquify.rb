# ------------------------------------------------------------------------------
# ~/_plugins/filter/liquify.rb
# Liquid filter to expand nested liquid-variables in the front matter
#
# Product/Info:
# http://jekyll.one
#
# Copyright (C) 2023, 2024 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
# See: http://acegik.net/blog/ruby/jekyll/plugins/howto-nest-liquid-template-variables-inside-yaml-front-matter-block.html
# ------------------------------------------------------------------------------
module Jekyll
  module ExpandNestedVariableFilter
    def liquify(input)
      Liquid::Template.parse(input).render(@context)
    end
  end
end

Liquid::Template.register_filter(Jekyll::ExpandNestedVariableFilter)
