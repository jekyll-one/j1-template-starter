# A theme for Altair charts based on the University of Washington
# branding guidelines
#
def husky():

    purple = '#4b2e83'
    gold = '#b7a57a'
    metallic_gold = '#85754d'
    light_gray = '#d9d9d9'
    dark_gray = '#444444'
    white = '#ffffff'
    black = '#000000'

    header_font = 'EncodeSans-Regular'
    body_font = 'OpenSans-Regular'
    body_font_bold = 'OpenSans-Bold'


    return {
        "width": 450,
        "height": 300,
        "config": {
            "title": {
                "fontSize": 18,
                "font": header_font,
                "anchor": "start", # equivalent of left-aligned
                "color": purple
            },
            "axisX": {
                "domain": True,
                "domainColor": dark_gray,
                "domainWidth": 1,
                "grid": True,
                "gridColor": light_gray,
                "gridWidth": 0.5,
                "labelFont": body_font,
                "labelFontSize": 12,
                "labelColor": dark_gray,
                "labelAngle": 0,
                "tickColor": dark_gray,
                "tickSize": 5,
                "titleFont": body_font_bold,
                "titleFontSize": 12,
            },
            "axisY": {
                "domain": True,
                "domainColor": dark_gray,
                "grid": True,
                "gridColor": light_gray,
                "gridWidth": 0.5,
                "labelFont": body_font,
                "labelFontSize": 12,
                "labelAngle": 0,
                "ticks": True,
                "titleFont": body_font_bold,
                "titleFontSize": 12,
            },
            "header": {
                "labelFont": body_font,
                "labelFontSize": 16,
                "titleFont": body_font_bold,
                "titleFontSize": 16
            },
            "range": {
                "category": [purple, gold, light_gray, metallic_gold, black, dark_gray],
                "diverging": [purple,'#c2a5cf', light_gray, gold, metallic_gold],
            },
            "legend": {
                "labelFont": body_font,
                "labelFontSize": 12,
                "symbolSize": 100, # default,
                "titleFont": body_font_bold,
                "titleFontSize": 12,
            },
            ### MARKS CONFIGURATIONS ###
            "area": {
               "fill": purple,
            },
            "circle": {
               "fill": purple,
               "size": 40
            },
            "line": {
               "color": purple,
               "stroke": purple,
               "strokeWidth": 3,
            },
            "trail": {
               "color": purple,
               "stroke": purple,
               "strokeWidth": 0,
               "size": 1,
            },
            "path": {
               "stroke": purple,
               "strokeWidth": 0.5,
            },
            "point": {
               "color": purple,
               "size": 40
            },
            "text": {
               "font": body_font,
               "color": purple,
               "fontSize": 11,
               "align": "right",
               "size": 14,
            },
            "bar": {
                "size": 10,
                "binSpacing": 1,
                "continuousBandSize": 10,
#                 "discreteBandSize": 10,
                "fill": purple,
                "stroke": False,
            },
            "tick": {
                "color": purple
            }
        }
    }
