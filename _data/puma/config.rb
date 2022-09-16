# Puma configuration (file)
#
bind 'tcp://' + ENV["INTERFACE"] + ':' + ENV["PORT"]
