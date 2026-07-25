# ------------------------------------------------------------------------------
# ~/_plugins/j1-feed.rb
# Generate RSS feeds for all posts of a site
#
# Product/Info:
# http://jekyll.one
#
# Copyright (C) 2022 Ben Balter and Contributors
# Copyright (C) 2023-2026 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE
# ------------------------------------------------------------------------------
#
require 'jekyll'
require 'fileutils'
require 'yaml'
require 'date'

module J1Feed
  class Generator < Jekyll::Generator
    safe true
    priority :lowest

    # Main plugin action, called by Jekyll Core
    #
    def generate(site)
      @site                             = site

      @mode                             = site.config['environment']
      @template                         = site.config['theme']

      # Resolve config paths relative to the Jekyll source directory.
      # The original `File.dirname(__FILE__).sub('_plugins/seo', '')`
      # was a no-op (the path segment '_plugins/seo' never appears in
      # __FILE__), which left @project_path pointing at the _plugins
      # directory instead of the site root. `site.source` is the
      # authoritative location of the Jekyll site source folder.
      #
      @project_path                     = site.source
      @plugin_data_path                 = File.join(@project_path, site.config['data_dir'])
      @module_config_path               = File.join(@plugin_data_path, 'plugins')

      # Safely load default + user settings. Replaces the original
      # `YAML::load(File.open(...))` calls which leaked file handles,
      # used the unsafe loader, and crashed on a missing file.
      #
      default_yaml                      = load_yaml(File.join(@module_config_path, 'defaults', 'feed.yml'))
      user_yaml                         = load_yaml(File.join(@module_config_path, 'feed.yml'))

      @module_config_default_settings   = default_yaml['defaults'] || {}
      @module_config_user_settings      = user_yaml['settings']    || {}

      # Non-destructive merge: user settings override defaults without
      # mutating the loaded defaults hash (the original used `merge!`).
      #
      @module_config                    = @module_config_default_settings.merge(@module_config_user_settings)

      @feed_generation_path             = @module_config['path'].to_s.sub('feed.xml', 'for_categories')
      @feed_generation_enabled          = @module_config['enabled']

      @template_source_folder           = File.join(@project_path, @module_config['template_source_folder'].to_s)
      @template_name                    = @module_config['template_name']

      # Removed `@feed_output = @module_config['feed_output']` - the
      # ivar was assigned but never referenced anywhere in the plugin.

      if disabled_in_development?
        Jekyll.logger.info "J1 Feeds:", "skipped in mode development"
        return
      end

      if plugin_disabled?
        Jekyll.logger.info "J1 Feeds:", "disabled"
        return
      else
        Jekyll.logger.info "J1 Feeds:", "enabled"
      end

      if @module_config['excerpt_only']
        Jekyll.logger.info "J1 Feeds:", "generate rss feeds for: excerpts only"
      end

      if @module_config['posts_limit'].to_i < 100
        Jekyll.logger.info "J1 Feeds:", "generate rss feeds for: #posts of #{@module_config['posts_limit']}"
      else
        Jekyll.logger.info "J1 Feeds:", "generate rss feeds for: #posts of unlimited"
      end

      collections.each do |name, meta|
        Jekyll.logger.info "J1 Feeds:", "generate rss feeds for: all #{name}"
        (meta["categories"] + [nil]).each do |category|
          Jekyll.logger.info "J1 Feeds:", "generate rss feeds for posts by category: #{category}" if category
          path = feed_path(:collection => name, :category => category)

          # Honor the documented "rebuild on every build" toggle. The
          # defaults YAML ships the key as `rebuild_feed` (singular),
          # but the original code read `rebuild_feeds` (plural) - the
          # mismatch meant the option silently never took effect. We
          # accept either spelling for backwards compatibility with any
          # user configs that may have used the plural form. Also
          # removed a redundant re-assignment of `path` inside the
          # `unless` block (it was already computed above).
          #
          unless rebuild_feeds?
            if file_exists?(path)
              Jekyll.logger.info "J1 Feeds:", "feed already exist, skip rebuild"
              next
            end
          end

          @site.pages << make_page(path, :collection => name, :category => category)
        end
      end
      generate_feed_by_tag if config['tags'] && !@site.tags.empty?
    end

    private

    # Strip all whitespaces to minify the template.
    # The regex matches all whitespace that follows:
    #
    #   '>' which match a closed XML tag
    #   '}' which match a closed Liquid tag
    #
    MINIFY_REGEX = %r!(?<=>|})\s+!.freeze

    # Returns the plugin's config or an empty hash if not set
    #
    def config
      @config ||= @module_config || {}
    end

    # Resolve the rebuild flag from either the singular (`rebuild_feed`,
    # which matches the shipped defaults YAML) or the plural form
    # (`rebuild_feeds`, which matches the original Ruby code). Returns
    # true when feeds should be regenerated unconditionally.
    #
    def rebuild_feeds?
      flag = config['rebuild_feed']
      flag = config['rebuild_feeds'] if flag.nil?
      !!flag
    end

    # Safely load a YAML config file. Returns an empty hash if the file
    # is missing or cannot be parsed.
    #
    def load_yaml(path)
      return {} unless File.exist?(path)

      YAML.safe_load(
        File.read(path),
        permitted_classes: [Symbol, Date, Time],
        aliases: true
      ) || {}
    rescue StandardError => e
      Jekyll.logger.warn 'J1 Feeds:', "failed to read #{path}: #{e.message}"
      {}
    end

    # Determines the destination path of a given feed as:
    #
    # 'collection', the name of a collection (example: 'posts')
    # 'category', a category within that collection (example: 'news')
    #
    # Returns '/feed.xml' (default for posts) or the path specified in config
    # Returns `/feed/category.xml` for post categories
    # Returns `/feed/collection.xml` for other collections
    # Returns `/feed/collection/category.xml` for other collection categories
    #
    def feed_path(collection: "posts", category: nil)
      prefix = collection == "posts" ? "/feed" : "/feed/#{collection}"
      return "#{@feed_generation_path}/#{category.downcase}.xml" if category

      collections.dig(collection, "path") || "#{prefix}.xml"
    end

    # Returns a hash representing all collections to be processed
    # and their metadata in the form of:
    #   { collection_name => { categories = [...], path = '...' } }
    #
    def collections
      return @collections if defined?(@collections)

      @collections = case config["collections"]
                     when Array
                       config["collections"].map { |c| [c, {}] }.to_h
                     when Hash
                       config["collections"]
                     else
                       {}
                     end

      @collections = normalize_posts_meta(@collections)
      @collections.each_value do |meta|
        meta["categories"] = (meta["categories"] || []).to_set
      end

      @collections
    end

    def generate_feed_by_tag

      # Defensively coerce config['tags'] to a Hash BEFORE accessing
      # nested keys. The original sequence was:
      #
      #   tags_config = config['tags']
      #   enabled     = config['tags']['enabled']    # NoMethodError if not a Hash
      #   tags_config = {} unless tags_config.is_a?(Hash)
      #
      # i.e. the type guard ran AFTER the unsafe access, so `tags: true`
      # in user config would raise instead of being treated as off.
      #
      tags_config = config['tags'].is_a?(Hash) ? config['tags'] : {}
      enabled     = tags_config['enabled']

      except      = tags_config['except'] || []
      only        = tags_config['only']   || @site.tags.keys
      tags_pool   = only - except
      tags_path   = tags_config['path']   || '/feed/by_tag/'

      # enable|disable generation of feeds by tag
      #
      generate_tag_feed(tags_pool, tags_path) if enabled
    end

    def generate_tag_feed(tags_pool, tags_path)
      tags_pool.each do |tag|
        # allow only tags with basic alphanumeric characters and underscore
        # to keep feed path simple.
        # next if %r![^a-zA-Z0-9_]!.match?(tag)
        #
        next if %r!\W!.match?(tag)

        Jekyll.logger.info "J1 Feeds:", "generate rss feeds for posts by tag: #{tag}" if tag
        path = "#{tags_path}#{tag.downcase}.xml"

        # Honor the rebuild flag for tag feeds too. The original
        # unconditionally skipped existing files, which made tag feeds
        # impossible to refresh without a clean build - inconsistent
        # with the collection-feed loop above.
        #
        if file_exists?(path) && !rebuild_feeds?
          next
        end

        @site.pages << make_page(path, :tags => tag)
      end
    end

    # Path to the template file (feed.xml)
    #
    def feed_source_path
      @feed_source_path ||= File.expand_path @template_name, @template_source_folder
    end

    def feed_template
      @feed_template ||= File.read(feed_source_path).gsub(MINIFY_REGEX, "")
    end

    # Checks if a file already exists in the site source
    #
    def file_exists?(file_path)
      File.exist? @site.in_source_dir(file_path)
    end

    # Generates contents for a file
    #
    def make_page(file_path, collection: "posts", category: nil, tags: nil)
      PageWithoutAFile.new(@site, __dir__, "", file_path).tap do |file|
        file.content = feed_template
        file.data.merge!(
          "layout"     => nil,
          "sitemap"    => false,
          "xsl"        => file_exists?("feed.xslt.xml"),
          "collection" => collection,
          "category"   => category,
          "tags"       => tags
        )
        file.output
      end
    end

    # Special case the "posts" collection, which, for ease of use
    # and backwards compatability, can be configured via top-level keys or
    # directly as a collection
    #
    def normalize_posts_meta(hash)
      hash["posts"] ||= {}
      hash["posts"]["path"] ||= config["path"]
      hash["posts"]["categories"] ||= config["categories"]
      config["path"] ||= hash["posts"]["path"]
      hash
    end

    # Plugin is enabled when config['enabled'] is truthy. The original
    # used a 5-line if/else/return; the negated boolean read is clearer
    # and fails safe (missing config => disabled).
    #
    def plugin_disabled?
      !config['enabled']
    end

    def disabled_in_development?
      config && config['disable_in_development'] && Jekyll.env == 'development'
    end
  end

  class PageWithoutAFile < Jekyll::Page
    def read_yaml(*)
      @data ||= {}
    end
  end

  class MetaTag < Liquid::Tag
    # Use Jekyll's native relative_url filter
    #
    include Jekyll::Filters::URLFilters

    def render(context)
      # Jekyll::Filters::URLFilters requires `@context`
      # to be set in the environment.
      #
      @context = context

      config = context.registers[:site].config
      path   = config.dig("feed", "path") || "feed.xml"
      title  = config["title"] || config["name"]

      attributes = {
        :type => "application/atom+xml",
        :rel  => "alternate",
        :href => absolute_url(path),
      }
      attributes[:title] = title if title

      attrs = attributes.map { |k, v| "#{k}=#{v.to_s.encode(:xml => :attr)}" }.join(" ")
      "<link #{attrs} />"
    end
  end

end

Liquid::Template.register_tag "feed_meta", J1Feed::MetaTag
