# ------------------------------------------------------------------------------
# ~/_plugins/lunr_index.rb
# Creates an Lunr index file (json) to be used by J1 Lunr
#
# Product/Info:
# http://jekyll.one
#
# Copyright (C) 2022 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/J1 Template/blob/master/LICENSE
# ------------------------------------------------------------------------------
require 'fileutils'
require 'net/http'
require 'json'
require 'uri'
require 'execjs'
require 'yaml'

module Jekyll
  module J1LunrSearch
    #noinspection RubyTooManyInstanceVariablesInspection
    class Indexer < Jekyll::Generator
      def initialize(config = {})
        super(config)

        @mode = config['environment']
        @template = config['theme']

        @module_path = File.join(File.dirname(__FILE__))
        @module_path.slice! '_plugins'
        @module_config_path = File.join(@module_path, config['data_dir'], 'modules')
        @j1_config_path = config['data_dir']

        @j1_config = YAML::load(File.open(File.join(@j1_config_path, 'j1_config.yml')))

        @module_config_default = YAML::load(File.open(File.join(@module_config_path, 'defaults', 'lunr.yml')))
        @module_config_user = YAML::load(File.open(File.join(@module_config_path,'lunr.yml')))

        @module_config_default_settings = @module_config_default['defaults']
        @module_config_user_settings = @module_config_user['settings']
        @module_config = @module_config_default_settings.merge!(@module_config_user_settings)

        @lunr_config = {
          'excludes' => [],
          'strip_index_html' => false,
          'min_length' => 3,
          'stopwords' => 'stopwords.txt',
          'fields' => {
            'title' => 10,
            'tagline' => 10,
            'tags' => 20,
            'categories' => 20,
            'description' => 20,
            'body' => 1
          }
        }.merge!(@module_config || {})

        @lunr_config.merge!(@j1_config['posts'])

        @module_dir = @lunr_config['module_dir']
        @index_dir  = @lunr_config['index_dir']
        @index_name = @lunr_config['index_name']

        # calculate the module path
        # if NO template GEM is used (dev system), @module_path points
        # in the project folder, otherwise (runtime system) to the Ruby
        # GEM installation folder!
        #
        if @template.nil?
          @module_path = File.join(File.dirname(__FILE__), '../', @module_dir)
        else
          @gem_path    = `bundle info --path j1-template`
          @module_path = File.join(@gem_path.chomp, @module_dir)
        end

        @lunr_path = File.join(@module_path, 'lunr.min.js')
        raise "Could not find #{@lunr_path}" unless File.exist?(@lunr_path)

        lunr_src = open(@lunr_path).read
        ctx = ExecJS.compile(lunr_src)

        @docs = {}
        @excludes = @lunr_config['excludes']

        # if web host supports index.html as default doc, then
        # optionally exclude it from the url
        #
        @strip_index_html = @lunr_config['strip_index_html']

        # @strip_categories configuration
        #
        @strip_categories = @lunr_config['category_blacklist']
        @stripped_categories = @strip_categories.join(',').gsub!(',', ' ')

        # stop word exclusion configuration
        #
        @min_length = @lunr_config['min_length']
        @stopwords_file = @lunr_config['stopwords']

      end

      # Index all pages except pages matching any value in config['lunr_excludes']
      # or with frontmatter settings (exclude_from_search: true)
      #
      def generate(site)

        @site = site
        index_dest = @site.instance_variable_get(:@dest)
        rebuild = @module_config['rebuild']
        index_file = index_dest + @module_config['index_file']

        if @module_config['rebuild'] == false
          if File.exist?(index_file)
            Jekyll.logger.info 'J1 Lunr:', 'recreate index disabled.'
            # Keep the index file from being cleaned by Jekyll
            #
            site.static_files << SearchIndexFile.new(site, site.dest, '/', @module_config['index_file'])
            return
          end
        end

        Jekyll.logger.info 'J1 Lunr:', 'creating search index ...'

        # gather posts and pages
        #
        items = pages_to_index(site)
        content_renderer = PageRenderer.new(site)
        # index = []
        # rebuild = @module_config['rebuild']

        index_js = open(@lunr_path).read

        # NOTE: all settings must be added within the index function
        #
        index_js << 'var idx = lunr(function() {'

        @lunr_config['fields'].each_pair do |name, boost|
            index_js << "this.field('#{name}', {'boost': #{boost}});"
        end

        items.each_with_index do |item, i|
          entry = SearchEntry.create(item, content_renderer)

          entry.strip_index_suffix_from_url! if @strip_index_html
          entry.strip_stopwords!(stopwords, @min_length) if File.exists?(@stopwords_file)

          doc = {
            'id'          => i,
            'title'       => entry.title,
            'tagline'     => entry.tagline,
            'url'         => entry.url,
            'date'        => entry.date,
            'tags'        => entry.tags,
            'categories'  => entry.categories,
            'description' => entry.description,
            'is_post'     => entry.is_post,
            'body'        => entry.body
          }

          # remove unwanted categories (if any)
          #
          doc['categories'] -= @strip_categories unless doc['categories'] == nil

          index_js << 'this.add(' << ::JSON.generate(doc, quirks_mode: true) << ');'

          # reduce the size of the doc array by deleting the body key
          #
          doc.delete('body')
          @docs[i] = doc

        end
        index_js << '});'

        filename  = File.join(@index_dir, "#{@index_name}")
        ctx       = ExecJS.compile(index_js)
        index     = ctx.eval('JSON.stringify(idx)')

        total     = {
          'docs'  => @docs,
          'index' => ::JSON.parse(index, {:max_nesting => false})
        }
        filepath  = File.join(site.dest, filename)

        # create data path if not already exists
        #
        FileUtils.mkdir_p(File.dirname(filepath))
        File.open(filepath, 'w') { |f| f.write(JSON.dump(total)) }
        Jekyll.logger.info 'J1 Lunr:', "finished, index ready."
        added_files = [filename]

        # Keep the written files from being cleaned by Jekyll
        #
        added_files.each do |fname|
          site.static_files << SearchIndexFile.new(site, site.dest, '/', fname)
        end
      end

      private

      # load the stopwords (file)
      #
      def stopwords
        @stopwords ||= IO.readlines(@stopwords_file).map { |l| l.strip }
      end

      def output_ext(doc)
        if doc.is_a?(Jekyll::Document)
          Jekyll::Renderer.new(@site, doc).output_ext
        else
          doc.output_ext
        end
      end

      def pages_to_index(site)
        items = []

        # deep copy pages and documents (all collections, including posts)
        #
        site.pages.each {|page| items << page.dup }
        site.documents.each {|document| items << document.dup }

        # process only files that will be converted to .html and only
        # non excluded files
        #
        items.select! {|i| i.respond_to?(:output_ext) && output_ext(i) == '.html' && ! @excludes.any? {|s| (i.url =~ Regexp.new(s)) != nil } }
        items.reject! {|i| i.data['exclude_from_search'] }

        # jadams, 2012-08-04
        # TODO: List of excludes should (alternatively) be taken from
        #       quicksearch.yml configuration

        items
      end
    end
  end
