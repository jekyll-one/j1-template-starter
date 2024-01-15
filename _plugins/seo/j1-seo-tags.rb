# ------------------------------------------------------------------------------
# ~/_plugins/j1-seo-tags.rb
# Generate SEO tags for posts and pages of a site
#
# Product/Info:
# http://jekyll.one
#
# Copyright (C) 2022 Ben Balter and Contributors
# Copyright (C) 2023, 2024 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
# ------------------------------------------------------------------------------
# frozen_string_literal: true

require "jekyll"

module Jekyll

  class J1SeoTag < Jekyll::Generator
    safe true
    priority :lowest

    # Main plugin action, called by Jekyll-core
    def generate(site)
      @site = site

      @mode                             = site.config['environment']
      @template                         = site.config['theme']

      @project_path                     = File.join(File.dirname(__FILE__)).sub('_plugins/seo', '')
      @module_data_path                 = File.join(File.join(@project_path, '_data'))
      @module_config_path               = File.join(File.join(@module_data_path, 'plugins'))
      @module_template_path             = File.join(File.join(@module_data_path, 'templates'))
      @module_config_default            = YAML::load(File.open(File.join(@module_config_path, 'defaults', 'seo-tags.yml')))
      @module_config_user               = YAML::load(File.open(File.join(@module_config_path, 'seo-tags.yml')))

      @module_config_default_settings   = @module_config_default['defaults']
      @module_config_user_settings      = @module_config_user['settings']
      @module_config                    = @module_config_default_settings.merge!(@module_config_user_settings)

      if plugin_disabled?
        Jekyll.logger.info "J1 SEO Tags:", "disabled"
        return
      else
        Jekyll.logger.info "J1 SEO Tags:", "enabled"
        Jekyll.logger.info "J1 SEO Tags:", "generate seo tags"
      end

    end

    private

    # Returns the plugin's config or an empty hash if not set
    #
    def config
      @config ||= @module_config  || {}
    end

    # Check if plugin is enabled|disabled
    #
    def plugin_disabled?
      if config['enabled']
        false
      else
        true
      end
    end

  end

  class SeoTag < Liquid::Tag
    attr_accessor :context

    @project_path                     = File.join(File.dirname(__FILE__)).sub('_plugins/seo', '')
    @module_data_path                 = File.join(File.join(@project_path, '_data'))
    @module_config_path               = File.join(File.join(@module_data_path, 'plugins'))
    @module_template_path             = File.join(File.join(@module_data_path, 'templates'))
    @module_config_default            = YAML::load(File.open(File.join(@module_config_path, 'defaults', 'seo-tags.yml')))
    @module_config_user               = YAML::load(File.open(File.join(@module_config_path, 'seo-tags.yml')))

    @module_config_default_settings   = @module_config_default['defaults']
    @module_config_user_settings      = @module_config_user['settings']
    @module_config                    = @module_config_default_settings.merge!(@module_config_user_settings)

    # Matches all whitespace that follows either
    #   1. A '}', which closes a Liquid tag
    #   2. A '{', which opens a JSON block
    #   3. A '>' followed by a newline, which closes an XML tag or
    #   4. A ',' followed by a newline, which ends a JSON line
    # We will strip all of this whitespace to minify the template
    # We will not strip any whitespace if the next character is a '-'
    #   so that we do not interfere with the HTML comment at the
    #   very beginning
    MINIFY_REGEX = %r!(?<=[{}]|[>,]\n)\s+(?\!-)!.freeze

    def initialize(_tag_name, text, _tokens)
      super
      @text = text
    end

    def render(context)
      @context = context
      SeoTag.template.render!(payload, info)
    end

    private

    def options
      {
        "title"   => title?,
      }
    end

    def payload
      # site_payload is an instance of UnifiedPayloadDrop. See https://github.com/jekyll/jekyll/blob/22f2724a1f117a94cc16d18c499a93d5915ede4f/lib/jekyll/site.rb#L261-L276
      context.registers[:site].site_payload.tap do |site_payload|
        site_payload["page"]      = context.registers[:page]
        site_payload["paginator"] = context["paginator"]
        site_payload["seo_tag"]   = drop
      end
    end

    def drop
      if context.registers[:site].liquid_renderer.respond_to?(:cache)
        Jekyll::SeoTag::Drop.new(@text, @context)
      else
        @drop ||= Jekyll::SeoTag::Drop.new(@text, @context)
      end
    end

    def info
      {
        :registers => context.registers,
        :filters   => [Jekyll::Filters],
      }
    end

    class << self
      def template
        @template ||= Liquid::Template.parse template_contents
      end

      private

      def template_contents
        @template_contents ||= begin
          File.read(template_path).gsub(MINIFY_REGEX, "")
        end
      end

      def template_path
        @template_path ||= File.expand_path @module_config['template_name'], @module_template_path
      end
    end

  end

