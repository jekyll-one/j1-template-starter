# ------------------------------------------------------------------------------
# ~/_plugins/filter/filters.rb
# Liquid filtersfor J1 Theme
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2023-2026 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE
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
#     Remove surrounding round brackets () of any WORD
#       {{ page.content | regex_replace: '\s!!(\w+)!!\s', ' \1 ' }}
#
#     Replace all <h1> headings by <h2> in the page content:
#       {{ page.content | regex_replace: '<h[1-2].*?>(.*?)<\/h[1-2]>', '<h2>\1</h2>'
#
# ------------------------------------------------------------------------------
require 'json'
require 'execjs'

module Jekyll
  module J1_Filters

    EMPTY = ''
    DOCTYPE_HTML = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd">'
#   EMPTY_LINE = /^\s*\n/
    EMPTY_LINE = /^\s*$\n/
    SURRUNDING_QUOTES = /^\h*\K"|"(?=\h*$)/
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
    #  merge: merge TWO (nested) hashes (input <- hash)
    #
    #  Example:
    #   {% assign settings = options | merge: prodA %}
    # --------------------------------------------------------------------------
    def merge(input, hash)
      unless input.respond_to?(:to_hash)
        is_caller = caller[0][/`([^']*)'/, 1]
        raise ArgumentError.new(
          "merge: requires at least a hash for the 1st arg, " \
          "for #{is_caller}|#{input.inspect}"
        )
      end

      # early return on invalid hash
      return input unless hash.respond_to?(:to_hash) && !hash.nil? && !hash.empty?

      merged = input.dup
      hash.each do |k, v|
        if merged[k].respond_to?(:to_hash) && v.respond_to?(:to_hash)
          # Rekursiv mergen bei nested Hashes
          merged[k] = merge(merged[k], v)
        else
          merged[k] = v
        end
      end
      merged
    end

    def merge_old(input, hash)
      unless input.respond_to?(:to_hash)
        # value = input == EMPTY ? 'empty' : input
        is_caller = caller[0][/`([^']*)'/, 1]
        raise ArgumentError.new(
          "merge: requires at least a hash for the 1st arg, " \
          "for #{is_caller}|#{input.inspect}"
        )
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
    #  deep_merge: merge MULTIPLE (nested) hashes (input <- hash*)
    #
    #  Example:
    #   {% assign settings = defaults | deep_merge: prodA, prodB %}
    # --------------------------------------------------------------------------
    def deep_merge(input, *hashes)
      unless input.respond_to?(:to_hash)
        is_caller = caller[0][/`([^']*)'/, 1]
        raise ArgumentError.new(
          "deep_merge: requires at least a hash for the 1st arg, " \
          "for #{is_caller}|#{input.inspect}"
        )
      end

      # start by a deep copy of the defaults hash
      result = deep_clone(input)

      # merge all subsequent hashes one after the other
      # later values ​​overwrite earlier values
      hashes.each do |hash|
        next if hash.nil?
        deep_merge_into!(result, hash)
      end

      result
    end

    def deep_merge_into!(target, source)
      source.each do |key, value|
        if value.is_a?(Hash) && target[key].is_a?(Hash)
          # both are hashes - merge recursively
          deep_merge_into!(target[key], value)
        else
          # production value overrides default value
          target[key] = deep_clone(value)
        end
      end

      target
    end

    def deep_clone(value)
      case value
      when Hash
        value.each_with_object({}) { |(k, v), h| h[k] = deep_clone(v) }
      when Array
        value.map { |v| deep_clone(v) }
      else
        # secure duplication for duplicable value types
        if value.respond_to?(:dup) && 
          !value.is_a?(Symbol) && 
          !value.is_a?(Numeric) && 
          !value.is_a?(TrueClass) && 
          !value.is_a?(FalseClass) && 
          !value.nil?
          value.dup
        else
          value
        end
      end
    end

    # --------------------------------------------------------------------------
    #  contain_substr: check if a string contains a substring
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def contain_substr(input, substr)
       input.include?(substr.to_s) ? true : false
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
    #  Managing Arrays
    #   input - arr:  returns any elements from input that are NOT in arr
    #   arr - input:  returns any elements from arr that are not in a
    #   arr | input:  returns the unique set from input AND arr
    #   arr & input:  returns the intersection elements of input AND arr
    #   pipe (|):     returns the unique set of elements for BOTH arrays
    #
    #  Example|s:
    #
    #   {% assign input = '1,2,3,4,5' | split: ',' %}
    #   {% assign arr   = '1,2,3' | split: ',' %}
    #
    #   {% assign difference    = input | difference: arr %}
    #   {% assign union         = input | union: arr %}
    #   {% assign intersection  = input | intersection: arr %}
    #
    #  NOTE
    #    See: https://stackoverflow.com/questions/5678108/how-can-i-get-the-intersection-union-and-subset-of-arrays-in-ruby
    #
    # --------------------------------------------------------------------------
    def difference(input, arr)
      if ( input.kind_of?(Array) )
        input - arr
      else
        []
      end
    end

    # def difference_both_unique(input, arr)
    #   if ( input.kind_of?(Array) )
    #     input - arr | arr - input
    #   else
    #     []
    #   end
    # end

    def union(input, arr)
      if ( input.kind_of?(Array) )
        input | arr
      else
        []
      end
    end

    def intersection(input, arr)
      if ( input.kind_of?(Array) )
        input & arr
      else
        []
      end
    end

    # --------------------------------------------------------------------------
    #  strip_surrounding_quotes:
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    def strip_surrounding_quotes(input)
      input.to_s.gsub(Regexp.new(SURRUNDING_QUOTES), NOTHING)
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
    #  strip_doctype_html:
    #
    #  Example: stribg_var | strip_doctype_html
    #
    # --------------------------------------------------------------------------
    def strip_doctype_html(input)
       input.to_s.gsub(Regexp.new(DOCTYPE_HTML), NOTHING)
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
    #  jsonStr:
    #
    #  Example:
    #
    # --------------------------------------------------------------------------
    # def jsonStr(input)
    #   input.to_json

    #   prettyOpts = {
    #     array_nl: "\n",
    #     object_nl: "\n",
    #     indent: '  ',
    #     space: ' '
    #   }

    #   return JSON.pretty_generate(input, prettyOpts).gsub(/{|}/m, "")
    # end

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
