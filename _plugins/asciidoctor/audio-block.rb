# ------------------------------------------------------------------------------
# ~/_plugins/asciidoctor-extensions/audio-block.rb
# Asciidoctor extension for local HTML5 MP3 Audio
#
# Product/Info:
# https://jekyll.one
#
# Copyright (C) 2023, 2024 Juergen Adams
#
# J1 Template is licensed under the MIT License.
# See: https://github.com/jekyll-one-org/j1-template/blob/main/LICENSE.md
# ------------------------------------------------------------------------------
require 'asciidoctor/extensions' unless RUBY_ENGINE == 'opal'
include Asciidoctor

# ------------------------------------------------------------------------------
# A block macro that embeds a local MP3 audio into the output document
#
# Usage:
#
#   audio::mp3_audio_file[role="CSS classes"]
#
# Example:
#
#   .Ambient Piano (sound-effect)
#   audio::/assets/audio/sound-effects/ambient-piano.mp3[role="mt-5 mb-5"]
#
# ------------------------------------------------------------------------------

Asciidoctor::Extensions.register do

  class AudioBlockMacro < Extensions::BlockMacroProcessor
    use_dsl

    named :audio
    name_positional_attributes 'start', 'role'
    default_attrs 'start' => '00:00:00',
                  'role' => 'mt-3 mb-3'

    def process parent, target, attributes

      chars         = [('a'..'z'), ('A'..'Z'), ('0'..'9')].map(&:to_a).flatten
      audio_id      = (0...11).map { chars[rand(chars.length)] }.join

      title_html    = (attributes.has_key? 'title') ? %(<div class="video-title">#{attributes['title']}</div>\n) : nil

      html = %(
        <div class="audio-player #{attributes['role']}">
          #{title_html}
          <audio
            id="#{audio_id}"
            controls
          >
            <source src="#{target}">
            Your browser does not support the HTML5 audio element.
          </audio>
        </div>

        <script>
          $(function() {
            var dependencies_met_page_ready = setInterval (function (options) {
              var pageState   = $('#no_flicker').css("display");
              var pageVisible = (pageState == 'block') ? true : false;

              if (j1.getState() === 'finished' && pageVisible) {
                // 00:05:49
                var ts = "#{attributes['start']}";
                var startFromSecond = new Date('1970-01-01T' + ts + 'Z').getTime() / 1000;
                const audio = document.getElementById("#{audio_id}");
                //add the time in seconds
                audio.currentTime = startFromSecond;
                audio.style.display = 'block';
                clearInterval(dependencies_met_page_ready);
              }
            }, 10);
          });
        </script>
      )

      create_pass_block parent, html, attributes, subs: nil
    end
  end

  block_macro AudioBlockMacro
end