end

Liquid::Template.register_tag("seo", Jekyll::SeoTag)

module Jekyll
  class SeoTag
    # A drop representing the current page's author
    #
    # Author name will be pulled from:
    #
    # 1. The page's `author` key
    # 2. The first author in the page's `authors` key
    # 3. The `author` key in the site config
    #
    # If the result from the name search is a string, we'll also check
    # for additional author metadata in `site.data.authors`
    class AuthorDrop < Jekyll::Drops::Drop
      # Initialize a new AuthorDrop
      #
      # page - The page hash (e.g., Page#to_liquid)
      # site - The Jekyll::Drops::SiteDrop
      def initialize(page: nil, site: nil)
        raise ArgumentError unless page && site

        @mutations = {}
        @page = page
        @site = site
      end

      # AuthorDrop#to_s should return name, allowing the author drop to safely
      # replace `page.author`, if necessary, and remain backwards compatible
      def name
        author_hash["name"]
      end
      alias_method :to_s, :name

      def twitter
        return @twitter if defined? @twitter

        twitter   = author_hash["twitter"] || author_hash["name"]
        @twitter  = twitter.is_a?(String) ? twitter.sub(%r!^@!, "") : nil
      end

      private

      attr_reader :site, :page

      # Finds the page author in the page.author, page.authors, or site.author
      #
      # Returns a string or hash representing the author
      def resolved_author
        return @resolved_author if defined? @resolved_author

        sources = [page["author"]]
        sources << page["authors"].first if page["authors"].is_a?(Array)
        sources << site["author"]
        @resolved_author = sources.find { |s| !s.to_s.empty? }
      end

      # If resolved_author is a string, attempts to find corresponding author
      # metadata in `site.data.authors`
      #
      # Returns a hash representing additional metadata or an empty hash
      def site_data_hash
        @site_data_hash ||= begin
          return {} unless resolved_author.is_a?(String)
          return {} unless site.data["authors"].is_a?(Hash)

          author_hash = site.data["authors"][resolved_author]
          author_hash.is_a?(Hash) ? author_hash : {}
        end
      end

      # Returns the normalized author hash representing the page author,
      # including site-wide metadata if the author is provided as a string,
      # or an empty hash, if the author cannot be resolved
      def author_hash
        @author_hash ||= begin
          case resolved_author
          when Hash
            resolved_author
          when String
            { "name" => resolved_author }.merge!(site_data_hash)
          else
            {}
          end
        end
      end

      # Since author_hash is aliased to fallback_data, any values in the hash
      # will be exposed via the drop, allowing support for arbitrary metadata
      alias_method :fallback_data, :author_hash
    end
  end
end

