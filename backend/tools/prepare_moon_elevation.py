
from pathlib import Path

import numpy as np
import tifffile


# =====================================================
# CONFIGURATION
# =====================================================

BASE = Path(__file__).resolve().parents[1]

INPUT = BASE / "data" / "moon" / "ldem_16_uint.tif"

OUTPUT = (
    BASE.parent
    / "frontend"
    / "public"
    / "textures"
    / "ldem_2048x1024_uint16.bin"
)

WIDTH = 2048
HEIGHT = 1024

ELEVATION_OFFSET = 20000
ELEVATION_SCALE = 0.5

POLAR_ANALYSIS_ROWS = 12


# =====================================================
# READ TIFF
# =====================================================

def read_tiff():

    if not INPUT.exists():
        raise FileNotFoundError(INPUT)

    print("Reading TIFF...")

    with tifffile.TiffFile(INPUT) as tif:

        page = tif.pages[0]
        data = page.asarray()

        print("\nOriginal TIFF information")
        print("-------------------------")
        print("Shape:", data.shape)
        print("Dtype:", data.dtype)
        print("Min:", data.min())
        print("Max:", data.max())

        print("\nIMPORTANT TIFF METADATA")
        print("-----------------------")

        for name in [
            "ModelPixelScaleTag",
            "ModelTiepointTag",
            "ModelTransformationTag",
            "GDAL_NODATA",
            "ImageDescription"
        ]:

            tag = page.tags.get(name)

            if tag:
                print(f"{name}: {tag.value}")
            else:
                print(f"{name}: Not found")

    if data.ndim != 2:
        raise ValueError(
            f"Expected 2D image, got {data.shape}"
        )

    if data.dtype != np.uint16:
        raise ValueError(
            f"Expected uint16, got {data.dtype}"
        )

    return data


# =====================================================
# BILINEAR RESIZE - NUMPY ONLY
# =====================================================

def resize_elevation(data):

    print("\nResizing elevation map...")
    print("Method: NumPy Bilinear Interpolation")

    source_height, source_width = data.shape

    ys = np.linspace(
        0,
        source_height - 1,
        HEIGHT,
        dtype=np.float64
    )

    xs = np.linspace(
        0,
        source_width - 1,
        WIDTH,
        dtype=np.float64
    )

    x0 = np.floor(xs).astype(np.int32)
    x1 = np.minimum(
        x0 + 1,
        source_width - 1
    )

    fx = (xs - x0).astype(np.float32)

    resized = np.empty(
        (HEIGHT, WIDTH),
        dtype=np.uint16
    )

    for row in range(HEIGHT):

        y = ys[row]

        y0 = int(np.floor(y))
        y1 = min(
            y0 + 1,
            source_height - 1
        )

        fy = np.float32(y - y0)

        a = data[y0, x0].astype(np.float32)
        b = data[y0, x1].astype(np.float32)

        c = data[y1, x0].astype(np.float32)
        d = data[y1, x1].astype(np.float32)

        top = a + (b - a) * fx
        bottom = c + (d - c) * fx

        values = top + (bottom - top) * fy

        resized[row] = np.clip(
            np.rint(values),
            0,
            65535
        ).astype(np.uint16)

        if row % 256 == 0:
            print(f"Processing: {row}/{HEIGHT}")

    return np.ascontiguousarray(resized)


# =====================================================
# ELEVATION STATISTICS
# =====================================================

def print_statistics(data):

    print("\nElevation statistics")
    print("--------------------")

    raw_min = int(data.min())
    raw_max = int(data.max())

    print("Shape:", data.shape)
    print("Min raw:", raw_min)
    print("Max raw:", raw_max)

    print(
        "Minimum elevation:",
        (raw_min - ELEVATION_OFFSET) * ELEVATION_SCALE,
        "meters"
    )

    print(
        "Maximum elevation:",
        (raw_max - ELEVATION_OFFSET) * ELEVATION_SCALE,
        "meters"
    )

    print(
        "North pole average raw:",
        float(data[0].mean())
    )

    print(
        "South pole average raw:",
        float(data[-1].mean())
    )


# =====================================================
# POLAR ROW ANALYSIS
# =====================================================

def print_polar_analysis(data):

    print("\nPOLAR ROW ANALYSIS")
    print("==================")

    print("\nNORTH POLE")
    print("----------")

    for i in range(POLAR_ANALYSIS_ROWS):

        row = data[i]

        print(
            f"North row {i:02d}: "
            f"min={row.min()}, "
            f"max={row.max()}, "
            f"mean={row.mean():.2f}, "
            f"std={row.std():.2f}"
        )

    print("\nSOUTH POLE")
    print("----------")

    for i in range(POLAR_ANALYSIS_ROWS):

        row_index = HEIGHT - POLAR_ANALYSIS_ROWS + i

        row = data[row_index]

        print(
            f"South row {row_index:04d}: "
            f"min={row.min()}, "
            f"max={row.max()}, "
            f"mean={row.mean():.2f}, "
            f"std={row.std():.2f}"
        )


# =====================================================
# SAVE BINARY
# =====================================================

def save_binary(data):

    print("\nSaving BIN file...")

    OUTPUT.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    output_data = data.astype(
        "<u2",
        copy=False
    )

    output_data.tofile(OUTPUT)

    expected_size = WIDTH * HEIGHT * 2

    actual_size = OUTPUT.stat().st_size

    if actual_size != expected_size:

        raise RuntimeError(
            f"Invalid file size: {actual_size}, "
            f"expected: {expected_size}"
        )

    print("\nConversion completed successfully")
    print("-----------------------------------")

    print("Output:", OUTPUT)
    print("Dimensions:", WIDTH, "x", HEIGHT)
    print("Format: uint16 little-endian")
    print("Bytes:", actual_size)

    print(
        "Size MB:",
        round(actual_size / 1024 / 1024, 2)
    )


# =====================================================
# MAIN
# =====================================================

def main():

    # 1. Read original TIFF
    data = read_tiff()

    # 2. Resize elevation data
    resized = resize_elevation(data)

    # 3. Print elevation statistics
    print_statistics(resized)

    # 4. Analyze polar regions
    print_polar_analysis(resized)

    # 5. Save BIN
    save_binary(resized)


if __name__ == "__main__":
    main()
