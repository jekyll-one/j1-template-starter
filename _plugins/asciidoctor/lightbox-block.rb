# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/image-block.rb
# Asciidoctor extension for J1 Theme
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2023-2025 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# For details, see: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE
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
#  lightbox::lightbox-example[450, "assets/image/module/gallery/old_times/image_01.jpg, description 1, assets/image/module/gallery/old_times/image_02.jpg, description 2" ]
#
# ------------------------------------------------------------------------------
include Asciidoctor

require 'builder'
require 'asciidoctor/extensions' unless RUBY_ENGINE == 'opal'

Asciidoctor::Extensions.register do

  class LightboxBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :lightbox
    name_positional_attributes 'size', 'image_data', 'group', 'role'
    default_attributes 'size' => 800,
                        'role' => 'mt-3 mb-3'

    def process parent, target, attributes

      html_block    = Builder::XmlMarkup.new(:indent => 2)
      imagesdir     = parent.attr 'imagesdir'
      images_hash   = Hash[*attributes['image_data'].split(',')]
      title_html    = (attributes.has_key? 'title') ? %(<div class="lightbox-title"> <i class="mdib mdib-lightbulb-on  mdib-24px mr-2"></i> #{attributes['title']} </div>\n) : nil

      role          = (attributes.has_key? 'role') ? role : ''
      grouped       = (attributes.has_key? 'group') ? true : false

      if grouped
        html_block.div(:class=>"content", :style=>"margin-bottom: 1.75rem;") {
          images_hash.each do |i,d|
            image = i.strip
            descr = d.strip
            html_block.a(:class=>"notoc link-no-decoration",:href=>"#{imagesdir}/#{image}", :"data-lightbox"=>"lb-#{target}", :"data-title"=>"#{descr}"){
              html_block.img(:class=>"img-fluid", :src=>"#{imagesdir}/#{image}", :alt=>"#{attributes['title']}", :width=>"#{attributes['size']}")
            }
          end
        }
      else
        html_block.div(:class=>"content", :style=>"margin-bottom: 1.75rem;") {
          images_hash.each do |i,d|
            image = i.strip
            descr = d.strip
            html_block.a(:class=>"notoc link-no-decoration", :href=>"#{imagesdir}/#{image}", :"data-lightbox"=>"#{image}", :"data-title"=>"#{descr}"){
              html_block.img(:class=>"img-fluid", :src=>"#{imagesdir}/#{image}", :alt=>"#{attributes['title']}", :width=>"#{attributes['size']}")
            }
          end
        }
      end

      # See: https://stackoverflow.com/questions/4961609/extra-to-s-when-using-builder-to-generate-xml
      content = html_block.target!
      html    = %(
        <div class="#{attributes['role']}">
          #{title_html}
          <div id="lb-#{target}" class="lightbox-block imageblock"> #{content} </div>
        </div>
      )

      create_pass_block parent, html, attributes, subs: nil
    end
  end

  block_macro LightboxBlockMacro
end