module Jekyll
  class SeoTag

    module UrlHelper
      private

      # Determines if the given string is an absolute URL
      #
      # Returns true if an absolute URL
      # Returns false if it's a relative URL
      # Returns nil if it is not a string or can't be parsed as a URL
      def absolute_url?(string)
        return unless string

        Addressable::URI.parse(string).absolute?
      rescue Addressable::URI::InvalidURIError
        nil
      end
    end

    class Drop < Jekyll::Drops::Drop
      include Jekyll::SeoTag::UrlHelper

      TITLE_SEPARATOR = " - "
      FORMAT_STRING_METHODS = [
        :markdownify, :strip_html, :normalize_whitespace, :escape_once,
      ].freeze
      HOMEPAGE_OR_ABOUT_REGEX = %r!^/(about/)?(index.html?)?$!.freeze

      EMPTY_READ_ONLY_HASH = {}.freeze
      private_constant :EMPTY_READ_ONLY_HASH

      def initialize(text, context)
        @obj = EMPTY_READ_ONLY_HASH
        @mutations = {}
        @text = text
        @context = context
      end

      def version
        Jekyll::SeoTag::VERSION
      end

      # Should the `<title>` tag be generated for this page?
      def title?
        return false unless title
        return @display_title if defined?(@display_title)

        @display_title = (@text !~ %r!title=false!i)
      end

      def site_title
        @site_title ||= format_string site["title"]
      end

      # Page title without site title or description appended
      def page_title
        @page_title ||= format_string page["title"]                            # || site_title
      end

      def site_title_extention
        @site_title_extention ||= format_string site["title_extention"]
      end

      def page_title_extention
        @site_title_extention ||= format_string page["title_extention"]
      end

      def site_description
        @site_description ||= format_string site["description"]
      end

      def title_extention_or_description
        page_title_extention || site_title_extention || site_description
      end

      # Page title with site title or description appended
      # rubocop:disable Metrics/CyclomaticComplexity
      def title
        @title ||= begin
          if page_title != site_title
            page_title + TITLE_SEPARATOR + title_extention_or_description
          else
            site_title + TITLE_SEPARATOR + title_extention_or_description
          end
        end

        @title
      end
      # rubocop:enable Metrics/CyclomaticComplexity

      def name
        return @name if defined?(@name)

        @name = if seo_name
                  seo_name
                elsif !homepage_or_about?
                  nil
                elsif site_social["name"]
                  format_string site_social["name"]
                elsif site_title
                  site_title
                end
      end

      def description
        @description ||= begin
          format_string(page["description"] || page["excerpt"]) || site_description
        end
      end

      # A drop representing the page author
      def author
        @author ||= AuthorDrop.new(:page => page, :site => site)
      end

      # A drop representing the JSON-LD output
      def json_ld
        @json_ld ||= JSONLDDrop.new(self)
      end

      # Returns a Drop representing the page's image
      # Returns nil if the image has no path, to preserve backwards compatability
      def image
        @image ||= ImageDrop.new(:page => page, :context => @context)
        @image if @image.path
      end

      def date_modified
        @date_modified ||= begin
          time_now      = Time.new
          current_time  = time_now.strftime("%Y-%m-%d %H:%M:%S")
          date          = current_time.to_liquid || page["last_modified"].to_liquid
          filters.date_to_xmlschema(date) if date
        end
      end

      def date_published
        @date_published ||= filters.date_to_xmlschema(page["date"]) if page["date"]
      end

      def type
        @type ||= begin
          if page_seo["type"]
            page_seo["type"]
          elsif homepage_or_about?
            "WebSite"
          elsif page["date"]
            "BlogPosting"
          else
            "WebPage"
          end
        end
      end

      def links
        @links ||= begin
          if page_seo["links"]
            page_seo["links"]
          elsif homepage_or_about? && site_social["links"]
            site_social["links"]
          end
        end
      end

      def logo
        @logo ||= begin
          return unless site["logo"]

          if absolute_url? site["logo"]
            filters.uri_escape site["logo"]
          else
            filters.uri_escape filters.absolute_url site["logo"]
          end
        end
      end

      def page_lang
        @page_lang ||= page["lang"] || site["lang"] || "en_US"
      end

      def page_locale
        @page_locale ||= (page["locale"] || site["locale"] || page_lang).tr("-", "_")
      end

      def canonical_url
        @canonical_url ||= begin
          if page["canonical_url"].to_s.empty?
            filters.absolute_url(page["url"]).to_s.gsub(%r!/index\.html$!, "/")
          else
            page["canonical_url"]
          end
        end
      end

      private

      def filters
        @filters ||= Jekyll::SeoTag::Filters.new(@context)
      end

      def page
        @page ||= @context.registers[:page].to_liquid
      end

      def site
        @site ||= @context.registers[:site].site_payload["site"].to_liquid
      end

      def homepage_or_about?
        page["url"] =~ HOMEPAGE_OR_ABOUT_REGEX
      end

      def page_number
        return unless @context["paginator"] && @context["paginator"]["page"]

        current = @context["paginator"]["page"]
        total = @context["paginator"]["total_pages"]
        paginator_message = site["seo_paginator_message"] || "Page %<current>s of %<total>s for "

        format(paginator_message, :current => current, :total => total) if current > 1
      end

      attr_reader :context

      def fallback_data
        @fallback_data ||= {}
      end

      def format_string(string)
        string = FORMAT_STRING_METHODS.reduce(string) do |memo, method|
          filters.public_send(method, memo)
        end

        string unless string.empty?
      end

      def seo_name
        @seo_name ||= format_string(page_seo["name"]) if page_seo["name"]
      end

      def page_seo
        @page_seo ||= sub_hash(page, "seo")
      end

      def site_social
        @site_social ||= sub_hash(site, "social")
      end

      # Safely returns a sub hash
      #
      # hash - the parent hash
      # key  - the key in the parent hash
      #
      # Returns the sub hash or an empty hash, if it does not exist
      def sub_hash(hash, key)
        if hash[key].is_a?(Hash)
          hash[key]
        else
          EMPTY_READ_ONLY_HASH
        end
      end
    end
  end
end

module Jekyll
  class SeoTag
    class Filters
      include Jekyll::Filters
      include Liquid::StandardFilters

      def initialize(context)
        @context = context
      end
    end
  end
end

