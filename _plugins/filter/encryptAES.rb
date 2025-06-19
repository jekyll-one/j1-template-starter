# ------------------------------------------------------------------------------
# ~/_plugins/filter/encode64JSON.rb
# Liquid filter for J1 Theme to Base64 encode a JSON string
#
# Product/Info:
# http://jekyll.one
#
# Copyright (C) 2023-2025 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE
# ------------------------------------------------------------------------------
#  NOTE:
#  CustomFilters cannot be used in SAFE mode (e.g not usable for
#  rendering pages with Jekyll on GitHub
#
#  USAGE:
#    {% capture cache_name %}
#
#      liquid code to generate HTML output goes here
#
#    {% endcapture %}
#    {{ cache_name | uglify }}
# ------------------------------------------------------------------------------
# noinspection SpellCheckingInspection
# rubocop:disable Lint/UnneededDisable
# rubocop:disable Style/Documentation
# rubocop:disable Metrics/LineLength
# rubocop:disable Layout/TrailingWhitespace
# rubocop:disable Layout/SpaceAroundOperators
# rubocop:disable Layout/ExtraSpacing
# rubocop:disable Metrics/AbcSize
# ------------------------------------------------------------------------------
require 'openssl'
require 'base64'

module Jekyll
  module EncryptAES
    def encryptAES(input)
      aes = OpenSSL::Cipher::Cipher.new('aes-128-cbc')
      aes.encrypt

      aes.key = '8c841fc2e3aa2bd5'
      aes.iv = '0000000000000000'

      encrypted = aes.update(input) + aes.final
      encoded = Base64.encode64(encrypted)
      input = encoded
    end
  end
end

Liquid::Template.register_filter(Jekyll::EncryptAES)
