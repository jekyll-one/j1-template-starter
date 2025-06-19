# ------------------------------------------------------------------------------
# ~/_plugins/j1-sitemap.rb
# Generate Sitemap Files of a site
#
# Product/Info:
# http://jekyll.one
#
# Copyright (C) 2022 Ben Balter and Contributors
# Copyright (C) 2023-2025 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE
# ------------------------------------------------------------------------------
# frozen_string_literal: true

require "fileutils"

module Jekyll
  class J1Sitemap < Jekyll::Generator
    safe true
    priority :lowest

    # Main plugin action, called by Jekyll-core
    def generate(site)
      @site = site

      @mode                             = site.config['environment']
      @template                         = site.config['theme']
      @project_path                     = File.join(File.dirname(__FILE__)).sub('_plugins/seo', '')
      @plugin_data_path                 = File.join(@project_path, site.config['data_dir'])
      @module_config_path               = File.join(@project_path, site.config['data_dir'], 'plugins')

      @module_config_default            = YAML::load(File.open(File.join(@module_config_path, 'defaults', 'sitemap.yml')))
      @module_config_user               = YAML::load(File.open(File.join(@module_config_path, 'sitemap.yml')))

      @module_config_default_settings   = @module_config_default['defaults']
      @module_config_user_settings      = @module_config_user['settings']
      @module_config                    = @module_config_default_settings.merge!(@module_config_user_settings)

      @template_source_folder           = File.join(@project_path, @module_config['template_source_folder'])
      @robots_theme_name             = @module_config['robots_theme_name']
      @sitemap_theme_name            = @module_config['sitemap_theme_name']

      @robots_source_path ||= File.expand_path @robots_theme_name, @template_source_folder
      @sitemap_source_path ||= File.expand_path @sitemap_theme_name, @template_source_folder

      if plugin_disabled?
        Jekyll.logger.info "J1 Sitemap:", "disabled"
        return
      else
        Jekyll.logger.info "J1 Sitemap:", "enabled"
        Jekyll.logger.info "J1 Sitemap:", "generate sitemap files"
      end
    
      @site.pages << sitemap unless file_exists?("sitemap.xml")
      @site.pages << robots unless file_exists?("robots.txt")
    end

    private

    INCLUDED_EXTENSIONS = %w(
      .htm
      .html
      .xhtml
      .pdf
      .xml
    ).freeze

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

    # Matches all whitespace that follows
    #   1. A '>' followed by a newline or
    #   2. A '}' which closes a Liquid tag
    # We will strip all of this whitespace to minify the template
    MINIFY_REGEX = %r!(?<=>\n|})\s+!.freeze

    # Array of all non-jekyll site files with an HTML extension
    def static_files
      @site.static_files.select { |file| INCLUDED_EXTENSIONS.include? file.extname }
    end

    # Path to sitemap.xml template file
    def source_path(file = "sitemap.xml")
       File.expand_path "../#{file}", __dir__
    end

    # Destination for sitemap.xml file within the site source directory
    def destination_path(file = "sitemap.xml")
      @site.in_dest_dir(file)
    end

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
