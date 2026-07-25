# ------------------------------------------------------------------------------
# ~/_plugins/load_env.rb
# Expose a whitelisted set of environment variables to Liquid templates
# at build time as `site.j1_env.<NAME>`.
#
# J1 Jekyll plugin #2
#
# Rationale:
# Jekyll does NOT expose arbitrary process environment variables to Liquid.
# This generator injects a curated, explicit whitelist into `site.config`
# before any page is rendered, so adapters / data files / layouts can read
# values (API endpoints, public keys, ...) at build time without committing
# them to the repository.
#
# SECURITY NOTE:
# Any value read here is embedded into the generated static assets and is
# therefore VISIBLE to any visitor of the site. Use this pattern to keep
# values out of version control / YAML config files only. For secrets that
# MUST remain hidden from end users, proxy the API call through a
# backend / serverless function instead.
#
# Usage:
#
#   1. set/export CLAUDE_API_KEY="sk-ant-api03-..." in the runtime env, or
#   2. place CLAUDE_API_KEY=... in a project-root .env file (dotenv gem).
#
#   3. declare every variable you want exposed in
#      _data/plugins/load-env.yml under settings.allowedEnvVars
#      (or in the defaults file). Variables not listed there are
#      never read or exposed.
#
# ------------------------------------------------------------------------------

require 'yaml'
require 'date'

module Jekyll
  class J1EnvVarsGenerator < Generator
    safe true
    priority :highest

    # claude - J1 Jekyll plugin #2
    # The hard-coded ALLOWED_ENV_VARS constant has been removed. The
    # whitelist is now sourced from the YAML config files
    #   _data/plugins/defaults/load-env.yml  -> defaults.allowedEnvVars
    #   _data/plugins/load-env.yml           -> settings.allowedEnvVars
    # so site authors can extend the whitelist without editing plugin
    # source. The merge of defaults + user settings (see `generate`)
    # already makes the user value win over the default.

    # Main plugin action, called by Jekyll-core
    def generate(site)
      @site     = site
      @mode     = site.config['environment']
      @template = site.config['theme']

      # claude - J1 Jekyll plugin #1
      # Resolve config paths relative to the Jekyll source directory.
      # The original `File.dirname(__FILE__).sub('_plugins/system', '')`
      # was fragile (the path segment did not actually exist) and broke
      # whenever the plugin file was moved. `site.source` is authoritative.
      @project_path       = site.source
      @module_data_path   = File.join(@project_path, '_data')
      @module_config_path = File.join(@module_data_path, 'plugins')

      default_config_file = File.join(@module_config_path, 'defaults', 'load-env.yml')
      user_config_file    = File.join(@module_config_path, 'load-env.yml')

      # claude - J1 Jekyll plugin #1
      # Load default + user settings safely. Missing or malformed files are
      # tolerated so the plugin never breaks the build over a config issue.
      default_yaml = load_yaml(default_config_file)
      user_yaml    = load_yaml(user_config_file)

      default_settings = default_yaml['defaults'] || {}
      user_settings    = user_yaml['settings']    || {}

      # claude - J1 Jekyll plugin #1
      # Non-destructive merge: user settings override defaults without
      # mutating the loaded defaults hash (the original used `merge!`).
      @module_config = default_settings.merge(user_settings)

      if plugin_disabled?
        Jekyll.logger.info 'J1 Env:', 'disabled'
        return
      end

      Jekyll.logger.info 'J1 Env:', 'enabled'
      Jekyll.logger.info 'J1 Env:', 'exposing whitelisted environment variables'

      # claude - J1 Jekyll plugin #1
      # Optionally pull values from a project-root .env file via the
      # dotenv gem. dotenv is optional; plain ENV still works without it.
      # Moved out of class body so it runs once per build with access to
      # the resolved project path, instead of being unreachable code
      # nested inside `generate` after a `private` declaration.
      load_dotenv(@project_path)

      # claude - J1 Jekyll plugin #2
      # Resolve the whitelist of variables from the merged config. The
      # YAML can legitimately produce nil, an empty array, or entries
      # with stray whitespace, so coerce defensively:
      #   * Array(...)        -> nil becomes [], scalar becomes [scalar]
      #   * to_s.strip        -> tolerate symbols and surrounding spaces
      #   * reject(&:empty?)  -> drop blank entries from typo'd YAML
      #   * uniq              -> avoid logging the same key twice if a
      #                          user accidentally lists it in both files
      allowed_env_vars = Array(config['allowedEnvVars'])
                          .map { |k| k.to_s.strip }
                          .reject(&:empty?)
                          .uniq

      if allowed_env_vars.empty?
        Jekyll.logger.warn 'J1 Env:',
          'allowedEnvVars is empty - no variables will be exposed. ' \
          'Add entries to settings.allowedEnvVars in _data/plugins/load-env.yml.'
        site.config['j1_env'] = {}
        return
      end

      # claude - J1 Jekyll plugin #1
      # Read each whitelisted variable from ENV and expose them via
      # site.config['j1_env'] for use in Liquid as:
      #   {{ site.j1_env.CLAUDE_API_ENDPOINT }}
      # claude - J1 Jekyll plugin #2
      # Iterate over the config-derived list instead of the removed
      # ALLOWED_ENV_VARS constant.
      env_vars = {}
      allowed_env_vars.each do |key|
        value = ENV[key].to_s
        env_vars[key] = value

        if value.empty?
          Jekyll.logger.warn 'J1 Env:', "#{key} is not set (empty string will be used)"
        else
          Jekyll.logger.info 'J1 Env:', "#{key} loaded from process environment"
        end
      end

      site.config['j1_env'] = env_vars
    end

    private

    # claude - J1 Jekyll plugin #1
    # Returns the plugin's effective config (defaults merged with user
    # settings) or an empty hash if nothing was loaded. Promoted from a
    # nested def-inside-def to a real private instance method.
    def config
      @module_config || {}
    end

    # claude - J1 Jekyll plugin #1
    # Plugin is enabled when config['enabled'] is truthy. Treat missing
    # config as disabled to fail safe.
    def plugin_disabled?
      !config['enabled']
    end

    # claude - J1 Jekyll plugin #1
    # Safely load a YAML config file. Returns an empty hash if the file
    # is missing or cannot be parsed. Replaces the original
    # `YAML::load(File.open(...))` which leaked file handles, used the
    # unsafe loader, and crashed on a missing file.
    def load_yaml(path)
      return {} unless File.exist?(path)

      YAML.safe_load(
        File.read(path),
        permitted_classes: [Symbol, Date, Time],
        aliases: true
      ) || {}
    rescue StandardError => e
      Jekyll.logger.warn 'J1 Env:', "failed to read #{path}: #{e.message}"
      {}
    end

    # claude - J1 Jekyll plugin #1
    # Try to load a project-root .env file via the dotenv gem if it is
    # installed. The original begin/rescue lived at class-body scope
    # nested below `private` inside `generate`, which made it never run
    # in the intended context.
    def load_dotenv(project_path)
      env_file = File.join(project_path, '.env')
      require 'dotenv'
      if File.exist?(env_file)
        Dotenv.load(env_file)
        Jekyll.logger.info 'J1 Env:', "dotenv - loaded #{env_file}"
      else
        Jekyll.logger.info 'J1 Env:', 'dotenv - no .env file found'
      end
    rescue LoadError
      Jekyll.logger.warn 'J1 Env:', 'dotenv gem not available, using plain ENV only'
    end

  end
end