# ------------------------------------------------------------------------------
# ~/Gemfile (runtime)
# Provides package information to bundle all Ruby gem needed
# for Jekyll and J1 template (managed by Ruby Gem Bundler)
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2022 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/J1 Template/blob/master/LICENSE
# ------------------------------------------------------------------------------
#
#  To install all gem needed for Jekyll and J1 Template
#
#  bundle install
#
#  Note:  If all packages needed are installed, a list of all gem
#         and dependencies installed for the bundle can created
#         by running:
#
#         bundle list
#
# ------------------------------------------------------------------------------
#
#  If you see warnings like:
#
#   WARN: Unresolved specs during Gem::Specification.reset
#         cleanup your bundle by running:
#
#         gem cleanup
#
# ------------------------------------------------------------------------------
source 'https://rubygems.org'

# ------------------------------------------------------------------------------
# Jekyll
# NOTE: J1 Template is using Jekyll v3.8 and above
#

# ------------------------------------------------------------------------------
# Use Jekyll version from GH master
#
# Support for Ruby version 2.7 (DEC 2019)
# See: https://github.com/jekyll/jekyll/issues/8049
# gem 'jekyll', github: 'jekyll/jekyll'

# ------------------------------------------------------------------------------
# Use Jekyll version from RubyGems
#
gem 'jekyll', '~> 4.2'

# Theme Rubies, default: J1 Template (NOT used for the development system)
#
gem 'j1-template', '~> 2022.4.4'

# ------------------------------------------------------------------------------
# PRODUCTION: Gem needed for the Jekyll and J1 prod environment
#

# ------------------------------------------------------------------------------
# Code Highlighter Rouge
#
gem 'rouge', '~> 3.3'

# ------------------------------------------------------------------------------
# XML|HTML processing
#
gem 'builder', '~> 3.2'
gem 'nokogiri', '>= 1.10.3'
gem 'nokogiri-pretty', '>= 0.1.0'
gem 'htmlbeautifier', '>= 1.2.1'

# ------------------------------------------------------------------------------
# Gem needed to compress JS and JSON files
#
gem 'uglifier', '~> 4.2'
gem 'json-minify', '~> 0.0.3'

# ------------------------------------------------------------------------------
# Gem needed to run JS to create Lunr the index
#
gem 'execjs', '~> 2.7'

# ------------------------------------------------------------------------------
# Timezone support (multi-platform)
#
gem 'tzinfo', '>= 1.2.2'

# ------------------------------------------------------------------------------
# Platform specific Gem
#

# Windows does not include zoneinfo files (timezone support).
# To provide zoneinfo, tzinfo-data gem is bundled on win platforms
#
gem 'tzinfo-data' if Gem.win_platform?

# Windows Directory Monitor (WDM) monitor directories
# for changes
#
gem 'wdm', '>= 0.1.1' if Gem.win_platform?

# ------------------------------------------------------------------------------
# Jekyll Plugins
# If any (additional) plugins are used, they goes here:
# ------------------------------------------------------------------------------
# NOTE: asciidoctor v2.x (automatically loaded via ???) creates corrupted
#  asciidoctor-rouge output. Currently, older/latest version v1.x is used
#
group :jekyll_plugins do
# gem 'algolia', '~> 2.0', '>= 2.0.4'                                           # New/latest (Jekyll-)Algolia gem
  gem 'asciidoctor', '= 1.5.8'                                                  # See notes!!!
# gem 'asciidoctor-pdf', '>= 1.5.4'                                             # Used for PDF creation only
  gem 'asciidoctor-rouge', '>= 0.4.0'
  gem 'jekyll-asciidoc', '>= 3.0.0'
