# Puma configuration (file)
# ------------------------------------------------------------------------------

# start puma
#
bind 'tcp://' + ENV["INTERFACE"] + ':' + ENV["PORT"]

# Code to run after puma is booted
#
after_booted do
  # configuration here
  # puts 'After booting ...'
end
