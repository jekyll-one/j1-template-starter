# All you need for your new amazing site

Jekyll meets Bootstrap - and makes a lot of friends. J1 Template combines
the best of OpenSource software for the Web and the Web site generator
`Jekyll`. J1 is OpenSource, and so are the packaged modules - no pain for
private or professional use. Explore this site to learn what's possible if
you go to the Jekyll Way.

**Create powerful modern Static Webs: Secure, Flexible and Fast.**

![Screenshot](https://github.com/jekyll-one/j1-template-starter/raw/main/home-screenshot.jpg "J1 Starter Web")

* Fully Responsive. J1 Template supports modern web browsers on all
  devices for best results on PCs, Tablets, and SmartPhones.
* Full Bootstpap V4 support. Current Technology and Design. Excellent
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
be modified for your needs. The built-in Starter Web [can be visited live
at Netlify](https://j1-template-starter.netlify.app/).

**Have fun exploring what a modern static web, a Jekyll site can do**!

# Features

The template combines the best free software for the web. Jekyll One Template
is OpenSource and the modules included are free to use as well. No license
issues for private or professional use.

* Fully Responsive. J1 Template supports modern web browsers on all
  devices for best results on PCs, Tablets, and SmartPhones.
* Full Bootstpap V4 support. Current Technology and Design. Excellent
  performance running desktop and mobile websites. Use Jekyll One to
  present your content at its best.
* Start in no time. No programming is needed to start using J1. The
  Template provides a large number of building blocks to create modern
  web pages in minutes.

## General

* Jekyll 4.2 support
* Ruby 2.7 support
* Asciidoc (Asciidoctor) and Markdown support
* Asciidoctor plugins included
* Bootstrap V4 (v4.6)
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
* 100/100/100 Google Lighthouse scores

## Modules and Extensions

* Bootstrap extensions included
* Asciidoctor extensions included
* Smooth-srcoll support
* Full-text search engine included (Lunr)
* Blog Post navigation included
* GDPR compatible cookie consent module included
* Clipboard module included
* Floating Action Buttons included
* Navigation modules included
* Lightbox modules included
* Gallery modules included
* Carousel module included
* Video modules included

## Addons and Integrations

* Featured example content included
* Royalty free images included
* Comment provider support for Hyvor and Disqus
* Google Analytics support
* Deploy on Github Pages (source only), Netlify and Heroku ready

# Supported platforms

J1 is supported on all current x64-based OS:

* Windows 10, build >= 1903
* Windows WSL 2
* Linux, kernel version >= 4.15 (e.g. Ubuntu  18.x LTS)
* OSX, version >= 10.10.5 (Yosemite)

Note that 32-bit versions (x32) are generally **not** supported for all
platforms.

# Development languages and tools

To run the project for J1 Template Web, the following languages and
tools expected to be in place with your OS:

*   Ruby language, version >= 2.6 < 3.x
*   Javascript language (NodeJS), version >= 12.x < 13.x

Note, Ruby **3.x** versions are **not** supported for Jekyll and J1 either.
More current or older versions of **NodeJS** may work, but not tested.

## Update the package managers for _NodeJS_

NodeJS comes with the package manager *NPM* pre-installed. The native CLI for
the NodeJS package management is `npm`. Besides `npm` there's another quite
handy CLI for NPM available: *Yarn*.

The CLI `yarn` is developed at _Facebook_ and can be used as a replacement
for `npm`. From a top-level perspective, both package management clients
behave pretty much the *same*. The syntax `yarn` uses is shorter in writing,
making the command-line look a bit more natural. Therefore, the use of
`yarn` is preferred over `npm`

Install the latest *NPM* and *Yarn* packages for _NodeJS_:

``` sh
npm install -g npm@latest <1>
npm install -g yarn@latest
```

* <1> The package managers *npm* and *yarn* are installed *globally* (-g)

# Setting up the project

Running the J1 template project is simple:

* Setup the project
* Bundle (install) all Ruby GEMs required
* Run and develop your web

J1 Project Structure
```
  ├──── .
  │     └─ _data  <1>
  │     └─ _includes <2>
  │     └─ _plugins <3>
  │     └─ assets <4>
  │     └─ collections <5>
  │     └─ pages <6>
  │     └─ utilsrv
  ├──── _config.yml <7>
  ├──── config.ru
  ├──── .gitattributes
  ├──── .gitignore
  ├──── favicon.ico
  ├──── Gemfile <8>
  ├──── index.html <9>
  └──── package.json <10>
```

* <1>   J1 Configuration data
* <2>   Asciidoc includes (global)
* <3>   Build-in plugins (Ruby)
* <4>   Assets for the Web
* <5>   Folder that contains all Blog Posts
* <6>   Folder that contains all Articles
* <7>   Central site configuration (Jekyll)
* <8>   Ruby Gemfile
* <9>   Homepage for the Web
* <10>  J1 Project file (NPM)

## Bundle the Ruby GEMs

First, install (bundle) all Ruby GEMs required. You can install the
**bundle** with your home directory (userized):

``` sh
bundle config set --local path ~/.gem
bundle install
```

or system-wide:

``` sh
bundle install
```

## Initialize the project

Initializing the project is done by the NodeJS package manager *yarn*
running the task `setup`.

The task `setup` takes a while. Typically some minutes for the *first*
run (depending on the performances of your Internet connection and your
Desktop PC). A bunch of NPM modules and Ruby Gems gets downloaded, installed,
and linked for the project. See the setup task as an extended *install* and
*build* process to make your new website ready to use.

Let's start ...

``` sh
yarn setup
```

Because a lot of sub-tasks getting started for a (first) `setup`, see below
the output as a summary :

```
Setup project for first use ..
Bootstrap base modules ..
done.
Configure environment ..
done.
Create project folders ..
Create log folder ..
Create archived log folder ..
Create etc folder ..
done.
Bootstrap project modules ..
Bootstrap utility server modules ..
done.
Detect OS ..
OS detected: Windows_NT
Build site incremental ..
Configuration file: C:/J1Webs/starter/_config.yml
            Source: C:/J1Webs/starter
       Destination: C:/J1Webs/starter/_site
 Incremental build: enabled
      Generating...
    J1 QuickSearch: creating search index ...
    J1 QuickSearch: finished, index ready.
      J1 Paginator: autopages, disabled|not configured
      J1 Paginator: pagination enabled, start processing ...
      J1 Paginator: finished, processed 1 pagination page|s
                    done in 37.609 seconds.
 Auto-regeneration: disabled. Use --watch to enable.
.. build finished.
To open the site, run: yarn site
Done in 94.94s.
```

## Running the Starter Web

Running the Starter Web for development is done like so:

``` sh
yarn site
```

The task `site` does a lot for you; whatever is necessary for a full-stack
Web development. The task will put in place all needed CSS and JS components,
build the Web content, and finally run the webite in a browser.

Go, go, go ..

```
yarn run v1.22.10
$ run-p -s site:*
Startup the site ..
UTILSRV disabled. Not started.
Configuration file: C:/J1Webs/starter/_config.yml   <1>
            Source: C:/J1Webs/starter   <2>
       Destination: C:/J1Webs/starter/_site   <3>
 Incremental build: enabled
      Generating...
    J1 QuickSearch: recreate index disabled.
      J1 Paginator: autopages, disabled|not configured
      J1 Paginator: pagination enabled, start processing ...
      J1 Paginator: finished, processed 1 pagination page|s
                    done in 9.618 seconds.
 Auto-regeneration: enabled for '.'
LiveReload address: http://localhost:40001    <5>
    Server address: http://localhost:40000/   <4>
  Server running... press ctrl-c to stop.
        LiveReload: Browser connected   <6>
```

* <1> The configuration file for the builder engine _Jekyll_
* <2> The project folder
* <3> The *WebRoot* folder for your website creaated
* <4> The *URL* to access the web
* <5> A *LiveReloader* is started and listens on port *40001*
* <6> A webbrowser has been started automatically and the *LiveReloader*
    is connected

Your *default* web browser is automatically started, and the website gets
loaded.

## Reset the Project

To start from the beginning, you can reset the project to the factory state.
The top-level task `reset` does the resetting work for you
and cleans up each and everything except the Git repo and the NPM modules
folder `node_modules` stored in the project root. Both are kept untouched
by a reset.

``` sh
yarn reset
```

To reset the Development System *completely*, delete the folder `node_modules`
manually and start from scratch by running the `setup` task again:

``` sh
yarn setup
```

Happy Jekylling!
