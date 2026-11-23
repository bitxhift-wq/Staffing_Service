import os
import cv2
import numpy as np
import subprocess

REF_PATH = r"C:/Users/mukhe/.gemini/antigravity/brain/3ad0fb68-9967-4080-a85f-89701dfcc985/.user_uploaded/media_1795417054350_ae36489d.jpg"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_DIR = r"C:\STAFFING\public\assets"
SRC_ASSETS_DIR = r"C:\STAFFING\src\assets"
TEST_ARTIFACTS = r"C:\STAFFING\test-artifacts"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(SRC_ASSETS_DIR, exist_ok=True)
os.makedirs(TEST_ARTIFACTS, exist_ok=True)

def build_logo():
    print("Loading reference image:", REF_PATH)
    img = cv2.imread(REF_PATH, cv2.IMREAD_GRAYSCALE)
    h_orig, w_orig = img.shape
    
    # 4x super-resolution scale (1024x341 -> 4096x1364)
    scale = 4
    target_w = w_orig * scale # 4096
    target_h = h_orig * scale # 1364
    
    print(f"Upscaling to {target_w}x{target_h} using Lanczos-4 interpolation...")
    upscaled = cv2.resize(img, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4)
    
    # Slight bilateral filtering to keep crisp sharp edges while eliminating JPEG compression noise
    filtered = cv2.bilateralFilter(upscaled, d=7, sigmaColor=40, sigmaSpace=40)
    
    # Optimal threshold for white elements
    _, thresh = cv2.threshold(filtered, 95, 255, cv2.THRESH_BINARY)
    
    # Find all contours and hierarchy
    contours, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)
    hier = hierarchy[0]
    
    def smooth_contour_to_svg_path(cnt, epsilon=1.0):
        approx = cv2.approxPolyDP(cnt, epsilon, True)
        pts = approx.reshape(-1, 2)
        if len(pts) < 3:
            return ""
        
        n = len(pts)
        d = [f"M {pts[0][0]:.1f} {pts[0][1]:.1f}"]
        
        for i in range(n):
            p0 = pts[(i - 1) % n]
            p1 = pts[i]
            p2 = pts[(i + 1) % n]
            p3 = pts[(i + 2) % n]
            
            v1 = (p1 - p0).astype(float)
            v2 = (p2 - p1).astype(float)
            len1 = np.hypot(v1[0], v1[1])
            len2 = np.hypot(v2[0], v2[1])
            
            cos_theta = np.dot(v1, v2) / (len1 * len2) if len1 > 0 and len2 > 0 else 1.0
            
            # Catmull-Rom to cubic Bezier
            cp1 = p1 + (p2 - p0) / 6.0
            cp2 = p2 - (p3 - p1) / 6.0
            
            # If segment is almost straight or very short, use line; otherwise smooth cubic Bezier
            if cos_theta > 0.985 or len2 < 4.0:
                d.append(f"L {p2[0]:.1f} {p2[1]:.1f}")
            else:
                d.append(f"C {cp1[0]:.1f} {cp1[1]:.1f}, {cp2[0]:.1f} {cp2[1]:.1f}, {p2[0]:.1f} {p2[1]:.1f}")
                
        d.append("Z")
        return " ".join(d)

    # Classify contours into elements
    # Root contours and hole contours
    all_paths = []
    symbol_paths = []
    wordmark_paths = []
    tagline_paths = []
    divider_paths = []
    
    min_area = 50 * (scale ** 2) / 16 # filter minor noise
    
    for i in range(len(contours)):
        area = cv2.contourArea(contours[i])
        if area > min_area:
            x, y, w, h = cv2.boundingRect(contours[i])
            path_d = smooth_contour_to_svg_path(contours[i], epsilon=1.0)
            if not path_d:
                continue
                
            all_paths.append(path_d)
            
            # Classification based on coordinates
            if y < 800: # Top line (Symbol + APPLIED MERIT)
                if x < 1360 and (y < 500 or x < 1000): # Symbol A and swoosh
                    symbol_paths.append(path_d)
                else: # APPLIED MERIT letterforms
                    wordmark_paths.append(path_d)
            else: # Bottom line (Dividers + POWERED BY SMRIKAAM)
                if w > 300 and h < 50: # Divider line
                    divider_paths.append(path_d)
                else: # Tagline letters
                    tagline_paths.append(path_d)
                    
    print(f"Extracted {len(all_paths)} total path contours:")
    print(f"  Symbol: {len(symbol_paths)}")
    print(f"  Wordmark (APPLIED MERIT): {len(wordmark_paths)}")
    print(f"  Tagline (POWERED BY SMRIKAAM): {len(tagline_paths)}")
    print(f"  Dividers: {len(divider_paths)}")
    
    combined_d = " ".join(all_paths)
    
    # 1. Master SVG with Black Background
    svg_black = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {target_w} {target_h}" width="{target_w}" height="{target_h}">
  <rect width="100%" height="100%" fill="#000000"/>
  <path d="{combined_d}" fill="#FFFFFF" fill-rule="evenodd"/>