# gem 'jekyll-feed', ">= 0.15.1"
# gem 'jekyll-gist', '>= 1.5.0'                                                 # Useful ???
# gem 'jekyll-redirect-from', '>= 0.16.0'                                       # Useful ???
# gem 'jekyll-sass-converter', '>= 2.1.0'                                       # Used if SASS (file) conversion is enabled
  gem 'jekyll-sitemap', '>= 1.2.0'
  gem 'j1-paginator', '>= 2021.1.1'                                             # New version !!!
end

# ------------------------------------------------------------------------------
# Web Application specific RubyGems
#

# ------------------------------------------------------------------------------
# Define your Ruby version if the J1 web is used as an container-based
# web application, e.g. on Docker or a Heroku Dyno, to define and use
# of identical Ruby runtime environments.
#
# ruby '2.7.2'

# ------------------------------------------------------------------------------
# Enable the `rake` Gem if needed. For container-based apps, Rake can
# be used as a pre-processor engine running # tasks defined by a
# Rakefile prior running the app|web.
#
# gem 'rake', '~> 12.0'

# html-proofer. Automate the process of checking links on your site
#
#   bundle exec htmlproofer \
#     --allow_missing_href \
#     --allow_hash_href \
#     --assume_extension \
#     --directory_index_file \
#     --directory_index_file \
#     --empty_alt_ignore ./_site/index.html &> out.txt
#
# gem 'html-proofer', '~> 3.10'

# ------------------------------------------------------------------------------
# Define the build environment and the web server for J1 sites that
# runs as an web application. To improve the production (run-time)
# performance for the web, the RubyGems e.g Puma or Passenger can be
# used to replace the internal server WEBrick used by Jekyll for
# default.
# The web server Puma, a multi-threaded native Ruy-based web server
# can be used on ALL platforms. Passenger integrates the web server
# NginX but supported for Linux and Unix platforms only.
# For container-based apps, Rake can be used as a pre-processor engine
# running # tasks defined by a Rakefile prior running the app|web.
#
# gem 'passenger', '>= 5.3'
gem 'puma', '>= 5.5.2'

# ------------------------------------------------------------------------------
# OpenSSL provides SSL, TLS and general purpose cryptography. Used to
# encrypt 'private' data
# NOTE: currently NOT used
#
# gem 'openssl'

# ------------------------------------------------------------------------------
# If J1 is transformed into a (Rack and Sinatra based) Web
# application, the site can be secured using user authentication
# for accessing private pages. J1 is using the Omniauth stack for
# authentication. For default, the Omniauth (authentication) strategies
# for Github, Twitter, Facebook and Patreon are implemented.
#
gem 'rack', '~> 2.2', '>= 2.2.3'
gem 'rack-protection', '~> 2.0'
gem 'rack-ssl-enforcer', '~> 0.2'
gem 'rest-client', '~> 2.0'

# NOTE: For the base gem omniauth, the currtent version >= 2 cannot be
#       used. For unknown reason, a WRONG redirect URL is calculated
#       e.g. for strategy oauth2/github
#
#       Wrong:    http://localhost:xxx/auth/github
#       Correct:  https://github.com/login?client_id=xx&return=yyy
#
# gem 'omniauth', '~> 2.0'

gem 'omniauth', '~> 1.0'                                                        # latest: 1.9.1
gem 'omniauth-oauth2', '~> 1.7'

gem 'sinatra', '~> 2.0'
gem 'warden', '~> 1.2'

# ------------------------------------------------------------------------------
# Gem needed for J1 logger based on log4r (middleware)
#
gem 'log4r', '~> 1.1', '>= 1.1.10'
gem 'date', '~> 2.0'

# ------------------------------------------------------------------------------
# DEVELOPMENT: Gem needed for the Jekyll and J1 dev environment
#

# For the build (npm|yarn), J1 Template is using scss_lint
# for linting the SCSS (CSS) components:
#
gem 'scss_lint', '~> 0.56.0'
gem 'sass', '~> 3.5.0'
gem 'bump', '~> 0.8'

# ------------------------------------------------------------------------------
# END
