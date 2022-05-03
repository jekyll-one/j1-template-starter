# A theme for making altair plots matching the spaCy brand.
#

# category: blue, green, purple following themes on spacy.io
# Note that the blue is the "darker" blue which meets WCAG AA contrast ratio standards
spacy_category = ["#077fa6", "#047c5c", "#6642d1"]

spacy_sequential = [
    "#8efcff",
    "#6bddff",
    "#46c0f5",
    "#0da6d9",
    "#018abb",
    "#006f9f",
    "#005583",
    "#003d68",
    "#00254e",
]

spacy_diverging = [
    "#047c5c",
    "#50957b",
    "#81ad9b",
    "#afc5bc",
    "#dedede",
    "#bacfdd",
    "#94c1db",
    "#66b2d9",
    "#09a4d7",
]

# --font-size-xs: 1.1rem;
# --font-size-sm: 1.3rem;
# --font-size-md: 1.35rem;
# --font-size-lg: 1.4rem;
# --font-size-code: 1.2rem;


def spacy_base_theme():
    primary_color = "#077fa6"
    font_color = "#1a1e23"
    grey_color = "#f5f5f5"
    base_size_px = 16
    md_font = base_size_px
    sm_font = base_size_px * 0.8
    lg_font = base_size_px * 1.35

    config = {
        "config": {
            "arc": {"fill": primary_color},
            "area": {"fill": primary_color},
            "circle": {"fill": primary_color, "stroke": font_color, "strokeWidth": 0.5},
            "line": {"stroke": primary_color},
            "path": {"stroke": primary_color},
            "point": {"stroke": primary_color},
            "rect": {"fill": primary_color},
            "shape": {"stroke": primary_color},
            "symbol": {"fill": primary_color},
            "title": {
                "color": font_color,
                "fontSize": lg_font,
            },
            "axis": {
                "titleColor": font_color,
                "titleFontSize": md_font,
                "labelColor": font_color,
                "labelFontSize": sm_font,
                "gridColor": grey_color,
                "domainColor": font_color,
                "tickColor": "#fff",
            },
            "header": {
                "labelFontSize": md_font,
                "titleFontSize": md_font,
            },
            "legend": {
                "titleColor": font_color,
                "titleFontSize": md_font,
                "labelColor": font_color,
                "labelFontSize": sm_font,
            },
            "range": {
                "category": spacy_category,
                "diverging": spacy_diverging,
                "heatmap": spacy_sequential,
                "ramp": spacy_sequential,
                "ordinal": spacy_sequential,
            },
        }
    }
    return config


def spacy_mono_theme():
    font = "JetBrains Mono"
    primary_color = "#077fa6"
    font_color = "#1a1e23"
    grey_color = "#f5f5f5"
    base_size_px = 16
    md_font = base_size_px
    sm_font = base_size_px * 0.8
    lg_font = base_size_px * 1.35

    config = {
        "config": {
            "arc": {"fill": primary_color},
            "area": {"fill": primary_color},
            "circle": {"fill": primary_color, "stroke": font_color, "strokeWidth": 0.5},
            "line": {"stroke": primary_color},
            "path": {"stroke": primary_color},
            "point": {"stroke": primary_color},
            "rect": {"fill": primary_color},
            "shape": {"stroke": primary_color},
            "symbol": {"fill": primary_color},
            "title": {
                "font": font,
                "color": font_color,
                "fontSize": lg_font,
            },
            "axis": {
                "titleFont": font,
                "titleColor": font_color,
                "titleFontSize": md_font,
                "labelFont": font,
                "labelColor": font_color,
                "labelFontSize": sm_font,
                "gridColor": grey_color,
                "domainColor": font_color,
                "tickColor": "#fff",
            },
            "header": {
                "labelFont": font,
                "titleFont": font,
                "labelFontSize": md_font,
                "titleFontSize": md_font,
            },
            "legend": {
                "titleFont": font,
                "titleColor": font_color,
                "titleFontSize": md_font,
                "labelFont": font,
                "labelColor": font_color,
                "labelFontSize": sm_font,
            },
            "range": {
                "category": spacy_category,
                "diverging": spacy_diverging,
                "heatmap": spacy_sequential,
                "ramp": spacy_sequential,
                "ordinal": spacy_sequential,
            },
        }
    }
    return config


# alt.themes.register("spacy-base", spacy_base_theme)
# alt.themes.register("spacy-mono", spacy_mono_theme)
