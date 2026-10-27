#!/usr/bin/env python3
"""LT125: reproduce the 80 exact sprites in the uploaded LT116 pack.

Official form-identity PokeAPI sprites pinned to immutable upstream commit;
the 80 Git blob IDs below were independently calculated from the user ZIP.
Never silently replace a normal, shiny, regional or event variant.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse
import hashlib
from pathlib import Path
import urllib.request
import struct

SOURCE_COMMIT = "d8c2fb78563e28ad7b3abe938cf6e79998d04e90"
SOURCE = ("https://raw.githubusercontent.com/PokeAPI/sprites/"
          + SOURCE_COMMIT + "/sprites/pokemon/")
# dex-slug, exact PokeAPI variety ID, normal blob SHA1, shiny blob SHA1
VERIFIED = """27-alola 10101 e46c0ed4356b44788eec7b6d648487e816d4636a 72eabe28f0c531a22f7eb9dd0907eeffab164ede
28-alola 10102 4e736fe6b7216c71cc67588210ae27bbab8caf44 069fdda56d3dabb018afe7d5ea6d1572f3f67375
37-alola 10103 3cca452ea83c4f28c8944f1becc5f45bce875166 888d8b6a3bfd8c92c91305a1528593986edfadfc
38-alola 10104 c3b23088a199e39e6853949974c19ac8ba6bc8b8 1ef95d35c054d1f0af13784ce23851757b0aa6c9
50-alola 10105 14c2fdcded3ee9cc2d9acc789b15c6bc112c123c f00a0ae631687f65c4de0a52d8dd13d95d503770
51-alola 10106 0245aa6cc1d840a5d1f668b3c087025ef253b3b0 b4c977c7815a01a485a31cd5d673197d4fcb0a19
52-alola 10107 e6ac8bc8a919d2b15e001053e84748d2d4b886dd a29c400eaa9564508f6ae91a71a32fe29ae01426
52-galar 10161 620d2658dbe5358e3bc32b2700ce6db30af7e0e9 5a8d2ad1fd3105b4c0f266646a7c5683f28e159f
53-alola 10108 b5e5acd31be70f04790a357374166cd0ec0e3a0d 371f573d832756dd437b83b7e2dc9ea98138a3b1
58-hisui 10229 e11d78136e46149aaf2f52c9beee2642e0d7e068 fe8df884e7ad7f9daed77744c74634f403c28e32
59-hisui 10230 1f705681ab5081360dc1895aeaffde1541703e96 182a0f969c2be2b7160d74ae6c6ad1d6febf7240
77-galar 10162 62bc995a33cf7f32dc1d9dd7af170dda422a36e0 ae808e4cc221a35f5e86b89175bc846589c4ab59
78-galar 10163 bbbe3e45838e7e0aaae4252804206d0c2dac2d85 b3293e1446d18ae14058235ac6d11f0fd136547e
79-galar 10164 85e5175111b2f75516bca679494b6482c6dce1ae 14bc8a883b822e74f8ee98097e9d8a0ca3fef1d3
80-galar 10165 f8e81eaf5b98a5d15d668e44859b389d965d1d75 0a3360160e29bb58ecc5dac256bebe0447a35cf3
83-galar 10166 8e18523e58118e8d111e6e99f433793f74f17cc3 674f6f0cc0572c3aaa92d4ae8dd322e53b869ebd
100-hisui 10231 06e2444f700b7bb75b526af6cb5bacb732e67586 4872f80db1b8cf342fc0bd6e55f3fd0432d052c2
101-hisui 10232 b1a74ad6d179bd2fe8723842ef1954ecc168b087 fa407b145cdc3192ff5ff58286e67b4532d57ac7
103-alola 10114 d958210bc6226b846ee762f408bc1a5c7c5a362e 69e1ac9302b997dfdb05e95c606d38d54ed45e3c
105-alola 10115 72f84f3da6dc5999876aff9c5f073f4e4e262f7a c9eda91aed9db60f973618ec7d6cd4481a20c921
110-galar 10167 d6c81e690de4d937632655c4e22ead2b6555c8e6 f3a6e41530ea6e0768c9611f2d48e8d5cac431dc
122-galar 10168 c6f672698ee609216c4b3e3a49cb7de7fef5cea2 62db5f01118bbc780af410cef7b56eb6f27f884a
144-galar 10169 a0b85b9236228421c7a8c1f56f592607f9539ece 364d3add9c4456aac2c45bf23c9c5eba3eaa9128
145-galar 10170 2b8ab51b70311a4128e7b779dedc40c478324f65 24ff5ecc3e9e96f1c7aa642317fb81adefe73802
146-galar 10171 d6ab18de26646104c41cb603e471d74069995511 1a24b67774ddab680dc8273163097c7d074f061a
199-galar 10172 ed0d0861361fe8a947487e964dbe078966192ff0 1fc703deb4eadc5d0747133cdc2d67ea4164d6ec
211-hisui 10234 151b2f25bd0f391817bbe40276b4a0ee32de7bd7 f525dceebf2cbf6586a6a80e7a69261be0036099
215-hisui 10235 0b9091e758d27450ec991ed40ff05a6d1caa63d4 c580436e6a0e65574c17e0d5a27ec3168bf17538
222-galar 10173 a2fa5b5bfec813cb25ceee57a1c85bf04a792d49 4c2ead4360f6329db29e81c6ac09e12379ebe712
263-galar 10174 1880d31349abe7d3357dff97721b41979d89dbc9 a8fb5c58e4bcd6f1a964069a1c7618d7d3e202f7
264-galar 10175 0cb6246f744b75d21ab52d9ea4cdd891e5956a03 0e8d71b74e6505bd0151e6435882ebb221a7914d
554-galar 10176 f910739615dc68a565442a3d1362cccebbd55d52 4f394161e8851c1e7c7ac86113ee2d5170dbe292
555-galar 10177 ef83d665d5955411da5417791627cc5e268581a9 b0d33ef605e60d56263b5e087284003945d5d194
555-galar-zen 10178 fd37970a40cf0a794ddee73c37ebea4fbcea043c c6a4de9accc1f49035885946cc9acdc8fdb80ce1
562-galar 10179 4fe8423c6dc09c1e81aa362c02e1beecff5e71e3 9c0c0d1ab7978be7cfb8d248161a0817d578fbd6
618-galar 10180 1817808a5f61595bfe827c8c7c693a172f3e6797 6802aba6c5023ffa86607c69fc5090e5d43abd0c
570-hisui 10238 24a1ed93198de6fccb4b04403f14ab069692d5b0 d94295a38006894233c1ed16d5df3abad521acb0
571-hisui 10239 5b56574b9c3417f0d8b11bd1503513e1f2cc5622 eb6eaf757ccc7c3cd41001465a91f32b382f8925
585-spring 585 1b0bec6e22ecd35cf32db8ae4be91626848ba1d3 d36730cd293f93a301e2add0bf01e0de76def872
586-spring 586 8e9511b15431563cc4559443c418ac7524fa2f9e 6b179901c5c70c5fbda18ccabea89f1b287a4054""".strip().splitlines()

def _validate_png(data, git_sha):
    if not 33 <= len(data) <= 256 * 1024 or data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        return False
    width, height = struct.unpack(">II", data[16:24])
    if not (8 <= width <= 1024 and 8 <= height <= 1024):
        return False
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\x00" + data).hexdigest() == git_sha

def fetch_verified_forms(dest):
    """Return per-file SHA256 manifest; abort on missing/incorrect art."""
    rows = [line.split() for line in VERIFIED]
    assert len(rows) == 40 and len({r[0] for r in rows}) == 40
    jobs = []
    for slug, variety, normal_sha, shiny_sha in rows:
        for shiny, digest in ((False, normal_sha), (True, shiny_sha)):
            name = slug + ("-shiny" if shiny else "") + ".png"
            jobs.append((name, variety, shiny, digest))
    forms = Path(dest) / "forms"
    forms.mkdir(parents=True, exist_ok=True)

    def load(item):
        name, variety, shiny, digest = item
        path = forms / name
        if path.exists():
            data = path.read_bytes()
            if _validate_png(data, digest):
                return name, hashlib.sha256(data).hexdigest()
        url = SOURCE + ("shiny/" if shiny else "") + variety + ".png"
        req = urllib.request.Request(url, headers={"User-Agent": "PokeSearch-LT125-form-pack/1"})
        with urllib.request.urlopen(req, timeout=30) as response:
            if response.status != 200:
                raise RuntimeError("Cannot fetch exact source: " + name)
            data = response.read(256 * 1024 + 1)
        if not _validate_png(data, digest):
            raise ValueError("Not identical to the user LT116 ZIP: " + name)
        path.write_bytes(data)
        return name, hashlib.sha256(data).hexdigest()

    manifest = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(load, job) for job in jobs]
        for job in as_completed(futures):
            name, sha = job.result()
            manifest["forms/" + name] = sha
    if len(manifest) != 80:
        raise AssertionError("Incomplete 80-PNG source pack")
    return dict(sorted(manifest.items()))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dest", default="app/src/main/assets/pokemon-sprites")
    args = parser.parse_args()
    report = fetch_verified_forms(Path(args.dest))
    print("LT116 exact-source forms:", len(report), "PNG verified, pinned commit", SOURCE_COMMIT)

if __name__ == "__main__":
    main()
