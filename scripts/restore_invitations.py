"""
Full Invitation Photo Restoration Pipeline
==========================================
1. Background removal (rembg)
2. Perspective / deskew correction (opencv)
3. Image enhancement (sharpening, contrast)
4. Duplicate detection & removal (perceptual hash)
5. Best quality selection
"""

import os
import sys
import shutil
import hashlib
import numpy as np
from pathlib import Path
from PIL import Image, ImageFilter, ImageEnhance
import cv2

# Try to import rembg
try:
    from rembg import remove as rembg_remove
    REMBG_AVAILABLE = True
    print("✅ rembg available — background removal enabled")
except ImportError:
    REMBG_AVAILABLE = False
    print("⚠️  rembg not available — will use OpenCV contour-based bg removal")

# ─── Paths ───────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.parent
INV_DIR      = PROJECT_ROOT / "public" / "assets" / "invitations"
TEMPLE_DIR   = PROJECT_ROOT / "public" / "assets" / "temple_gallery"
OUT_INV_DIR  = PROJECT_ROOT / "public" / "assets" / "invitations_restored"
OUT_TEMPLE_DIR = PROJECT_ROOT / "public" / "assets" / "temple_gallery_deduped"
BACKUP_DIR   = PROJECT_ROOT / "public" / "assets" / "_backup_originals"

OUT_INV_DIR.mkdir(parents=True, exist_ok=True)
OUT_TEMPLE_DIR.mkdir(parents=True, exist_ok=True)
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

# ─── Perceptual Hash ─────────────────────────────────────────────────────────
def perceptual_hash(img_path, size=16):
    """Returns a numpy array of grayscale pixel values (16x16 = 256 values)."""
    img = Image.open(img_path).convert("L").resize((size, size), Image.LANCZOS)
    return np.array(img).flatten().astype(float)

def hash_distance(h1, h2):
    """Average absolute difference between two perceptual hashes."""
    return float(np.mean(np.abs(h1 - h2)))

def file_size(p):
    return os.path.getsize(p)

def image_resolution(p):
    with Image.open(p) as img:
        return img.width * img.height

# ─── Background Removal ──────────────────────────────────────────────────────
def remove_background_rembg(input_path, output_path):
    """Use rembg AI to remove background, output PNG with transparency."""
    with open(input_path, "rb") as f:
        inp = f.read()
    result = rembg_remove(inp)
    with open(output_path, "wb") as f:
        f.write(result)
    print(f"  [rembg] Background removed: {output_path.name}")

def remove_background_opencv(input_path, output_path):
    """
    OpenCV-based document background removal:
    1. Convert to grayscale
    2. Adaptive threshold to find document edges
    3. Find largest contour (the invitation card)
    4. Mask everything outside
    """
    img_bgr = cv2.imread(str(input_path))
    if img_bgr is None:
        shutil.copy(input_path, output_path)
        return

    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # Blur and threshold to find the document
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Morphological close to fill holes
    kernel = np.ones((15, 15), np.uint8)
    closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

    # Find contours
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        shutil.copy(input_path, output_path)
        return

    # Largest contour = the invitation card
    largest = max(contours, key=cv2.contourArea)

    # Create mask
    mask = np.zeros_like(gray)
    cv2.drawContours(mask, [largest], -1, 255, thickness=cv2.FILLED)

    # Apply mask
    result_bgr = cv2.bitwise_and(img_bgr, img_bgr, mask=mask)

    # Convert to RGBA (transparent background)
    result_rgba = cv2.cvtColor(result_bgr, cv2.COLOR_BGR2BGRA)
    result_rgba[:, :, 3] = mask  # alpha channel = mask

    cv2.imwrite(str(output_path), result_rgba)
    print(f"  [opencv] Background removed: {output_path.name}")

