# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/lorem_inline.rb
# Asciidoctor extension for J1 Theme
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2022 Juergen Adams
# Copyright (C) 2022 Travis Dunn
#
# J1 Theme is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
# Lorem adapted from Frank
# Frank is licensed under the MIT License.
# See: https://github.com/blahed/frank/blob/master/LICENSE
# ------------------------------------------------------------------------------
# An extension that implements several type of (lorem) blind text
#
# Usage
#
#   lorem::type[]
#   lorem::type[size]
#
# ------------------------------------------------------------------------------
require 'rack'
require 'asciidoctor/extensions' unless RUBY_ENGINE == 'opal'

include Asciidoctor

WORDS = %w(alias consequatur aut perferendis sit voluptatem accusantium doloremque aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo aspernatur aut odit aut fugit sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt neque dolorem ipsum quia dolor sit amet consectetur adipisci velit sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem ut enim ad minima veniam quis nostrum exercitationem ullam corporis nemo enim ipsam voluptatem quia voluptas sit suscipit laboriosam nisi ut aliquid ex ea commodi consequatur quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae et iusto odio dignissimos ducimus qui blanditiis praesentium laudantium totam rem voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident sed ut perspiciatis unde omnis iste natus error similique sunt in culpa qui officia deserunt mollitia animi id est laborum et dolorum fuga et harum quidem rerum facilis est et expedita distinctio nam libero tempore cum soluta nobis est eligendi optio cumque nihil impedit quo porro quisquam est qui minus id quod maxime placeat facere possimus omnis voluptas assumenda est omnis dolor repellendus temporibus autem quibusdam et aut consequatur vel illum qui dolorem eum fugiat quo voluptas nulla pariatur at vero eos et accusamus officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae itaque earum rerum hic tenetur a sapiente delectus ut aut reiciendis voluptatibus maiores doloribus asperiores repellat)

