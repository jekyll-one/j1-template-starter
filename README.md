# All you need for your new amazing site

Jekyll meets Bootstrap - and makes a lot of friends. J1 Template combines
the best of OpenSource software for the Web and the Web site generator
`Jekyll`. J1 is OpenSource, and so are the packaged modules - no pain for
private or professional use. Explore this site to learn what's possible if
you go to the Jekyll Way.

![Screenshot](https://github.com/jekyll-one-org/j1-template/raw/main/starter-screenshot.jpg "J1 Starter Web")

* Fully Responsive. J1 Template supports modern web browsers on all
  devices for best results on PCs, Tablets, and SmartPhones.
* Full Bootstpap V5 support. Current Technology and Design. Excellent
  performance running desktop and mobile websites. Use Jekyll One to
  present your content at its best.
* Start in no time. No programming is needed to start using J1. The
  Template provides a large number of building blocks to create modern
  web pages in minutes.

**Create powerful modern Static Webs: Secure, Flexible and Fast.**

Have fun!

# Live Demo

The template comes with a Web included, a skeleton for your new Web site.
This Web is called the **Starter Web**, a general-purpose Website scaffold to
be modified for your needs. The built-in Starter Web can be visited live
at [Netlify](https://j1-preview-netlify.netlify.app/).

**Have fun exploring what a modern static web, a Jekyll site can do**!

# Features

The template combines the best free software for the web. Jekyll One Template
is OpenSource and the modules included are free to use as well. No license
issues for private or professional use.

* Fully Responsive. J1 Template supports modern web browsers on all
  devices for best results on PCs, Tablets, and SmartPhones.
* Full Bootstpap V5 support. Current Technology and Design. Excellent
  performance running desktop and mobile websites. Use Jekyll One to
  present your content at its best.
* Start in no time. No programming is needed to start using J1. The
  Template provides a large number of building blocks to create modern
  web pages in minutes.

## General

* Jekyll V4 support
* Ruby V3 support
* Asciidoc (Asciidoctor) and Markdown support
* Asciidoctor plugins included
* Bootstrap V5 (v5.2)
* Responsive Design
* Material Design
* Responsive Text
* Responsive HTML tables
* Compressed HTML, CSS and Javascript support
* Themes support (Bootswatch)
* Icon Font support (MDI, FA, Iconify, Twitter Emoji)
* Themeable source code highlighting (Rouge)
* Desktop and Mobile Web and Navigation ready
* Fully configurable
* Highest Google Lighthouse scores

## Modules and Extensions

* Bootstrap extensions included
* Bootstrap Themes Support included
* Asciidoctor extensions included
* Advanced Banners and Panels included
* Source Code Hightlighter (Rouge) included
* Smooth Srcoll support
* Infine Srcoll support
* Animate on Srcoll support
* Full-text Search Engine included (Lunr)
* Desktop Web Navigation included
* Mobile Web Navigation included
* Blog Post Navigation included
* GDPR compatible Cookie Consent module included
* Translator module (Google Translator) included
* Master Header module included
* Clipboard module included
* TOC module included
* Floating Action Buttons included
* Lightbox module included
* Gallery module included
* Carousel module included
* Slider module included
* Video modules included

## Addons and Integrations

* Featured Example Content included
* Royalty Free Images included
* Asciidoc (Asciidoctor) and Markdown (Kramdown) support
* Icon Fonts (FA, MDI, Iconify) included
* Video Player (HTML, YouTube, Vimeo, Dailymotion) included
* Scalable Text Support
* Comment Provider support (Hyvor and Disqus)
* Google Analytics support
* Support for Jupyter Notebooks
* Deploy on Github Pages (source only), Netlify and Heroku ready


# Supported platforms

J1 is supported on all current **x64-based** OS:

* Windows 10, build >= 1903
* Windows WSL 2
* Linux, Kernel version >= 4.15 (e.g. Ubuntu  18.x LTS)
* OSX, version >= 10.10.5 (Yosemite)

Note that 32-bit versions (x32) are generally **not** supported for
**all** platforms.


# Development languages and tools

To run the Development System for J1 Template, the following languages and
tools expected to be in place with your OS:

* Ruby language, version >= 2.7
* Python language, version > 2.7 (optional) <1>
* Javascript language (NodeJS), version >= 14.x < 15.x
* Git, version >= 2.29 (optional) <2>
* Jekyll, version 4.2.x

<1> Required only for **full** Jupyter Notebook support.
<2> Required only if J1 Projects should be managed as repos.

**NOTE**: More current or older versions may work, but not tested.

## Development packages

For some of the components J1 is using, a working C/C++ development
environment is needed to compile platform-specific libraries. Ensure
that all dev packages are installed for your OS (Linux, OSX, or Windows).

### Development packages for Windows

For Ruby on Windows, a installation using **RubyInstaller** is recommended.
A current Ruby of version **3.1** is available at the
[RubyInstaller](https://github.com/oneclick/rubyinstaller2/releases/download/RubyInstaller-3.1.2-1/rubyinstaller-devkit-3.1.2-1-x64.exe)
site.

Note, to automatically install a development environment for Ruby on *Windows*,
a version of Ruby should be installed that is already **bundled** with a
**DEVKIT** (MSYS2 toolchain).

### Development packages on Linux (Ubuntu)

In order to install all required development components on e.g. Ubuntu
you run:

``` sh
sudo apt-get -y install \
gcc g++ make \
autoconf bison build-essential \
libssl-dev \
libyaml-dev \
libreadline-dev \
zlib1g-dev \
libncurses5-dev \
libffi-dev \
libgdbm-dev
```

To install the required languages and tools, if not already in place, the
following commands can be used to do so:

``` sh
sudo apt-get -y install \
curl \
git-all \
nodejs \
ruby
```

Additionally, for Ruby and NodeJS the dev-packages are to be installed to
make all header files available for a working C/C++ development environment:

``` sh
sudo apt-get -y install \
nodejs-dev \
ruby-dev
```

Note that priviliged (administrative) user rights are needed to install
system-wide software packages for Ruby and the OS.

### Development packages on OSX

For all OSX system, the installation of the Apple Developer Tools (XCode)
is expected. Development tools like Ruby, NodeJS, or the bash comes
with the OS are **not** recommended to use. Most of the software comes in
quite old versions and therefor unusable for J1 development.

To install recommended versions, the easiest way to install the missing
software is [Homebrew](https://brew.sh/). A lot of helpful information
how to manage package installations using Homebrew can be found on the
internet.

Beside the base installation of the recommend tools, all other recommendations
for Linux systems are for OSX the same.

## Upgrades needed for all platforms

If Ruby and NodeJS are in place, some packeages are to be upgraded to more
current versions. Install all packages system-wide with their respective
product installation pathes.

### Upgrades needed for Ruby <= v2.7

Install latest bundler for Ruby:

``` sh
gem install bundler --no-document
```

Install latest RubyGems for Ruby:

``` sh
gem install rubygems-update --no-document
update_rubygems --no-document
gem update --system
```

### Upgrades needed for NodeJS

NodeJS comes with NPM pre-installed. The native CLI for the NodeJS package
management is `npm`. Besides `npm` there's another quite handy CLI for NPM
available: *Yarn*.

The CLI `yarn` is developed at Facebook and can be used as a replacement
for `npm`. From a top-level perspective, both package management clients
behave pretty much the same. The syntax `yarn` uses is shorter in writing,
making the command-line look a bit more natural. Therefore, we prefer to
use `yarn`.

**NOTE**: Yarn adds some additional features to the NodeJS package
management implemented for the needs at Facebook. To use J1 Template, those
add-ons are neither needed nor used.

Install latest *NPM* and *Yarn* packages for *NodeJS*:

``` sh
npm install -g npm@latest
npm install -g yarn@latest
```

# Managing J1 Projects

Managing J1 Template projects is very simple:

* Install J1 Template
* Setup a project
* Initialize the project
* Run the J1 Project

## Install J1 Template

You can install J1 Template in two ways:

* Installing the Ruby Gem of J1 Template (recommended)
* Clone the current J1 Template Repo from *Github*

The recommended method to install J1 is using the the **Ruby Gem**.
If you're using *Git* already, cloning the Repo at *Github* may an
option.

### Installing the Ruby Gem

It is highly recommended to install all project-related Ruby GEMs so-called
**userized**. The **user install** option of the *RubyGems* CLI **gem** will
install all requested Ruby Gems in the **home directory** of a user.
Installing userized prevents polluting the System Ruby Installation by
packages only needed by specific users or projects.

**IMPORTANT**: If you're on *Linux* (Unix), a system-wide installation of
Ruby GEMs requires **elevated** user rights (root). *Userized* installations
of Ruby packages can be done by all users **without** having elevated
user rights.

J1 Template uses the **user install** option internally by **default**.
All depended Ruby GEMs are installed in the user's home directory in
folder `.gem`.

Prior to install the J1 Gem, make sure that a `.gem` folder already **exists**
in your **home** directory.

On *Windows*, run:

    mkdir %HOMEDRIVE%%HOMEPATH%\.gem

On *Unix/linux*, run:

    md $HOME/.gem

The latest version of J1 Template is available at
<a href="https://rubygems.org/gems/j1-template/" target="_blank">RubyGems</a>
or can installed by the RubyGems CLI **gem**:

    gem install j1-template --no-document --user-install

**NOTE** The installation of the Gem will resolve all dependencies and
downloaad|install all dpended Ruby GEMs as required (userized).

### Checkout the Repo from Github

The Repo for the **latest** version of J1 Template is published on Github.
You can get it by **cloning** the repository using **Git**`:

    git clone https://github.com/jekyll-one/j1-template-starter.git

The repo gets written to folder `j1-template-starter`. Have a look and
browse the folder. You'll see a structure like this:

General J1 Project Repo structure:

``` sh
  ├──── j1-template-starter
  │    └─── _data
  |    └─── _includes
  │    └─── _plugins
  │    └─── assets
  │    └─── collections  
  │    └─── pages
  ├──── dot.gitattributes
  ├──── dot.gitignore
  ├──── dot.ruby-version
  ├──── dot.nojekyll
  ├──── dot.ruby-version
  ├──── favicon.ico
  ├──── Gemfile
  ├──── index.html          
  ├──── LICENSE.md
  ├──── package.json
  └──── README.md
```

**NOTE**: It is recommended to rename the folder `j1-template-starter` of
the cloned repo to a more specific (project) name.


All development **tasks** are defined as NPM **scripts** with the project
config file `package.json`. For your convenience, the J1 Template Gem
comes with a build-in CLI **j1** run all project-related commands;
no need to learn **npm** or how to manage **NodeJS** projects.


## Setup the Project

The setup procedure depends on how you installed J1 Template. If you are
using the J1 GEM as recommended, you need to **create** a personal project
first. If you have cloned the J1 Template Repo from *Github*, the project
is already created by the clone's folder and you can skip the creation of
a project; continue on section **Initialize a J1 Project**.

### Create a J1 Project

First, you should make a folder holding all your J1 projects.
On *Windows*, run:

    mkdir %HOMEDRIVE%%HOMEPATH%\j1-projects

Managing J1 Projects is simple: all tasks you need are run by the buildin
CLI **j1**. To create a new project inside the projects folder, run:

    cd %HOMEDRIVE%%HOMEPATH%\j1-projects && j1 generate my-starter

This command creates a **initial** project in folder **my-starter**.

```
  2022-07-30 18:12:08 - GENERATE: Running bundle install in C:/Users/xxx/j1-projects/my-starter ...
  2022-07-30 18:12:08 - GENERATE: Install bundle in USER gem folder ~/.gem ...
  2022-07-30 18:12:12 - GENERATE: Fetching gem metadata from https://rubygems.org/..........
  2022-07-30 18:12:12 - GENERATE: Resolving dependencies...
  2022-07-30 18:12:12 - GENERATE: Using bundler 2.3.7
  ...
  2022-07-30 18:12:12 - GENERATE: Using j1-template 2022.5.2.rc2
  2022-07-30 18:12:12 - GENERATE: Bundle complete! 31 Gemfile dependencies, 78 gems now installed.
  2022-07-30 18:12:12 - GENERATE: Bundled gems are installed into `../../.gem`
  2022-07-30 18:12:12 - GENERATE:  C:/Users/xxx/.gem/ruby/3.1.0;C:/DevTools/Ruby31-x64/lib/ruby/gems/3.1.0;
  2022-07-30 18:12:13 - GENERATE: Install patches in USER gem folder ~/.gem ...
  2022-07-30 18:12:13 - GENERATE: Install patches on path C:/Users/xxx/.gem/ruby/3.1.0 ...
  2022-07-30 18:12:13 - GENERATE: Patches already installed, skip install.
  2022-07-30 18:12:13 - GENERATE: Generated Jekyll site installed in folder C:/Users/xxx/j1-projects/my-starter
  2022-07-30 18:12:13 - GENERATE: To setup the site, change to the project folder C:/Users/xxx/j1-projects/my-starter and run: j1 setup
```

## Initialize the project

To make a project usable, is has to be initialzed first. This is needed
only once after you create a **new** project.
On *Windows*, run the `setup` task like so:

    cd %HOMEDRIVE%%HOMEPATH%\j1-projects\my-starter && j1 setup

**NOTE**: While initializing a project, the J1 Template Gem is downloaded as
a dependecy (if **not** already installed). For the users **cloned** the J1
Template repo (as a project), the J1 GEM will be installed and all **j1**
commands are available as well.

```
  Check consistency of the J1 project ...
  2022-07-30 18:17:47 - SETUP: Running bundle install in C:/Users/xxx/j1-projects/my-starter ...
  2022-07-30 18:17:47 - SETUP: Install bundle in USER gem folder ~/.gem ...
  ...
  2022-07-30 18:17:48 - SETUP: Bundle complete! 31 Gemfile dependencies, 78 gems now installed.
  2022-07-30 18:17:48 - SETUP: Bundled gems are installed into `../../.gem`
  2022-07-30 18:17:48 - SETUP: Install patches in USER gem folder ~/.gem ...
  2022-07-30 18:17:48 - SETUP: Install patches on path C:/Users/xxx/.gem/ruby/3.1.0 ...
  2022-07-30 18:17:48 - SETUP: Initialize the project ...
  2022-07-30 18:17:48 - SETUP: Be patient, this will take a while ...
  2022-07-30 18:17:49 - SETUP:
  2022-07-30 18:17:49 - SETUP: > j1@2022.5.2 setup C:\Users\xxx\j1-projects\my-starter
  2022-07-30 18:17:49 - SETUP: > npm --silent run setup-start && npm --silent run setup-base && run-s -s setup:*
  2022-07-30 18:17:49 - SETUP:
  2022-07-30 18:17:50 - SETUP: Setup project for first use ..
  2022-07-30 18:17:50 - SETUP: Bootstrap base modules ..
  2022-07-30 18:18:05 - SETUP: done.
  2022-07-30 18:18:05 - SETUP: Configure environment ..
  2022-07-30 18:18:09 - SETUP: done.
  2022-07-30 18:18:09 - SETUP: Create project folders ..
  ...
  2022-07-30 18:18:25 - SETUP: done.
  2022-07-30 18:18:26 - SETUP: Detect OS ..
  2022-07-30 18:18:27 - SETUP: OS detected: Windows_NT
  2022-07-30 18:18:28 - SETUP: Build site incremental ..
  2022-07-30 18:18:31 - SETUP: Configuration file: C:/Users/jadams/j1-projects/my-starter/_config.yml
  2022-07-30 18:18:34 - SETUP:             Source: C:/Users/jadams/j1-projects/my-starter
  2022-07-30 18:18:34 - SETUP:        Destination: C:/Users/jadams/j1-projects/my-starter/_site
  2022-07-30 18:18:34 - SETUP:  Incremental build: enabled
  2022-07-30 18:18:34 - SETUP:       Generating...
  2022-07-30 18:18:36 - SETUP:            J1 Lunr: creating search index ...
  2022-07-30 18:18:38 - SETUP:            J1 Lunr: finished, index ready.
  2022-07-30 18:18:38 - SETUP:       J1 Paginator: autopages, disabled|not configured
  2022-07-30 18:18:38 - SETUP:       J1 Paginator: pagination enabled, start processing ...
  2022-07-30 18:18:38 - SETUP:       J1 Paginator: finished, processed 2 pagination page|s
  2022-07-30 18:19:28 - SETUP:                     done in 53.925 seconds.
  2022-07-30 18:19:28 - SETUP:  Auto-regeneration: disabled. Use --watch to enable.
  2022-07-30 18:19:28 - SETUP: .. build finished.
  2022-07-30 18:19:29 - SETUP: To open the site, run: yarn site
  2022-07-30 18:19:29 - SETUP: Initializing the project finished successfully.
  2022-07-30 18:19:29 - SETUP: To open your site, run: j1 site
```

## Run the J1 Project

After the setup process has been finished, you can run a project by running
`j1 site`. Finally, the buildin Starter Web get openend in your default
browser. Let's start the journey ...

    cd %HOMEDRIVE%%HOMEPATH%\j1-projects\mystarter && j1 site

``` sh
  Check consistency of the J1 project ...
  Check setup state of the J1 project ...
  2022-07-30 18:26:18 - SITE: Starting up your site ...
  2022-07-30 18:26:18 - SITE:
  2022-07-30 18:26:18 - SITE: > j1@2022.5.2 j1-site C:\Users\jadams\j1-projects\my-starter
  2022-07-30 18:26:18 - SITE: > run-p -s j1-site:*
  2022-07-30 18:26:18 - SITE:
  2022-07-30 18:26:20 - SITE: Startup UTILSRV ..
  2022-07-30 18:26:21 - SITE: Log file exists :        messages_2022-07-30
  2022-07-30 18:26:21 - SITE: Stop the server. Exiting ...
  2022-07-30 18:26:21 - SITE: Reset file: messages_2022-07-30
  2022-07-30 18:26:21 - SITE: Configuration file: C:/Users/jadams/j1-projects/my-starter/_config.yml
  2022-07-30 18:26:24 - SITE:             Source: C:/Users/jadams/j1-projects/my-starter
  2022-07-30 18:26:24 - SITE:        Destination: C:/Users/jadams/j1-projects/my-starter/_site
  2022-07-30 18:26:24 - SITE:  Incremental build: enabled
  2022-07-30 18:26:24 - SITE:       Generating...
  2022-07-30 18:26:27 - SITE:            J1 Lunr: creating search index ...
  2022-07-30 18:26:28 - SITE:            J1 Lunr: finished, index ready.
  2022-07-30 18:26:28 - SITE:       J1 Paginator: autopages, disabled|not configured
  2022-07-30 18:26:28 - SITE:       J1 Paginator: pagination enabled, start processing ...
  2022-07-30 18:26:28 - SITE:       J1 Paginator: finished, processed 2 pagination page|s
  2022-07-30 18:26:35 - SITE:                     done in 10.408 seconds.
  2022-07-30 18:26:38 - SITE:  Auto-regeneration: enabled for '.'
  2022-07-30 18:26:39 - SITE: LiveReload address: http://localhost:35729
  2022-07-30 18:26:39 - SITE:     Server address: http://localhost:40000/
  2022-07-30 18:26:39 - SITE:   Server running... press ctrl-c to stop.
```

## Rebuild a project

For some reason, it may needed to re-create an existing project. The task
`rebuild` rebuild all documents (pages and posts) from the scratch but
leaves the base project files untouched.
To **reset** a project, run (inside the project folder):

    j1 reset

``` sh
Check consistency of the J1 project ...
Check setup state of the J1 project ...
REBUILD: Rebuild the projects website ...
REBUILD: Be patient, this will take a while ...
2022-07-30 18:45:09 - REBUILD:
2022-07-30 18:45:09 - REBUILD: > j1@2022.5.2 rebuild C:\Users\xxx\j1-projects\my-starter
2022-07-30 18:45:09 - REBUILD: > run-s -s rebuild:* && run-s -s post-rebuild:*
2022-07-30 18:45:09 - REBUILD:
2022-07-30 18:45:10 - REBUILD: Rebuild site incremental ..
2022-07-30 18:45:10 - REBUILD: Clean up site files ..
2022-07-30 18:45:12 - REBUILD: Configuration file: C:/Users/xxx/j1-projects/my-starter/_config.yml
2022-07-30 18:45:13 - REBUILD:            Cleaner: Removing _site...
2022-07-30 18:45:13 - REBUILD:            Cleaner: Removing ./.jekyll-metadata...
2022-07-30 18:45:13 - REBUILD:            Cleaner: Removing ./.jekyll-cache...
2022-07-30 18:45:14 - REBUILD:            Cleaner: Nothing to do for .sass-cache.
2022-07-30 18:45:17 - REBUILD: Configuration file: C:/Users/xxx/j1-projects/my-starter/_config.yml
2022-07-30 18:45:19 - REBUILD:             Source: C:/Users/xxx/j1-projects/my-starter
2022-07-30 18:45:19 - REBUILD:        Destination: C:/Users/xxx/j1-projects/my-starter/_site
2022-07-30 18:45:19 - REBUILD:  Incremental build: enabled
2022-07-30 18:45:19 - REBUILD:       Generating...
2022-07-30 18:45:21 - REBUILD:            J1 Lunr: creating search index ...
2022-07-30 18:45:23 - REBUILD:            J1 Lunr: finished, index ready.
2022-07-30 18:45:23 - REBUILD:       J1 Paginator: autopages, disabled|not configured
2022-07-30 18:45:23 - REBUILD:       J1 Paginator: pagination enabled, start processing ...
2022-07-30 18:45:23 - REBUILD:       J1 Paginator: finished, processed 2 pagination page|s
2022-07-30 18:46:11 - REBUILD:                     done in 52.09 seconds.
2022-07-30 18:46:11 - REBUILD:  Auto-regeneration: disabled. Use --watch to enable.
2022-07-30 18:46:12 - REBUILD: .. rebuild finished.
2022-07-30 18:46:12 - REBUILD: To open the site, run: yarn site
REBUILD: The projects website has been rebuild successfully.
REBUILD: To open the site, run: j1 site
```


## Reset a project

To start a project from the beginning, you can reset the system to the
factory state. The task `reset` does the resetting work for you
and cleans up each and everything except the **Git** repo and the modules
folder `node_modules` stored in the project root. Both are kept untouched
by a reset.

    j1 reset

The cleanup runs some tasks for the root folder and in parallel sub-tasks
using Lerna for all packages:

```
  Check consistency of the J1 project ...
  Check setup state of the J1 project ...
  2022-07-30 18:29:07 - RESET: Reset the project to factory state ...
  2022-07-30 18:29:07 - RESET: Be patient, this will take a while ...
  2022-07-30 18:29:08 - RESET:
  2022-07-30 18:29:08 - RESET: > j1@2022.5.2 reset C:\Users\xxx\j1-projects\my-starter
  2022-07-30 18:29:08 - RESET: > run-s -s reset:*
  2022-07-30 18:29:08 - RESET:
  2022-07-30 18:29:08 - RESET: Reset project to factory state ..
  2022-07-30 18:29:09 - RESET: Clean up base modules ..
  2022-07-30 18:29:10 - RESET: Clean up site files ..
  2022-07-30 18:29:12 - RESET: Configuration file: C:/Users/xxx/j1-projects/my-starter/_config.yml
  2022-07-30 18:29:13 - RESET:            Cleaner: Removing _site...
  2022-07-30 18:29:13 - RESET:            Cleaner: Removing ./.jekyll-metadata...
  2022-07-30 18:29:13 - RESET:            Cleaner: Removing ./.jekyll-cache...
  2022-07-30 18:29:13 - RESET:            Cleaner: Nothing to do for .sass-cache.
  2022-07-30 18:29:14 - RESET: Clean up projects files ..
  2022-07-30 18:29:14 - RESET: Remove bundle config folder ..
  2022-07-30 18:29:15 - RESET: Remove log folder ..
  2022-07-30 18:29:15 - RESET: Remove etc folder ..
  2022-07-30 18:29:15 - RESET: Remove various log files ..
  2022-07-30 18:29:16 - RESET: Remove lock files ..
  2022-07-30 18:29:16 - RESET: Clean up utility server ..
  2022-07-30 18:29:21 - RESET: done.
  2022-07-30 18:29:21 - RESET: The project reset finished successfully.
  2022-07-30 18:29:21 - RESET: To setup the project, run: j1 setup
```

Start your work from the scratch by running the `setup` task again:

    j1 setup

Happy Jekylling!