# ─── Perspective / Deskew Correction ─────────────────────────────────────────
def correct_perspective(input_path, output_path):
    """
    Detect the four corners of the invitation card and apply perspective transform
    to produce a flat, rectangular output.
    """
    img = cv2.imread(str(input_path))
    if img is None:
        shutil.copy(input_path, output_path)
        return False

    orig = img.copy()
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 30, 120)

    # Dilate edges to connect broken lines
    kernel = np.ones((3, 3), np.uint8)
    edged = cv2.dilate(edged, kernel, iterations=2)

    contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    doc_contour = None
    for c in contours[:10]:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            doc_contour = approx
            break

    if doc_contour is None:
        # No 4-corner contour found — just save as-is
        shutil.copy(input_path, output_path)
        return False

    # Order points: top-left, top-right, bottom-right, bottom-left
    pts = doc_contour.reshape(4, 2).astype("float32")
    rect = order_points(pts)
    (tl, tr, br, bl) = rect

    widthA  = np.linalg.norm(br - bl)
    widthB  = np.linalg.norm(tr - tl)
    maxW    = max(int(widthA), int(widthB))

    heightA = np.linalg.norm(tr - br)
    heightB = np.linalg.norm(tl - bl)
    maxH    = max(int(heightA), int(heightB))

    if maxW < 100 or maxH < 100:
        shutil.copy(input_path, output_path)
        return False

    dst = np.array([
        [0, 0], [maxW - 1, 0],
        [maxW - 1, maxH - 1], [0, maxH - 1]
    ], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(orig, M, (maxW, maxH))
    cv2.imwrite(str(output_path), warped)
    print(f"  [perspective] Corrected: {output_path.name}")
    return True

def order_points(pts):
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect

# ─── Image Enhancement ────────────────────────────────────────────────────────
def enhance_image(input_path, output_path, is_invitation=True):
    """
    Sharpen, denoise, and enhance contrast.
    For invitations: stronger sharpening to make text crisp.
    For temple photos: gentle enhancement to preserve natural look.
    """
    img = Image.open(input_path).convert("RGB")

    # Auto-orient
    try:
        import PIL.ExifTags
        exif = img._getexif()
        if exif:
            orientation_key = next(
                (k for k, v in PIL.ExifTags.TAGS.items() if v == "Orientation"), None
            )
            if orientation_key and orientation_key in exif:
                orientation = exif[orientation_key]
                rotations = {3: 180, 6: 270, 8: 90}
                if orientation in rotations:
                    img = img.rotate(rotations[orientation], expand=True)
    except Exception:
        pass

    if is_invitation:
        # Stronger sharpening for document text
        img = img.filter(ImageFilter.UnsharpMask(radius=2.0, percent=180, threshold=2))
        img = ImageEnhance.Sharpness(img).enhance(2.2)
        img = ImageEnhance.Contrast(img).enhance(1.25)
        img = ImageEnhance.Color(img).enhance(1.15)
    else:
        # Gentle for photos
        img = img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=120, threshold=3))
        img = ImageEnhance.Sharpness(img).enhance(1.5)
        img = ImageEnhance.Contrast(img).enhance(1.10)

    # Save with high quality
    suffix = Path(output_path).suffix.lower()
    if suffix in [".jpg", ".jpeg"]:
        img.save(output_path, "JPEG", quality=95, subsampling=0)
    elif suffix == ".png":
        img.save(output_path, "PNG", optimize=True)
    else:
        img.save(output_path, quality=95)