Asciidoctor::Extensions.register do

  module Lorem
    class LoremObject

    def word(replacement = nil)
      words 1, replacement
    end

    def words(total, replacement = nil)
      (1..total).map do
        randm(WORDS)
      end.join(' ')
    end

    def sentence(replacement = nil)
      sentences 1, replacement
    end

    def sentences(total, replacement = nil)
      (1..total).map do
        words(randm(4..15)).capitalize
      end.join('. ')
    end

    def paragraph(replacement = nil)
      paragraphs 1, replacement
    end

    def paragraphs(total, replacement = nil)
      (1..total).map do
        sentences(randm(3..7), replacement).capitalize
      end.join("\n\n")
    end

    def date(fmt = '%a %b %d, %Y', range = 1950..2010, replacement = nil)
      y = rand(range.last - range.first) + range.first
      m = rand(12) + 1
      d = rand(31) + 1
      Time.local(y,m,d).strftime(fmt)
    end

    def name(replacement = nil)
      "#{first_name} #{last_name}"
    end

    def first_name(replacement = nil)
      names = %w(Judith Angelo Margarita Kerry Elaine Lorenzo Justice Doris Raul Liliana Kerry Elise Ciaran Johnny Moses Davion Penny Mohammed Harvey Sheryl Hudson Brendan Brooklynn Denis Sadie Trisha Jacquelyn Virgil Cindy Alexa Marianne Giselle Casey Alondra Angela Katherine Skyler Kyleigh Carly Abel Adrianna Luis Dominick Eoin Noel Ciara Roberto Skylar Brock Earl Dwayne Jackie Hamish Sienna Nolan Daren Jean Shirley Connor Geraldine Niall Kristi Monty Yvonne Tammie Zachariah Fatima Ruby Nadia Anahi Calum Peggy Alfredo Marybeth Bonnie Gordon Cara John Staci Samuel Carmen Rylee Yehudi Colm Beth Dulce Darius inley Javon Jason Perla Wayne Laila Kaleigh Maggie Don Quinn Collin Aniya Zoe Isabel Clint Leland Esmeralda Emma Madeline Byron Courtney Vanessa Terry Antoinette George Constance Preston Rolando Caleb Kenneth Lynette Carley Francesca Johnnie Jordyn Arturo Camila Skye Guy Ana Kaylin Nia Colton Bart Brendon Alvin Daryl Dirk Mya Pete Joann Uriel Alonzo Agnes Chris Alyson Paola Dora Elias Allen Jackie Eric Bonita Kelvin Emiliano Ashton Kyra Kailey Sonja Alberto Ty Summer Brayden Lori Kelly Tomas Joey Billie Katie Stephanie Danielle Alexis Jamal Kieran Lucinda Eliza Allyson Melinda Alma Piper Deana Harriet Bryce Eli Jadyn Rogelio Orlaith Janet Randal Toby Carla Lorie Caitlyn Annika Isabelle inn Ewan Maisie Michelle Grady Ida Reid Emely Tricia Beau Reese Vance Dalton Lexi Rafael Makenzie Mitzi Clinton Xena Angelina Kendrick Leslie Teddy Jerald Noelle Neil Marsha Gayle Omar Abigail Alexandra Phil Andre Billy Brenden Bianca Jared Gretchen Patrick Antonio Josephine Kyla Manuel Freya Kellie Tonia Jamie Sydney Andres Ruben Harrison Hector Clyde Wendell Kaden Ian Tracy Cathleen Shawn)
      names[rand(names.size)]
    end

    def last_name(replacement = nil)
      names = %w(Chung Chen Melton Hill Puckett Song Hamilton Bender Wagner McLaughlin McNamara Raynor Moon Woodard Desai Wallace Lawrence Griffin Dougherty Powers May Steele Teague Vick Gallagher Solomon Walsh Monroe Connolly Hawkins Middleton Goldstein Watts Johnston Weeks Wilkerson Barton Walton Hall Ross Chung Bender Woods Mangum Joseph Rosenthal Bowden Barton Underwood Jones Baker Merritt Cross Cooper Holmes Sharpe Morgan Hoyle Allen Rich Rich Grant Proctor Diaz Graham Watkins Hinton Marsh Hewitt Branch Walton O'Brien Case Watts Christensen Parks Hardin Lucas Eason Davidson Whitehead Rose Sparks Moore Pearson Rodgers Graves Scarborough Sutton Sinclair Bowman Olsen Love McLean Christian Lamb James Chandler Stout Cowan Golden Bowling Beasley Clapp Abrams Tilley Morse Boykin Sumner Cassidy Davidson Heath Blanchard McAllister McKenzie Byrne Schroeder Griffin Gross Perkins Robertson Palmer Brady Rowe Zhang Hodge Li Bowling Justice Glass Willis Hester Floyd Graves Fischer Norman Chan Hunt Byrd Lane Kaplan Heller May Jennings Hanna Locklear Holloway Jones Glover Vick O'Donnell Goldman McKenna Starr Stone McClure Watson Monroe Abbott Singer Hall Farrell Lucas Norman Atkins Monroe Robertson Sykes Reid Chandler Finch Hobbs Adkins Kinney Whitaker Alexander Conner Waters Becker Rollins Love Adkins Black Fox Hatcher Wu Lloyd Joyce Welch Matthews Chappell MacDonald Kane Butler Pickett Bowman Barton Kennedy Branch Thornton McNeill Weinstein Middleton Moss Lucas Rich Carlton Brady Schultz Nichols Harvey Stevenson Houston Dunn West O'Brien Barr Snyder Cain Heath Boswell Olsen Pittman Weiner Petersen Davis Coleman Terrell Norman Burch Weiner Parrott Henry Gray Chang McLean Eason Weeks Siegel Puckett Heath Hoyle Garrett Neal Baker Goldman Shaffer Choi Carver)
      names[rand(names.size)]
    end

    def email(replacement = nil)
      delimiters = [ '_', '-', '' ]
      domains = %w(gmail.com yahoo.com hotmail.com email.com live.com me.com mac.com aol.com fastmail.com mail.com)
      username = name.gsub(/[^\w]/, delimiters[rand(delimiters.size)])
      "#{username}@#{domains[rand(domains.size)]}".downcase
    end

    def image(size, options={})
      src              = "http://placehold.it/#{size}"
      hex              = %w[a b c d e f 0 1 2 3 4 5 6 7 8 9]
      background_color = options[:background_color]
      color            = options[:color]

      if options[:random_color]
        background_color = hex.shuffle[0...6].join
        color = hex.shuffle[0...6].join
      end

      src << "/#{background_color.sub(/^#/, '')}" if background_color
      src << "/ccc" if background_color.nil? && color
      src << "/#{color.sub(/^#/, '')}" if color
      src << "&text=#{Rack::Utils::escape(options[:text])}" if options[:text]

      src
    end

    private

    def randm(range)
      a = range.to_a
      a[rand(a.length)]
    end

    end
  end

  class LoremInlineMacro < Extensions::InlineMacroProcessor
    use_dsl
    named :lorem
    name_positional_attributes 'arg'

    def is_numeric(input)
      return true if input =~ /\A\d+\Z/
      false if Float(input) rescue false
    end

    def process parent, target, attributes
      lorem = Lorem::LoremObject.new
      method = target.to_sym
      if lorem.respond_to? method
        if (attributes.has_key? 'arg')
          if is_numeric(attributes['arg'])
            %w(words sentences).include?(target) ? content = lorem.send(method, attributes['arg'].to_i.abs) : nil
          else
            %w(word date image).include?(target) ? content = lorem.send(method, attributes['arg']) : nil
          end
          %w(sentences).include?(target) ? content.concat(".") : nil
          %(#{content})
        else
          %w(word sentence date name first_name last_name email).include?(target) ? content = lorem.send(method) : nil
          %w(sentence).include?(target) ? content.concat(".") : nil
          %(#{content})
        end
      else
        warn 'Unknown target for lorem block'
        nil
      end
    end
  end

  inline_macro LoremInlineMacro
end
