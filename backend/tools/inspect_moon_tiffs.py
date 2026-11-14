from pathlib import Path
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "data" / "png"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

files = [
    f for f in (BASE_DIR / "data").rglob("*")
    if f.is_file() and f.suffix.lower() in (".tif", ".tiff")
    and OUTPUT_DIR not in f.parents
]

print(f"Found {len(files)} TIFF files")

for input_file in files:
    output_file = OUTPUT_DIR / f"{input_file.stem}.png"

    print(f"\nProcessing: {input_file}")

    try:
        with Image.open(input_file) as img:
            print("Size:", img.size)
            print("Mode:", img.mode)

            img.save(output_file, "PNG")

            print("Saved:", output_file)

    except Exception as e:
        print("ERROR:", e)

print("\nFinished!")