# ─── Duplicate Detection ──────────────────────────────────────────────────────
def find_duplicates(folder, threshold=6.0):
    """
    Find duplicate/near-duplicate images using perceptual hashing.
    Returns list of clusters; each cluster = [best_file, dup1, dup2, ...]
    """
    files = [f for f in Path(folder).iterdir()
             if f.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}]

    print(f"\nScanning {len(files)} files in {folder} for duplicates...")

    hashes = {}
    for f in files:
        try:
            hashes[f] = perceptual_hash(f)
        except Exception as e:
            print(f"  ⚠️  Skip {f.name}: {e}")

    assigned = set()
    clusters = []

    file_list = list(hashes.keys())
    for i, f1 in enumerate(file_list):
        if f1 in assigned:
            continue
        cluster = [f1]
        assigned.add(f1)
        for f2 in file_list[i+1:]:
            if f2 in assigned:
                continue
            dist = hash_distance(hashes[f1], hashes[f2])
            if dist < threshold:
                cluster.append(f2)
                assigned.add(f2)
        clusters.append(cluster)

    dup_clusters = [c for c in clusters if len(c) > 1]
    print(f"  Found {len(dup_clusters)} duplicate cluster(s) out of {len(clusters)} unique images")

    # For each cluster, select best (highest resolution, then largest file)
    to_delete = []
    for cluster in dup_clusters:
        cluster.sort(key=lambda f: (image_resolution(f), file_size(f)), reverse=True)
        keep = cluster[0]
        dups = cluster[1:]
        print(f"  KEEP: {keep.name} ({image_resolution(keep):,}px)")
        for d in dups:
            print(f"  DROP: {d.name} ({image_resolution(d):,}px)")
            to_delete.append(d)

    return to_delete

# ─── Main Pipeline ────────────────────────────────────────────────────────────
def process_invitations():
    print("\n" + "="*60)
    print("STEP 1: PROCESSING INVITATION PHOTOS")
    print("="*60)

    inv_files = sorted([f for f in INV_DIR.iterdir()
                        if f.suffix.lower() in {".jpg", ".jpeg", ".png"}])

    print(f"Found {len(inv_files)} invitation photos")

    for i, src in enumerate(inv_files, 1):
        print(f"\n[{i}/{len(inv_files)}] Processing: {src.name}")

        # Backup original
        backup = BACKUP_DIR / f"inv_orig_{src.name}"
        if not backup.exists():
            shutil.copy(src, backup)

        # Step A: Perspective correction → temp file
        tmp_perspective = OUT_INV_DIR / f"_tmp_persp_{src.stem}.jpg"
        corrected = correct_perspective(src, tmp_perspective)

        # Step B: Background removal
        tmp_rembg = OUT_INV_DIR / f"_tmp_rembg_{src.stem}.png"
        perspective_src = tmp_perspective if corrected and tmp_perspective.exists() else src

        if REMBG_AVAILABLE:
            try:
                remove_background_rembg(perspective_src, tmp_rembg)
                bg_removed_src = tmp_rembg
            except Exception as e:
                print(f"  rembg error: {e}, falling back to OpenCV")
                remove_background_opencv(perspective_src, tmp_rembg)
                bg_removed_src = tmp_rembg
        else:
            remove_background_opencv(perspective_src, tmp_rembg)
            bg_removed_src = tmp_rembg

        # Step C: Enhance + save final as high-quality JPEG (white bg for transparency)
        final_out = OUT_INV_DIR / f"invitation_{i:02d}_restored.jpg"

        # Flatten PNG transparency to white background before enhancing
        if bg_removed_src.suffix == ".png":
            png_img = Image.open(bg_removed_src).convert("RGBA")
            white_bg = Image.new("RGBA", png_img.size, (255, 255, 255, 255))
            white_bg.paste(png_img, mask=png_img.split()[3])
            flat = white_bg.convert("RGB")
            flat_tmp = OUT_INV_DIR / f"_tmp_flat_{src.stem}.jpg"
            flat.save(flat_tmp, "JPEG", quality=98)
            enhance_image(flat_tmp, final_out, is_invitation=True)
            flat_tmp.unlink(missing_ok=True)
        else:
            enhance_image(bg_removed_src, final_out, is_invitation=True)

        # Cleanup temp files
        if tmp_perspective.exists():
            tmp_perspective.unlink()
        if tmp_rembg.exists():
            tmp_rembg.unlink()

        print(f"  ✅ Saved: {final_out.name}")

    print(f"\n✅ All {len(inv_files)} invitations processed → {OUT_INV_DIR}")