</svg>'''

    # 2. Master SVG with Transparent Background
    svg_transparent = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {target_w} {target_h}" width="{target_w}" height="{target_h}">
  <path d="{combined_d}" fill="#FFFFFF" fill-rule="evenodd"/>
</svg>'''

    # Write SVG files
    svg_black_path = os.path.join(OUTPUT_DIR, "AppliedMerit_Logo.svg")
    svg_trans_path = os.path.join(OUTPUT_DIR, "AppliedMerit_Logo_Transparent.svg")
    
    with open(svg_black_path, "w", encoding="utf-8") as f:
        f.write(svg_black)
    with open(svg_trans_path, "w", encoding="utf-8") as f:
        f.write(svg_transparent)
        
    print(f"Wrote master SVGs to {OUTPUT_DIR}")
    
    # Also write to src/assets
    with open(os.path.join(SRC_ASSETS_DIR, "AppliedMerit_Logo.svg"), "w", encoding="utf-8") as f:
        f.write(svg_black)
    with open(os.path.join(SRC_ASSETS_DIR, "AppliedMerit_Logo_Transparent.svg"), "w", encoding="utf-8") as f:
        f.write(svg_transparent)

    # Render PNGs using Headless Chrome
    # 1. Master 4096px PNG with black background
    png_black_path = os.path.join(OUTPUT_DIR, "AppliedMerit_Logo_4096.png")
    # 2. Master 4096px PNG transparent
    png_trans_path = os.path.join(OUTPUT_DIR, "AppliedMerit_Logo_Transparent_4096.png")
    # 3. 2048px versions for fast load & compatibility
    png_2048_path = os.path.join(OUTPUT_DIR, "AppliedMerit_Logo_2048.png")
    
    print("Rendering 4096px PNGs via Headless Chrome...")
    # Render black background PNG
    cmd_black = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        f"--window-size={target_w},{target_h}",
        f"--screenshot={png_black_path}",
        f"file:///{svg_black_path.replace(os.sep, '/')}"
    ]
    subprocess.run(cmd_black, check=True)
    print(f"Rendered {png_black_path}")

    # Render transparent background PNG
    cmd_trans = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--default-background-color=00000000",
        f"--window-size={target_w},{target_h}",
        f"--screenshot={png_trans_path}",
        f"file:///{svg_trans_path.replace(os.sep, '/')}"
    ]
    subprocess.run(cmd_trans, check=True)
    print(f"Rendered {png_trans_path}")
    
    # Render 2048px PNG
    cmd_2048 = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--default-background-color=00000000",
        "--window-size=2048,682",
        f"--screenshot={png_2048_path}",
        f"file:///{svg_trans_path.replace(os.sep, '/')}"
    ]
    subprocess.run(cmd_2048, check=True)
    print(f"Rendered {png_2048_path}")

    # Render 204x38 navbar test
    navbar_test_path = os.path.join(TEST_ARTIFACTS, "navbar_test_204x38.png")
    cmd_nav = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--window-size=204,38",
        f"--screenshot={navbar_test_path}",
        f"file:///{svg_black_path.replace(os.sep, '/')}"
    ]
    subprocess.run(cmd_nav, check=True)
    print(f"Rendered {navbar_test_path}")
    
    # Copy master files to src/assets for app build
    for f in ["AppliedMerit_Logo_4096.png", "AppliedMerit_Logo_Transparent_4096.png", "AppliedMerit_Logo_2048.png"]:
        src = os.path.join(OUTPUT_DIR, f)
        dst = os.path.join(SRC_ASSETS_DIR, f)
        with open(src, "rb") as rf, open(dst, "wb") as wf:
            wf.write(rf.read())

if __name__ == "__main__":
    build_logo()
