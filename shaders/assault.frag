// PAYDAY 2 assault alert banner for KDE Shader Wallpaper.
// iChannel0: repeating title texture rendered by tools/make_banner.py
// @channels tex0, tex1, none, none

uniform bool iHasArtwork;

// Coordinates use screen-height units. These proportions match the supplied
// reference: a long framed title strip centered on the screen.
#define PANEL_HALF_WIDTH 0.55
#define PANEL_HALF_HEIGHT 0.084
#define PANEL_CENTER_Y 0.0
#define INDICATOR_SIZE 0.092
#define INDICATOR_GAP 0.015
#define GROUP_SHIFT ((INDICATOR_SIZE + INDICATOR_GAP) * 0.5)
#define INDICATOR_CENTER_X (PANEL_HALF_WIDTH + INDICATOR_GAP + INDICATOR_SIZE * 0.5)

float boxSdf(vec2 p, vec2 halfSize)
{
    vec2 d = abs(p) - halfSize;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float segmentDistance(vec2 p, vec2 a, vec2 b)
{
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.000001), 0.0, 1.0);
    return length(pa - ba * h);
}

float openFrame(vec2 p, vec2 halfSize)
{
    // Short L-shaped end marks; no long top/bottom strokes.
    float d = 10.0;
    float cornerX = halfSize.x;
    float cornerY = halfSize.y;
    // Equal horizontal/vertical lengths. Use boxes for each stroke instead
    // of round-capped segments so the L corners stay square and crisp.
    float armLength = 0.040;
    float stroke = 0.0027;
    for (int sx = -1; sx <= 1; sx += 2) {
        for (int sy = -1; sy <= 1; sy += 2) {
            vec2 c = vec2(float(sx) * cornerX, float(sy) * cornerY);
            vec2 horizontalCenter = c + vec2(-float(sx) * armLength * 0.5, 0.0);
            vec2 verticalCenter = c + vec2(0.0, -float(sy) * armLength * 0.5);
            // Extend each bar through the vertex by half a stroke so the two
            // rectangles overlap after rasterization and form one solid L.
            float halfArm = (armLength + stroke) * 0.5;
            d = min(d, boxSdf(p - horizontalCenter, vec2(halfArm, stroke)));
            d = min(d, boxSdf(p - verticalCenter, vec2(stroke, halfArm)));
        }
    }
    return d;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 resolution = iResolution.xy;
    vec2 p = (fragCoord - 0.5 * resolution) / resolution.y;
    vec3 yellow = vec3(1.0, 0.91, 0.025);
    vec3 color = vec3(0.0);
    if (iHasArtwork) {
        // Match KDE's Scaled mode: stretch the complete artwork to the exact
        // monitor area, with no crop or letterboxing.
        vec2 artworkUv = fragCoord / resolution;
        vec4 artwork = texture(iChannel1, artworkUv);
        color = artwork.rgb * artwork.a * 0.25;
    }
    // Linear triangular pulse: one full cycle every 1.5 seconds, with a 75% floor.
    float pulsePhase = fract(iTime / 1.5);
    float pulse = 1.0 - abs(2.0 * pulsePhase - 1.0);
    float yellowFlicker = 0.75 + 0.25 * pulse;

    // Track changes are supplied by MPRIS as the scrolling iChannel0 title.
    // This shader needs no audio texture on iChannel1.
    float reactiveYellow = yellowFlicker;

    // Center the combined banner + indicator group as in the HTML flex row.
    vec2 titleP = vec2(p.x + GROUP_SHIFT, p.y - PANEL_CENTER_Y);

    // The panel's original slow background pulse is independent of the yellow flicker.
    float bgPulse = 0.5 + 0.5 * cos(6.2831853 * iTime);
    vec3 panelTint = vec3(0.18, 0.267, 0.074) * 0.54 * bgPulse;
    float panel = 1.0 - smoothstep(0.001, 0.004,
        boxSdf(titleP, vec2(PANEL_HALF_WIDTH, PANEL_HALF_HEIGHT)));
    // Keep the muted banner tint, but let some of the album art show through.
    float panelOpacity = iHasArtwork ? 0.50 : 1.0;
    color = mix(color, panelTint, panel * panelOpacity);

    // Four open L corners around the text, matching the reference graphic.
    float frameD = openFrame(titleP, vec2(PANEL_HALF_WIDTH, PANEL_HALF_HEIGHT));
    float frame = 1.0 - smoothstep(0.0007, 0.0024, frameD);
    vec3 flashYellow = min(yellow * 1.50, vec3(1.0));
    color = mix(color, flashYellow, frame * reactiveYellow);

    // Right-side alert tile, top-aligned with the banner. The geometry follows
    // the github.io reference: 60/110 of the banner height and a 10px gap.
    vec2 indicatorP = titleP - vec2(INDICATOR_CENTER_X,
                                    PANEL_HALF_HEIGHT - INDICATOR_SIZE * 0.5);
    // Keep the cyan ring wider than the edge antialias band so yellow fill
    // cannot cover it during compositing (about 3px at the reference size).
    float indicatorD = boxSdf(indicatorP, vec2(INDICATOR_SIZE * 0.5));
    float indicatorOuter = 1.0 - smoothstep(0.0007, 0.0024, indicatorD);
    float indicatorInner = indicatorOuter;
    float triangleBaseHalfWidth = 0.27;
    vec2 triTop = vec2(0.0, INDICATOR_SIZE * 0.23);
    vec2 triBottomRight = vec2(INDICATOR_SIZE * triangleBaseHalfWidth,
                               -INDICATOR_SIZE * 0.23);
    vec2 triBottomLeft = vec2(-INDICATOR_SIZE * triangleBaseHalfWidth,
                              -INDICATOR_SIZE * 0.23);
    float triangleD = min(segmentDistance(indicatorP, triTop, triBottomRight),
                          min(segmentDistance(indicatorP, triBottomRight, triBottomLeft),
                              segmentDistance(indicatorP, triBottomLeft, triTop)));
    float triangleStroke = 1.0 - smoothstep(INDICATOR_SIZE * 0.04896,
        INDICATOR_SIZE * 0.04896 + 0.45 / resolution.y, triangleD);

    vec3 indicatorYellow = vec3(1.0, 0.937, 0.0);
    // Plain yellow tile with the original black alert triangle.
    color = mix(color, indicatorYellow, indicatorInner);
    color = mix(color, vec3(0.0), triangleStroke * indicatorInner);

    // The banner is visible from frame one. The text starts at the right edge
    // immediately and scrolls left at the reference speed of 250 px/s.
    float titleLeft = -PANEL_HALF_WIDTH + 0.012;
    float titleRight = PANEL_HALF_WIDTH - 0.012;
    float tickerX = titleP.x - titleLeft;
    float tickerWidth = titleRight - titleLeft;
    float texWidth = max(iChannelResolution[0].x, 1.0);
    float texHeight = max(iChannelResolution[0].y, 1.0);
    float glyphScaleX = 1.70;
    float glyphScaleY = 1.62;
    // Keep U unwrapped; the texture's Repeat wrap mode handles scrolling.
    // Applying fract() here breaks texture derivatives at the seam and creates
    // a visible vertical line when mipmapping is enabled.
    float scrollPixels = iTime * 250.0;
    float tickerPixelX = tickerX * resolution.y;
    float tickerPixelWidth = tickerWidth * resolution.y;
    // Repeat wrapping uses the full texture width as the ticker period, so a
    // long media title stays intact before the next copy begins.
    float glyphU = (tickerPixelX - tickerPixelWidth + scrollPixels) * glyphScaleX / texWidth;
    float glyphV = 0.5 + titleP.y * resolution.y * glyphScaleY / texHeight;
    vec4 glyph = texture(iChannel0, vec2(glyphU, glyphV));
    // Hide repeated tiles until the first one has entered from the right.
    float inTicker = step(0.0, tickerX) * step(tickerX, tickerWidth)
                   * step(-PANEL_HALF_HEIGHT, titleP.y) * step(titleP.y, PANEL_HALF_HEIGHT);
    color = mix(color, flashYellow, glyph.a * inTicker * panel * reactiveYellow);

    fragColor = vec4(color, 1.0);
}
