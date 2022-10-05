# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/image-block.rb
# Asciidoctor extension for J1 Template
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2022 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# For details, see: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
#
# ------------------------------------------------------------------------------
# A block macro that embeds an Image Block into the output document
#
# Usage
#
#   .block_title
#   lightbox::block_id[images_width, images_data]
#
# Example:
#
#  .The image block title
#  lightbox::lightbox-example[300, "pages/roundtrip/100_present_images/image-1.jpg, description 1, pages/roundtrip/100_present_images/image-2.jpg, description 2" ]
#
# ------------------------------------------------------------------------------
include Asciidoctor

require 'builder'
require 'asciidoctor/extensions' unless RUBY_ENGINE == 'opal'

Asciidoctor::Extensions.register do

  class LightboxBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :lightbox
    name_positional_attributes 'size', 'image_data', 'group'
    default_attrs 'size' => 800

    def process parent, target, attrs

      html_block    = Builder::XmlMarkup.new(:indent => 2)
      imagesdir     = parent.attr 'imagesdir'
      images_hash   = Hash[*attrs['image_data'].split(',')]

      title_html    = (attrs.has_key? 'title') ? %(<div class="title">#{attrs['title']}</div>\n) : nil
      role          = (attrs.has_key? 'role') ? role : ''
      grouped       = (attrs.has_key? 'group') ? true : false

      # {attrs['role']}

      if grouped
        html_block.div(:class=>"content #{attrs['role']}", :style=>"margin-bottom: 1.75rem;") {
          images_hash.each do |i,d|
            image = i.strip
            descr = d.strip
            html_block.a(:class=>"notoc link-no-decoration",:href=>"#{imagesdir}/#{image}", :"data-lightbox"=>"lb-#{target}", :"data-title"=>"#{descr}"){
              html_block.img(:class=>"img-fluid", :src=>"#{imagesdir}/#{image}", :alt=>"#{attrs['title']}", :width=>"#{attrs['size']}")
            }
          end
        }
      else
        html_block.div(:class=>"content #{attrs['role']}", :style=>"margin-bottom: 1.75rem;") {
          images_hash.each do |i,d|
            image = i.strip
            descr = d.strip
            html_block.a(:class=>"notoc link-no-decoration", :href=>"#{imagesdir}/#{image}", :"data-lightbox"=>"#{image}", :"data-title"=>"#{descr}"){
              html_block.img(:class=>"img-fluid", :src=>"#{imagesdir}/#{image}", :alt=>"#{attrs['title']}", :width=>"#{attrs['size']}")
            }
          end
        }
      end
      content = html_block.target! # See: https://stackoverflow.com/questions/4961609/extra-to-s-when-using-builder-to-generate-xml

      html = %(
        <div id="lb-#{target}" class="imageblock">
          #{title_html}
          #{content}
        </div>
      )

      create_pass_block parent, html, attrs, subs: nil
    end
  end
  block_macro LightboxBlockMacro
end
