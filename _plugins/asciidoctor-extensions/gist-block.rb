# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/gist-block.rb
# Asciidoctor extension for J1 Template
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2022 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/J1 Template/blob/master/LICENSE
#
# ------------------------------------------------------------------------------
require 'asciidoctor/extensions' unless RUBY_ENGINE == 'opal'
include Asciidoctor

# A block macro that embeds a Gist into the output document
#
# Usage
#
#   gist::12345[]
#
# Example:
#
#   .Guard setup to live preview AsciiDoc output
#   gist::mojavelinux/5546622[]
#
Asciidoctor::Extensions.register do

  class GistBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :gist

    def process parent, target, attrs
      title_html = (attrs.has_key? 'title') ?
          %(<div class="title">#{attrs['title']}</div>\n) : nil

      html = %(<div class="openblock gist mt-4 mb-5">
                 #{title_html}
                 <div class="content">
                   <script src="https://gist.github.com/#{target}.js"></script>
                 </div>
               </div>)

      create_pass_block parent, html, attrs, subs: nil
    end
  end

  block_macro GistBlockMacro

end