module Jekyll
  class SeoTag
    # A drop representing the page image
    # The image path will be pulled from:
    #
    # 1. The `image` key if it's a string
    # 2. The `image.path` key if it's a hash
    # 3. The `image.facebook` key
    # 4. The `image.twitter` key
    class ImageDrop < Jekyll::Drops::Drop
      include Jekyll::SeoTag::UrlHelper

      # Initialize a new ImageDrop
      #
      # page - The page hash (e.g., Page#to_liquid)
      # context - the Liquid::Context
      def initialize(page: nil, context: nil)
        raise ArgumentError unless page && context

        @mutations = {}
        @page = page
        @context = context
      end

      # Called path for backwards compatability, this is really
      # the escaped, absolute URL representing the page's image
      # Returns nil if no image path can be determined
      def path
        @path ||= filters.uri_escape(absolute_url) if absolute_url
      end
      alias_method :to_s, :path

      private

      attr_accessor :page, :context

      # The normalized image hash with a `path` key (which may be nil)
      def image_hash
        @image_hash ||= begin
          image_meta = page["image"]

          case image_meta
          when Hash
            { "path" => nil }.merge!(image_meta)
          when String
            { "path" => image_meta }
          else
            { "path" => nil }
          end
        end
      end
      alias_method :fallback_data, :image_hash

      def raw_path
        @raw_path ||= begin
          image_hash["path"] || image_hash["facebook"] || image_hash["twitter"]
        end
      end

      def absolute_url
        return unless raw_path
        @absolute_url ||= build_absolute_path
      end

      def build_absolute_path
        return raw_path unless raw_path.is_a?(String) && absolute_url?(raw_path) == false
        return filters.absolute_url(raw_path) if raw_path.start_with?("/")

        page_dir = @page["url"]
        page_dir = File.dirname(page_dir) unless page_dir.end_with?("/")

        filters.absolute_url File.join(page_dir, raw_path)
      end

      def filters
        @filters ||= Jekyll::SeoTag::Filters.new(context)
      end
    end
  end
end

module Jekyll
  class SeoTag
    class JSONLDDrop < Jekyll::Drops::Drop
      extend Forwardable

      def_delegator :page_drop, :name,           :name
      def_delegator :page_drop, :description,    :description
      def_delegator :page_drop, :canonical_url,  :url
      def_delegator :page_drop, :page_title,     :headline
      def_delegator :page_drop, :date_modified,  :dateModified
      def_delegator :page_drop, :date_published, :datePublished
      def_delegator :page_drop, :links,          :sameAs
      def_delegator :page_drop, :logo,           :logo
      def_delegator :page_drop, :type,           :type

      # Expose #type and #logo as private methods and #@type as a public method
      alias_method :@type, :type
      private :type, :logo

      VALID_ENTITY_TYPES = %w(BlogPosting CreativeWork).freeze
      VALID_AUTHOR_TYPES = %w(Organization Person).freeze
      private_constant :VALID_ENTITY_TYPES, :VALID_AUTHOR_TYPES

      # page_drop should be an instance of Jekyll::SeoTag::Drop
      def initialize(page_drop)
        @mutations = {}
        @page_drop = page_drop
      end

      def fallback_data
        @fallback_data ||= {
          "@context" => "https://schema.org",
        }
      end

      def author
        return unless page_drop.author["name"]

        author_type = page_drop.author["type"]
        return if author_type && !VALID_AUTHOR_TYPES.include?(author_type)

        hash = {
          "@type" => author_type || "Person",
          "name"  => page_drop.author["name"],
        }

        author_url = page_drop.author["url"]
        hash["url"] = author_url if author_url

        hash
      end

      def image
        return unless page_drop.image
        return page_drop.image.path if page_drop.image.keys.length == 1

        hash = page_drop.image.to_h
        hash["url"]   = hash.delete("path")
        hash["@type"] = "imageObject"
        hash
      end

      def publisher
        return unless logo

        output = {
          "@type" => "Organization",
          "logo"  => {
            "@type" => "ImageObject",
            "url"   => logo,
          },
        }
        output["name"] = page_drop.author.name if page_drop.author.name
        output
      end

      def main_entity
        return unless VALID_ENTITY_TYPES.include?(type)

        {
          "@type" => "WebPage",
          "@id"   => page_drop.canonical_url,
        }
      end
      alias_method :mainEntityOfPage, :main_entity
      private :main_entity

      # Returns a JSON-encoded object containing the JSON-LD data.
      # Keys are sorted.
      def to_json(state = nil)
        keys.sort.each_with_object({}) do |(key, _), result|
          v = self[key]
          result[key] = v unless v.nil?
        end.to_json(state)
      end

      private

      attr_reader :page_drop
    end
  end
end
