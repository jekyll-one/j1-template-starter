@ECHO OFF
REM  ---------------------------------------------------------------------------
REM  Product/Info:
REM  http://jekyll-one
REM
REM  Copyright (C) 2022 Juergen Adams
REM  J1 is licensed under the MIT License
REM  ---------------------------------------------------------------------------

REM ENVIRONMENT
REM set BASE_PATH=<absolute_path_jekyll_project>
REM ----------------------------------------------------------------------------
SET BASE_PATH=D:\j1\github\j1-template\packages\400_theme_site

REM VARIABLES
REM ----------------------------------------------------------------------------

REM SET PDF_STYLES_DIR=%BASE_PATH%\_data\asciidoc2pdf
REM SET PDF_FONTS_DIR=%BASE_PATH%\_data\asciidoc2pdf\fonts

SET PLUGINS_DIR=%BASE_PATH%\_plugins
SET PLUGIN_LOREM_INLINE=%PLUGINS_DIR%\lorem_inline.rb
SET MASTER_DOCUMENT=.\documentation.a2p


REM MAIN
REM ----------------------------------------------------------------------------
asciidoctor-pdf -r %PLUGIN_LOREM_INLINE% %MASTER_DOCUMENT%
