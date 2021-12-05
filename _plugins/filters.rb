# ------------------------------------------------------------------------------
# ~/_plugins/filters.rb
# Liquid filtersfor J1 Template
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2021 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/J1 Template/blob/master/LICENSE
# ------------------------------------------------------------------------------
#
#  NOTE:
#  CustomFilters cannot be used in SAFE mode (e.g not usable for
#  rendering pages with Jekyll on GitHub
#
#  USAGE:
#    regex_replace|regex_replace_first <search> [,<replace>]
#
#    These filters are similiar to the replace filters provided by Liquid
#    StandardFilters, except that it converts the second parameter into a
#    Regexp before passing it to g|sub.
#
#    NOTE:
#    If NO replacement is given, match|es are replaced by an
#    empty string and gets deleted from output.
#
#  EXAMPLES:
#
#     General:
#       {{ liquid.var | regex_replace_first: 'regex_search' [, 'regex_replace'] }}
#       {{ liquid.var | regex_replace: 'regex_search' [, 'regex_replace'] }}
#
#     Remove HTML comments from page content:
#       {{ page.content | regex_replace: '^\s*<!--.*-->' }}
#      or
#       {{ page.content | strip_html_comments }}
#
#     Remove surrounding round brackets () of any WORD from page content:
#       {{ page.content | regex_replace: '\s!!(\w+)!!\s', ' \1 ' }}
#
# ------------------------------------------------------------------------------
require 'json'

module Jekyll
  module J1_Filters

    EMPTY = ''
#   EMPTY_LINE = /^\s*\n/
    EMPTY_LINE = /^\s*$\n/
    MULTIPLE_SPACES = / +/
    ALL_SPACES = /\s+/
    COMMENT_LINE = /^\s*#.*\n|\s*#.*\n/
    #HTML_COMMENT_LINE = /^\s*<!--.*-->|\s*<!--.*-->/
    HTML_COMMENT_LINE = /<!--[\d\D]*?-->/
    JS_COMMENT_LINE = /^\s*\/\/[\d\D]*?\s*$/
    NOTHING = ''.freeze
    SPACE = ' '.freeze
    ADOC_TAG_LINE = /^\s*(:\S+\:.*$)/
    JBX_INDEX_TAG = /\s+!!(\S+)!!\s+/
    ADOC_HEAD_LINE = /^\s*(=+\s+\S+.*$)/
    LIQUID_TAG = /({%\s*\S+\s*%})/
    ADOC_INLINE_COMMENT = /^\s*(\/\/.*$)/

    # --------------------------------------------------------------------------
    #  merge: merge two hashes (input <- hash)
    #
    #  Example:
    #   {% assign settings = options|merge:defaults %}
    # --------------------------------------------------------------------------
    def merge(input, hash)
      unless input.respond_to?(:to_hash)
        # value = input == EMPTY ? 'empty' : input
        is_caller = caller[0][/`([^']*)'/, 1]
        raise ArgumentError.new('merge filter requires at least a hash for 1st arg, found caller|args: ' + "#{is_caller}|#{input}:#{hash}")
      end
      # if hash to merge is NOT a hash or empty return first hash (input)
      unless hash.respond_to?(:to_hash)
        input
      end
      if hash.nil? || hash.empty?
        input
      else
        merged = input.dup
        hash.each do |k, v|
          merged[k] = v
        end
        merged
      end
    end

    # --------------------------------------------------------------------------
    #  contains: check if a string contains a substring
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def contains(input, substr)
       input.include?(substr) ? true : false
    end

    # --------------------------------------------------------------------------
    #  contain_substr: check if a string contains a substring
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def contain_substr(input, substr)
       input.include?(substr) ? true : false
    end

    # --------------------------------------------------------------------------
    #  regex_replace_first: replace the FIRST occurence
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def regex_replace_first(input, regex, replacement = NOTHING)
       input.to_s.sub(Regexp.new(regex), replacement.to_s)
    end

    # --------------------------------------------------------------------------
    #  regex_replace:
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def regex_replace(input, regex, replacement = NOTHING)
       input.to_s.gsub(Regexp.new(regex), replacement.to_s)
    end

    # --------------------------------------------------------------------------
    #  strip_empty_lines:
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def strip_empty_lines(input)
       input.to_s.gsub(Regexp.new(EMPTY_LINE), NOTHING)
    end

    # --------------------------------------------------------------------------
    #  strip_comments:
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def strip_comments(input)
       input.to_s.gsub(Regexp.new(COMMENT_LINE), NOTHING)
    end

    # --------------------------------------------------------------------------
    #  strip_html_comments:
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def strip_html_comments(input)
       input.to_s.gsub(Regexp.new(HTML_COMMENT_LINE), NOTHING)
    end

    # --------------------------------------------------------------------------
    #  strip_js_comments:
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def strip_js_comments(input)
       input.to_s.gsub(Regexp.new(JS_COMMENT_LINE), NOTHING)
    end

    # --------------------------------------------------------------------------
    #  strip_multiple_spaces:
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def strip_multiple_spaces(input)
       input.to_s.gsub(Regexp.new(MULTIPLE_SPACES), SPACE)
    end

    # --------------------------------------------------------------------------
    #  strip_all_spaces:
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def strip_all_spaces(input)
       input.to_s.gsub(Regexp.new(ALL_SPACES), SPACE)
    end

    # --------------------------------------------------------------------------
    #  strip_adoc:
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def strip_adoc(input)
      input.to_s.gsub(ADOC_TAG_LINE, SPACE).gsub(ADOC_INLINE_COMMENT, SPACE).gsub(ADOC_HEAD_LINE, SPACE)
    end

    # --------------------------------------------------------------------------
    #  strip_liquid_tag:
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def strip_liquid_tag(input)
      input.to_s.gsub(LIQUID_TAG, SPACE)
    end

    # --------------------------------------------------------------------------
    #  strip_my_html:
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def strip_my_html(input)
      space = ' '.freeze
      input.to_s.gsub(/<script.*?<\/script>/m, space).gsub(/<!--.*?-->/m, space).gsub(/<style.*?<\/style>/m, space).gsub(/<.*?>/m, space)
    end

    # --------------------------------------------------------------------------
    #  read_index:
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def read_index(input)
    end

    # --------------------------------------------------------------------------
    #  rand:
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def rand(input)
      max = input.to_i
      Random.new.rand(1..max)
    end

    # --------------------------------------------------------------------------
    #  json:
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def json(input)
      input.to_json
    end

    # --------------------------------------------------------------------------
    #  is_type:
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def is_type(input)
      "#{input.class}".to_s.strip.downcase
    end

    # --------------------------------------------------------------------------
    #  is_XXXX:
    #
    #  "Duck typing" methods to determine the object (base) class
    #   returns true|false
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def is_string(input)
       input.kind_of?(String)
    end

    def is_fixnum(input)
      input.kind_of?(Fixnum)
    end

    def is_numeric(input)
      return true if input =~ /\A\d+\Z/
      true if Float(input) rescue false
    end

    def is_array(input)
      input.kind_of?(Array)
      return type
    end

    def is_hash(input)
      input.kind_of?(Hash)
    end

    # --------------------------------------------------------------------------
    #  newline_to_space:
    #  Replace all newlines by space
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def newline_to_space(input)
      input.to_s.gsub(/\n/, SPACE)
    end

    # --------------------------------------------------------------------------
    #  newline_to_space:
    #  Replace all newlines by space
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def newline_to_nothing(input)
      input.to_s.gsub(/\n/, NOTHING)
    end

  end # J1_Filters
end # Jekyll

Liquid::Template.register_filter(Jekyll::J1_Filters)