def process_temple_gallery():
    print("\n" + "="*60)
    print("STEP 2: PROCESSING TEMPLE GALLERY (DUPLICATE REMOVAL)")
    print("="*60)

    temple_files = sorted([f for f in TEMPLE_DIR.iterdir()
                           if f.suffix.lower() in {".jpg", ".jpeg", ".png"}])
    print(f"Found {len(temple_files)} temple photos")

    # Backup originals
    for f in temple_files:
        backup = BACKUP_DIR / f"temple_orig_{f.name}"
        if not backup.exists():
            shutil.copy(f, backup)

    # Duplicate detection
    to_delete = find_duplicates(TEMPLE_DIR, threshold=6.0)

    if to_delete:
        print(f"\n🗑️  Removing {len(to_delete)} duplicate temple photos...")
        for f in to_delete:
            f.unlink()
            print(f"  Deleted: {f.name}")
    else:
        print("  ✅ No duplicates found in temple gallery")

    # Enhance remaining photos
    remaining = sorted([f for f in TEMPLE_DIR.iterdir()
                        if f.suffix.lower() in {".jpg", ".jpeg", ".png"}])
    print(f"\nEnhancing {len(remaining)} unique temple photos...")

    for i, f in enumerate(remaining, 1):
        tmp = TEMPLE_DIR / f"_tmp_enh_{f.name}"
        enhance_image(f, tmp, is_invitation=False)
        shutil.move(tmp, f)
        print(f"  [{i}/{len(remaining)}] Enhanced: {f.name}")

    print(f"\n✅ Temple gallery done: {len(remaining)} unique enhanced photos")


def deduplicate_invitations_restored():
    print("\n" + "="*60)
    print("STEP 3: DEDUPLICATING RESTORED INVITATIONS")
    print("="*60)

    to_delete = find_duplicates(OUT_INV_DIR, threshold=5.0)
    if to_delete:
        print(f"\n🗑️  Removing {len(to_delete)} duplicate restored invitations...")
        for f in to_delete:
            f.unlink()
            print(f"  Deleted: {f.name}")
    else:
        print("  ✅ No duplicates in restored invitations")


def replace_originals_with_restored():
    """Replace original invitation files with restored versions."""
    print("\n" + "="*60)
    print("STEP 4: REPLACING ORIGINALS WITH RESTORED VERSIONS")
    print("="*60)

    # Clear original invitations folder
    for f in INV_DIR.iterdir():
        if f.suffix.lower() in {".jpg", ".jpeg", ".png"}:
            f.unlink()

    # Move restored files back to original location with clean names
    restored = sorted(OUT_INV_DIR.iterdir())
    for i, f in enumerate(restored, 1):
        if f.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue
        new_name = INV_DIR / f"invitation_{i:02d}.jpg"
        shutil.copy(f, new_name)
        print(f"  ✅ {f.name} → invitation_{i:02d}.jpg")

    print(f"\n✅ {i} restored invitations saved to {INV_DIR}")

    # Cleanup temp restored folder
    shutil.rmtree(OUT_INV_DIR, ignore_errors=True)


def print_summary():
    print("\n" + "="*60)
    print("FINAL SUMMARY")
    print("="*60)
    inv_count = len(list(INV_DIR.glob("*.jpg")))
    temple_count = len(list(TEMPLE_DIR.glob("*.jpg")))
    backup_count = len(list(BACKUP_DIR.iterdir()))
    print(f"  Invitations (restored, deduplicated): {inv_count}")
    print(f"  Temple gallery (deduplicated, enhanced): {temple_count}")
    print(f"  Original backups saved to: {BACKUP_DIR} ({backup_count} files)")
    print("="*60)


if __name__ == "__main__":
    print("🚀 Starting Full Invitation Restoration Pipeline")
    print(f"   Project: {PROJECT_ROOT}")
    print(f"   rembg: {'Available' if REMBG_AVAILABLE else 'Not available (OpenCV fallback)'}")

    try:
        process_invitations()
        process_temple_gallery()
        deduplicate_invitations_restored()
        replace_originals_with_restored()
        print_summary()
        print("\n🎉 Pipeline complete!")
    except Exception as e:
        import traceback
        print(f"\n❌ Error: {e}")
        traceback.print_exc()
        sys.exit(1)

