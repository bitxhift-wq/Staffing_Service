import subprocess
import os
import cv2
import numpy as np

with open(r'c:\STAFFING\public\assets\AppliedMerit_Logo_Transparent.svg', 'r') as f:
    svg_raw = f.read()

# Exact content bounds:
# x: 325 to 3671 (w=3347)
# y: 319 to 889 (h=571)
# Add proportional padding (2% horizontal, 3% vertical) matching standard SVG brand assets:
# pad_x = 70, pad_y = 20
# min_x = 255, min_y = 299, width = 3486, height = 611 (aspect ratio 5.70:1)

svg_tight = svg_raw.replace('viewBox="0 0 4096 1364"', 'viewBox="255 299 3486 611"')
svg_tight = svg_tight.replace('width="4096" height="1364"', 'width="3486" height="611"')

with open(r'c:\STAFFING\test-artifacts\AppliedMerit_tight.svg', 'w') as f:
    f.write(svg_tight)

html = '''<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; background: #000000; padding: 20px; font-family: sans-serif; color: #fff; }
  .nav-box {
    width: 165px;
    height: 30px;
    border: 1px dashed #444;
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }
  .nav-logo {
    display: block;
    width: 100%;
    height: 100%;
    max-width: 165px;
    max-height: 30px;
    object-fit: contain;
    object-position: left center;
  }
</style>
</head>
<body>
  <div>Original AppliedSkills_Logo.png:</div>
  <div class="nav-box">
    <img src="../public/assets/AppliedSkills_Logo.png" class="nav-logo">
  </div>
  <div>Tight ViewBox SVG in navbar:</div>
  <div class="nav-box">
    <img src="AppliedMerit_tight.svg" class="nav-logo">
  </div>
</body>
</html>'''

with open(r'c:\STAFFING\test-artifacts\compare_navbar_logos.html', 'w') as f:
    f.write(html)

cmd = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    '--headless=new',
    '--disable-gpu',
    '--window-size=600,400',
    r'--screenshot=C:\STAFFING\test-artifacts\compare_navbar_logos.png',
    r'file:///C:/STAFFING/test-artifacts/compare_navbar_logos.html'
]
subprocess.run(cmd, check=True)
print('Comparison screenshot saved!')
