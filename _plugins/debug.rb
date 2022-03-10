# ------------------------------------------------------------------------------
# ~/_plugins/debug.rb
# Helper to inspect liquid template variables for Jekyll
#
# Product/Info:
# http://jekyll.one
#
# Copyright (C) 2022 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/J1 Template/blob/master/LICENSE
# ------------------------------------------------------------------------------
#  USAGE:
#  Can be used anywhere liquid syntax is parsed with templates, includes,
#   posts and pages:
#
#    {{ site | debug }}
#    {{ site.pages | debug }}
#    {{ site.posts | debug }}
#
# ------------------------------------------------------------------------------
require 'pp'

module Jekyll
  # Need to overwrite the inspect method here because the original
  # uses < > to encapsulate the pseudo post/page objects in which case
  # the output is taken for HTML tags and hidden from view.
  #

  # <= Jekyll 2.5.3
  class Post
    def inspect
      "#Jekyll:Post @id=#{self.id.inspect}"
    end
  end

  # >= Jekyll 3.0.0
  class Document
    def inspect
      "#Jekyll::Document #{relative_path} collection=#{collection.label}"
    end
  end

  class Page
    def inspect
      "#Jekyll::Page @name=#{self.name.inspect}"
    end
  end
end # Jekyll

module Jekyll
  module DebugFilter

    def debug(obj, stdout=false)
      puts obj.pretty_inspect if stdout
      "<pre>#{obj.class}\n#{obj.pretty_inspect}</pre>"
    end

  end # DebugFilter
end # Jekyll

Liquid::Template.register_filter(Jekyll::DebugFilter)
