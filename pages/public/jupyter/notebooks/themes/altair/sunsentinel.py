# A theme for the Altair data visualization library based on the
# South Florida Sun Sentinel's style guide. (by SunSentinel)
#
def sunsentinel_theme():
    # Color palette
    black = '#000000'
    greydk = '#333333'
    greymed = '#999999'
    grey = '#cccccc'
    greylt = '#f1f1f1'
    white = '#fff'
    red = '#d80000'
    brightred = '#ff0000'
    sunrust = '#761113'
    palepink = '#ffc9bb'
    sky = '#4492e0'
    cloud = '#9dd1f6'
    navy = '#024584'

    # Typography
    headlineFontSize = 20
    headlineFontWeight = 'normal'
    headlineFont = 'Open Sans, Arial, sans'

    # Axes and legends
    titleFont = 'Open Sans, Arial, sans'
    titleFontWeight = 'normal'
    titleFontSize = 14

    # Ticks and labels
    labelFont = 'Open Sans, Arial, sans'
    labelFontSize = 12
    labelFontWeight = 'normal'

    return {
        "width": 720,
        "height": 405,
        "config": {
            "background": white,
            "title": {
                "font": headlineFont,
                "fontSize": headlineFontSize,
                "fontWeight": headlineFontWeight,
                "anchor": "start",
                "color": black
            },
            "axis": {
                "titleFont": titleFont,
                "titleFontSize": titleFontSize,
                "titleFontWeight": titleFontWeight,
                "labelFont": labelFont,
                "labelFontSize": labelFontSize,
                "labelFontWeight": labelFontWeight
            },
            "axisX": {
                "labelAngle": 0,
                "labelPadding": 3,
                "tickColor": grey,
                "tickSize": 3,
            },
            "axisY": {
                "labelAngle": 0,
                "labelBaseline": "middle",
                "titleAlign": "left",
                "titleAngle": 0,

            }
            "range": {
                "category": [sunrust, red, palepink, grey, greymed, greydk],
                "diverging": [red, palepink, grey, cloud, sky],
            },
            "legend": {
                "labelFont": labelFont,
                "labelFontSize": labelFontSize,
                "titleFont": titleFont,
                "titleFontSize": titleFontSize
            },
            "view": {
                "stroke": 0
            },
            ### MARKS CONFIGURATIONS ###
            "area": {
               "fill": sunrust,
            },
            "circle": {
               "fill": sunrust,
               "size": 40
            },
            "line": {
               "color": sunrust,
               "stroke": sunrust,
               "strokeWidth": 3,
            },
            "trail": {
               "color": sunrust,
               "stroke": sunrust,
               "strokeWidth": 0,
               "size": 1,
            },
            "path": {
               "stroke": sunrust,
               "strokeWidth": 0.5,
            },
            "point": {
               "color": sunrust,
               "size": 40
            },
            "text": {
               "color": sunrust,
               "fontSize": 14,
               "align": "right",
               "size": 14,
            },
            "bar": {
                "size": 10,
                "binSpacing": 1,
                "continuousBandSize": 10,
                "fill": sunrust,
                "stroke": False,
            },
            "tick": {
                "color": sunrust
            }
        }
    }
