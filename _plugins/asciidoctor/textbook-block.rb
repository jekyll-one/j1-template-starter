# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/nodebook-block.rb
# Asciidoctor extension for J1 Jupyter Notebooks
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2023 Juergen Adams
#
# J1 Theme is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
#
# ------------------------------------------------------------------------------
# A block macro that embeds a notebook block into the output document
#
# Usage:
#
#   notebook::notebook_id[role="additional classes"]
#
# Example|s:
#
#   notebook::j1_test_notebook[]
#   notebook::j1_test_notebook[role="mt-2 mb-4"]
#
# ------------------------------------------------------------------------------
require 'asciidoctor/extensions' unless RUBY_ENGINE == 'opal'
include Asciidoctor

Asciidoctor::Extensions.register do

  class NbiBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :textbook
    name_positional_attributes 'role'

    def process parent, target, attrs
      html = %(<div id="#{target}" class="nb-textbook speak2me-ignore #{attrs['role']}" data-nb-textbook="initial"></div>)
      create_pass_block parent, html, attrs, subs: nil
    end
  end

  block_macro NbiBlockMacro

end
