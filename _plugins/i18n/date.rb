# Taken from https://github.com/uwolf/jekyll-i18n-date

# ------------------------------------------------------------------------------
# ~/_plugins/date-i18n.rb
# Plugin for DateTime Localization in Jekyll
#
# Product/Info:
# http://jekyll.one
#
# Copyright (C) 2022 Juergen Adams
# Copyright (c) 2018 Ulrich Wolf
#
# J1 Theme is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
# jekyll-i18n-date is licensed under the MIT License.
# See: https://github.com/uwolf/jekyll-i18n-date/blob/master/LICENSE
# ------------------------------------------------------------------------------
# Example|s:
#  {{ page.date | localize: "%d.%m.%Y" }}
#  {{ post.date | localize: "%d.%m.%Y", "de" }}
# ------------------------------------------------------------------------------
require 'i18n'

module Jekyll
  # i18n filter for jekyll
  module I18nFilter
    # Example:
    #   {{ post.date | localize: "%d.%m.%Y" }}
    #   {{ post.date | localize: ":short" }}
    def localize(input, format = nil, locale = nil)

			# Side effects: changes I18n.config, must run before current_locale is set
      load_translations

			input = Time.at(input) if input.class == Integer

      format = format =~ /^:(\w+)/ ? Regexp.last_match(1).to_sym : format

			if input && locale = current_locale(locale)

				I18n.locale = locale
				I18n.l(input, format: format)
			else
				input
			end
		end

    def load_translations
      return false unless I18n.backend.send(:translations).empty?
      filename = File.join(File.dirname(__FILE__), '../../_data/locales/*.yml')
			I18n.backend.load_translations Dir[filename]
    end

		def current_locale(locale)
			l = locale || @context.registers[:page]['language'] || @context.registers[:site].config['language']

			if l && I18n.config.available_locales.include?(l.to_sym)
				l
			else
				false
			end
		end

  end
end

Liquid::Template.register_filter(Jekyll::I18nFilter)
