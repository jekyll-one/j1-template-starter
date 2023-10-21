# ------------------------------------------------------------------------------
# ~/_plugins/j1-feed.rb
# Generate RSS feeds for all posts of a site
#
# Product/Info:
# http://jekyll.one
#
# Copyright (C) 2022 Ben Balter and Contributors
# Copyright (C) 2023 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
# ------------------------------------------------------------------------------
require 'jekyll'
require 'fileutils'

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
      @project_path                     = File.join(File.dirname(__FILE__)).sub('_plugins/seo', '')
      @plugin_data_path                 = File.join(@project_path, site.config['data_dir'])
      @module_config_path               = File.join(@project_path, site.config['data_dir'], 'plugins')

      @module_config_default            = YAML::load(File.open(File.join(@module_config_path, 'defaults', 'feed.yml')))
      @module_config_user               = YAML::load(File.open(File.join(@module_config_path, 'feed.yml')))

      @module_config_default_settings   = @module_config_default['defaults']
      @module_config_user_settings      = @module_config_user['settings']
      @module_config                    = @module_config_default_settings.merge!(@module_config_user_settings)

      @feed_generation_path             = @module_config['path'].sub('feed.xml', 'for_categories')
      @feed_generation_enabled          = @module_config['enabled']

      @template_source_folder           = File.join(@project_path, @module_config['template_source_folder'])
      @template_name                    = @module_config['template_name']
      @feed_output                      = @module_config['feed_output']

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

      if @module_config['posts_limit'] < 100
        Jekyll.logger.info "J1 Feeds:", "generate rss feeds for: #posts of #{@module_config['posts_limit']}"
      else
        Jekyll.logger.info "J1 Feeds:", "generate rss feeds for: #posts of unlimited"
      end

      collections.each do |name, meta|
        Jekyll.logger.info "J1 Feeds:", "generate rss feeds for: all #{name}"
        (meta["categories"] + [nil]).each do |category|
          Jekyll.logger.info "J1 Feeds:", "generate rss feeds for posts by category: #{category}" if category
          path = feed_path(:collection => name, :category => category)

          # rebuild the feed xml file?
          #
          unless @module_config['rebuild_feeds']
            path = feed_path(:collection => name, :category => category)
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
    # The regex matches all whitespace that follows
    #   '>' which match a closed XML tag
    #   '}' which match a closed Liquid tag
    #
    MINIFY_REGEX = %r!(?<=>|})\s+!.freeze

    # Returns the plugin's config or an empty hash if not set
    #
    def config
      @config ||= @module_config  || {}
    end

    # Determines the destination path of a given feed as:
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
      tags_config = config['tags']
      enabled     = config['tags']['enabled']
      tags_config = {} unless tags_config.is_a?(Hash)

      except      = tags_config["except"] || []
      only        = tags_config["only"] || @site.tags.keys
      tags_pool   = only - except
      tags_path   = tags_config["path"] || "/feed/by_tag/"

      # enable|disable generation of feeds by tag
      #
      generate_tag_feed(tags_pool, tags_path) if enabled
    end

    def generate_tag_feed(tags_pool, tags_path)
      tags_pool.each do |tag|
        # allow only tags with basic alphanumeric characters and underscore
        # to keep feed path simple.
        #
        # next if %r![^a-zA-Z0-9_]!.match?(tag)
        next if %r!\W!.match?(tag)

        Jekyll.logger.info "J1 Feeds:", "generate rss feeds for posts by tag: #{tag}" if tag
        path = "#{tags_path}#{tag.downcase}.xml"
        next if file_exists?(path)

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

    # Check if plugin is enabled|disabled
    #
    def plugin_disabled?
      if config['enabled']
        false
      else
        true
      end
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
    include Jekyll::Filters::URLFilters

    def render(context)
      # Jekyll::Filters::URLFilters requires `@context`
      # to be set in the environment.
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
