## Update Rubygems

gem install rubygems-update
update_rubygems
gem update --system


## Install a Ruby Gem

Add this line to your application's Gemfile:

``` ruby
gem 'j1_template', '~> 2024.1.0'
```

and install the locally created RubGem as:

``` sh
gem install --local j1-template --no-document
```

### Userized Installation

When you use the **--user-install option**, RubyGems will install the gems
to a directory inside your home directory, something like `~/.gem/ruby/3.1.0`
for Ruby version `3.1.x`. The commands provided by the gems you have installed
will end up in ~/.gem/ruby/3.1.0/bin.

``` sh
  gem install j1-template --user-install --no-document
```

For the programs installed userized, you need to add `~/.gem/ruby/3.1.0/bin`
to your **PATH** environment variable.

### Install a Gem in specific version

``` sh
  gem install j1-template -v 2024.1.0 --user-install --no-document
```

You can also use version comparators like >= or ~>

``` sh
  gem install j1-template -v "~> 2024.1.0" --user-install --no-document
```

### Install a Gem from different source

``` sh
  gem install j1-template -v 2024.1.0 --source 'https://gem.fury.io/jekyll-one-org/' --user-install --no-document
```


### Clean up old Gem versions on GEM_PATH

To clean up old versions of installed gems use below command

  gem cleanup [GEMNAME …]

The cleanup command removes old versions of gems from GEM_HOME that are not
required to meet a dependency. If a gem is installed elsewhere in GEM_PATH
the cleanup command won’t delete it.

If no gems are named all gems in GEM_HOME are cleaned.
