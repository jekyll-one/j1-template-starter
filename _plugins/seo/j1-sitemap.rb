# ------------------------------------------------------------------------------
# ~/_plugins/j1-sitemap.rb
# Generate Sitemap Files of a site
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
# frozen_string_literal: true
#
require "fileutils"
require "yaml"
require "date"

module Jekyll
  class J1Sitemap < Jekyll::Generator
    safe true
    priority :lowest

    # Main plugin action, called by Jekyll-core
    #
    def generate(site)
      @site = site

      @mode                             = site.config['environment']
      @template                         = site.config['theme']

      # Resolve config paths relative to the Jekyll source directory.
      # The original `File.dirname(__FILE__).sub('_plugins/seo', '')`
      # was a no-op (the segment '_plugins/seo' never appears in
      # __FILE__), which left @project_path pointing at _plugins
      # instead of the site root. `site.source` is authoritative.
      #
      @project_path                     = site.source
      @plugin_data_path                 = File.join(@project_path, site.config['data_dir'])
      @module_config_path               = File.join(@plugin_data_path, 'plugins')

      # Safely load default + user settings. Replaces the original
      # `YAML::load(File.open(...))` calls which leaked file handles,
      # used the unsafe loader, and crashed on a missing file.
      #
      default_yaml                      = load_yaml(File.join(@module_config_path, 'defaults', 'sitemap.yml'))
      user_yaml                         = load_yaml(File.join(@module_config_path, 'sitemap.yml'))

      @module_config_default_settings   = default_yaml['defaults'] || {}
      @module_config_user_settings      = user_yaml['settings']    || {}

      # Non-destructive merge: user settings override defaults without
      # mutating the loaded defaults hash (the original used `merge!`).
      #
      @module_config                    = @module_config_default_settings.merge(@module_config_user_settings)

      @template_source_folder           = File.join(@project_path, @module_config['template_source_folder'].to_s)
      @robots_theme_name                = @module_config['robots_theme_name']
      @sitemap_theme_name               = @module_config['sitemap_theme_name']

      # Resolve the list of file extensions to include in the sitemap.
      # Configurable via `includedFileExtensions` in sitemap.yml; falls
      # back to DEFAULT_INCLUDED_EXTENSIONS when the key is missing,
      # nil, or empty. Each entry is normalized so users may write
      # either ".html" or "html" (defaults).
      #
      @included_file_extensions         = normalize_extensions(@module_config['includedFileExtensions'])
      @included_file_extensions         = DEFAULT_INCLUDED_EXTENSIONS if @included_file_extensions.empty?

      @robots_source_path             ||= File.expand_path @robots_theme_name.to_s,  @template_source_folder
      @sitemap_source_path            ||= File.expand_path @sitemap_theme_name.to_s, @template_source_folder

      if plugin_disabled?
        Jekyll.logger.info "J1 Sitemap:", "disabled"
        return
      else
        Jekyll.logger.info "J1 Sitemap:", "enabled"
        Jekyll.logger.info "J1 Sitemap:", "generate sitemap files"
      end

      @site.pages << sitemap unless file_exists?("sitemap.xml")
      @site.pages << robots  unless file_exists?("robots.txt")
    end

    private

    # Fallback list used only when sitemap.yml does not provide
    # `includedFileExtensions`. Renamed from INCLUDED_EXTENSIONS to
    # make the "default / fallback" role explicit at the call site.
    #
    DEFAULT_INCLUDED_EXTENSIONS = %w(
      .htm
      .html
    ).freeze

    # Returns the plugin's config or an empty hash if not set
    #
    def config
      @config ||= @module_config || {}
    end

    # Plugin is enabled when config['enabled'] is truthy. The original
    # used a 5-line if/else/return; the negated boolean read is clearer
    # and fails safe (missing config => disabled).
    #
    def plugin_disabled?
      !config['enabled']
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
      Jekyll.logger.warn 'J1 Sitemap:', "failed to read #{path}: #{e.message}"
      {}
    end

    # Normalize a list of file extensions read from YAML config.
    # Accepts nil, a single string, or an array; returns a frozen
    # array of lowercase, dot-prefixed strings. Blank and non-string
    # entries are dropped, so a malformed YAML list cannot poison the
    # extension comparison performed in `static_files`.
    #
    def normalize_extensions(value)
      Array(value)
        .map  { |ext| ext.to_s.strip }
        .reject(&:empty?)
        .map  { |ext| ext.start_with?('.') ? ext.downcase : ".#{ext.downcase}" }
        .uniq
        .freeze
    end

    # Matches all whitespace that follows
    #
    #   1. A '>' followed by a newline or
    #   2. A '}' which closes a Liquid tag
    #
    # We will strip all of this whitespace to minify the template.
    #
    MINIFY_REGEX = %r!(?<=>\n|})\s+!.freeze

    # Array of all non-jekyll site files whose extension is in the
    # configured include list (`includedFileExtensions` from
    # sitemap.yml). The comparison is case-insensitive, matching the
    # normalization applied in `normalize_extensions`.
    #
    def static_files
      @site.static_files.select { |file| @included_file_extensions.include?(file.extname.to_s.downcase) }
    end

    # Removed the `source_path` and `destination_path` private helpers -
    # neither was referenced anywhere in the plugin. The actual paths
    # are resolved via `@sitemap_source_path` / `@robots_source_path`
    # from the merged config.
    #
    def sitemap
      site_map                      = PageWithoutAFile.new(@site, @template_source_folder, "", @sitemap_theme_name)
      site_map.content              = File.read(@sitemap_source_path).gsub(MINIFY_REGEX, "")
      site_map.data["layout"]       = nil
      site_map.data["static_files"] = static_files.map(&:to_liquid)
      site_map.data["xsl"]          = file_exists?("sitemap.xsl")
      site_map
    end

    def robots
      robots                        = PageWithoutAFile.new(@site, @template_source_folder, "", "robots.txt")
      robots.content                = File.read(@robots_source_path)
      robots.data["layout"]         = nil
      robots
    end

    # Checks if a file already exists in the site source
    #
    def file_exists?(file_path)
      pages_and_files.any? { |p| p.url == "/#{file_path}" }
    end

    def pages_and_files
      @pages_and_files ||= @site.pages + @site.static_files
    end
  end
end

module Jekyll
  class PageWithoutAFile < Page
    # rubocop:disable Naming/MemoizedInstanceVariableName
    def read_yaml(*)
      @data ||= {}
    end
    # rubocop:enable Naming/MemoizedInstanceVariableName
  end
end