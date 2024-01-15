#!/usr/bin/env bash
#  -----------------------------------------------------------------------------
# Product/Info:
# http://jekyll-one
#
# Copyright (C) 2023, 2024 Juergen Adams
# J1 is licensed under the MIT License
#  -----------------------------------------------------------------------------

# ENVIRONMENT
# set BASE_PATH=_absolute_path_jekyll_project
# ------------------------------------------------------------------------------
BASE_PATH=/D/j1/github/j1-template/packages/400_theme_site

# VARIABLES
# ------------------------------------------------------------------------------
PDF_STYLES_DIR=$BASE_PATH/_data/asciidoc2pdf
PDF_FONTS_DIR=$BASE_PATH_data/_data/asciidoc2pdf/fonts
PLUGINS_DIR=$BASE_PATH/_plugins
PLUGIN_LOREM_INLINE=$PLUGINS_DIR/asciidoctor/lorem_inline.rb
MASTER_DOCUMENT=./documentation.a2p

# MAIN
# ------------------------------------------------------------------------------
asciidoctor-pdf -r $PLUGIN_LOREM_INLINE $MASTER_DOCUMENT
