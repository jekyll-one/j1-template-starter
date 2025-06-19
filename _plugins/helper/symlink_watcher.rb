# ------------------------------------------------------------------------------
# ~/_plugins/symlink_watcher
# jekyll-watch extension to listen for changes in symlinked folders
#
# Product/Info:
# https://github.com/willnorris/willnorris.com/tree/master/src/_plugins/
# https://jekyll.one
#
# Copyright (C) 2002-2014 Will Norris
# Copyright (C) 2023-2025 Juergen Adams
#
# symlink_watcher is licensed under the  MIT license
# See: https://github.com/willnorris/willnorris.com/blob/master/LICENSE
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE
# ------------------------------------------------------------------------------
# NOTE:
#   The symlink_watcher plugin extends jekyll-watch to listen also
#   for changes in any symlinked sub-directory.
#
#   For example, in _drafts directory is a symlink to a directory
#   elsewhere on the filesystem. This plugin will cause jekyll to
#   regenerate the site when ANY file change in the drafts folder.
# ------------------------------------------------------------------------------
require "find"
require "jekyll-watch"

module Jekyll
  module Watcher
    def build_listener_with_symlinks(site, options)
      src = options["source"]
      dirs = [src]
      Find.find(src).each do |f|
        next if f == "#{src}/_drafts" and not options["show_drafts"]
        # TODO: willnorris, filter ignored files
        dirs << f if File.directory?(f) and File.symlink?(f)
      end

      require "listen"
      Listen.to(
        *dirs,
        :ignore => listen_ignore_paths(options),
        :force_polling => options['force_polling'],
        &(listen_handler(site))
      )
    end

    alias_method :build_listener_without_symlinks, :build_listener
    alias_method :build_listener, :build_listener_with_symlinks
  end
end