end

require 'nokogiri'
module Jekyll
  module J1LunrSearch
    class PageRenderer
      def initialize(site)
        @site = site
      end

      # render item, but without using its layout
      #
      def prepare(item)
        layout = item.data['layout']
        begin
          item.data['layout'] = nil

          if item.is_a?(Jekyll::Document)
            output = Jekyll::Renderer.new(@site, item).run
          else
            item.render({}, @site.site_payload)
            output = item.output
          end
        ensure
          # restore original layout
          #
          item.data['layout'] = layout
        end

        output
      end

      # render the item, parse the output and get all text elements
      #
      def render(item)
        layoutless = item.dup
        Nokogiri::HTML(prepare(layoutless)).text
      end
    end
  end
end

require 'nokogiri'
module Jekyll
  module J1LunrSearch
    #noinspection RubyTooManyInstanceVariablesInspection
    class SearchEntry
      def self.create(site, renderer)
        if site.is_a?(Jekyll::Page) or site.is_a?(Jekyll::Document)

          if defined?(site.date)
            date = site.date
          elsif defined?(site.data['date'])
            date = site.data['date']
          else
            date = '2022-01-01 00:00:00'
          end

          tagline     = site.data['tagline']
          tags        = site.data['tags']
          categories  = site.data['categories']
          description = site.data['description']
          title, url  = extract_title_and_url(site)
          is_post     = site.is_a?(Jekyll::Document)
          body        = renderer.render(site)

          if description.nil? || description.length == 0
            description = 'No description available.'
          end

          if site.is_a?(Jekyll::Document)
            excerpt = extract_excerpt(site)
            unless excerpt.nil? || excerpt.length == 0
              description = excerpt
            end
          end

          SearchEntry.new(title, tagline, url, date, tags, categories, description, is_post, body, renderer)
        else
          raise 'Not supported'
        end
      end

      def self.extract_title_and_url(item)
        data = item.to_liquid
        [ data['title'], data['url'] ]
      end

      def self.extract_excerpt(item)
        data = item.to_liquid
        parsed_data = Nokogiri::HTML.parse(data['excerpt']).text
        parsed_data.gsub!(/\n+/, ' ')
        parsed_data.gsub!(/^\s+/, '')
        parsed_data.gsub!(/\s+$/, '')
      end

      attr_reader :title, :tagline, :url, :date, :tags, :categories, :description, :is_post, :body, :collection

      def initialize(title, tagline, url, date, tags, categories, description, is_post, body, collection)
        @title, @tagline, @url, @date,@tags,  @categories, @description, @is_post, @body, @collection = title, tagline, url, date, tags, categories, description, is_post, body, collection
      end

      def strip_index_suffix_from_url!
        @url.gsub!(/index\.html$/, '')
      end

      # remove anything that is in the stop words list from
      # the text to be indexed
      #
      def strip_stopwords!(stopwords, min_length)
        #noinspection RubyParenthesesAfterMethodCallInspection
        @body = @body.split.delete_if() do |x|
          t = x.downcase.gsub(/[^a-z]/, '')
          t.length < min_length || stopwords.include?(t)
        end.join(' ')
      end
    end
  end
end

module Jekyll
  module J1LunrSearch
    class SearchIndexFile < Jekyll::StaticFile
      # Override write as the lunr index file has been
      # already created
      #
      def write(dest)
        true
      end
    end
  end
end

module Jekyll
  module J1LunrSearch
    VERSION = '2022.5.1.rc1'
  end
end
