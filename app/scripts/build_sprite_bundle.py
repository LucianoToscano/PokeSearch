#!/usr/bin/env python3
"""Package VERIFIED PokeAPI normal/shiny base sprites into the LT105 APK.

Downloads happen in the CI builder, NEVER on app startup. Each URL refers to
one exact dex ID and variant. Unknown costumes/forms stay unbundled; the app
must not silently substitute another sprite. All data is public PokeAPI/sprites.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import struct
import time
import urllib.error
import urllib.request

RAW = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"
MIRROR = "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/"
MIN_DIMENSION, MAX_DIMENSION, MAX_BYTES = 8, 1024, 256 * 1024
# PokeMiners is a third-party archive of copyrighted Pokémon GO artwork.
# Every costume asset is pinned to a fixed upstream commit and its exact Git blob.
# Unknown forms/variants must NOT be inferred from normal species sprites.
COSTUME_SOURCE_COMMIT = "c2a686eb08ace6e890d8fe3d2134c76988db87b5"
COSTUME_ROOT = ("https://raw.githubusercontent.com/PokeMiners/pogo_assets/"
                + COSTUME_SOURCE_COMMIT
                + "/Images/Pokemon%20-%20256x256/Addressable%20Assets/")
COSTUME_FILES = {
    "costumes/3-copy-2019.png": (
        "pm3.fCOPY_2019.icon.png",
        "284009faddef9f1c56119929da3034e29d287840"
    ),
    "costumes/3-copy-2019-female.png": (
        "pm3.fCOPY_2019.g2.icon.png",
        "a47c0c2534dc99cef70e472fc660aac3e35de8db"
    ),
    "costumes/6-copy-2019.png": (
        "pm6.fCOPY_2019.icon.png",
        "69ad8ed87a10db18f3c1f85b449ee6d88c30d0bf"
    ),
    "costumes/9-copy-2019.png": (
        "pm9.fCOPY_2019.icon.png",
        "b8218c6fab6aafc477f0a57aa4168961d668d638"
    ),
    "costumes/4-goggles-2026.png": (
        "pm4.fGOGGLES_2026.icon.png",
        "747f05715afdc29abeb94470d0dbab17fe16fa48"
    ),
    "costumes/4-goggles-2026-shiny.png": (
        "pm4.fGOGGLES_2026.s.icon.png",
        "6d2e2b385f927323cc1689f2aad394357d210628"
    ),
    "costumes/5-goggles-2026.png": (
        "pm5.fGOGGLES_2026.icon.png",
        "aba004495e1716211c19fc9b039ea496d9b52ffa"
    ),
    "costumes/5-goggles-2026-shiny.png": (
        "pm5.fGOGGLES_2026.s.icon.png",
        "636adf5e6e2030527a4d25b52f2ae891dfac197a"
    ),
    "costumes/6-goggles-2026.png": (
        "pm6.fGOGGLES_2026.icon.png",
        "12bcd601236b2d74ffb10b09824f64b8c30e73d2"
    ),
    "costumes/6-goggles-2026-shiny.png": (
        "pm6.fGOGGLES_2026.s.icon.png",
        "4ff140a084be11ab5bab803713eb59e754823083"
    ),
    # Halloween Mischief 2021 official GO costumes; immutable upstream blobs.
    "costumes/25-halloween-2021.png": (
        "pm25.cHALLOWEEN_2021_NOEVOLVE.icon.png",
        "5e4e96b15cfe4f0f53b051e2559562befb0e67c2"
    ),
    "costumes/25-halloween-2021-shiny.png": (
        "pm25.cHALLOWEEN_2021_NOEVOLVE.s.icon.png",
        "b23ab862eee002873d49b4e2e83576064962d553"
    ),
    "costumes/393-halloween-2021.png": (
        "pm393.cHALLOWEEN_2021_NOEVOLVE.icon.png",
        "8b32f8f2b1fc8a9cc664ad3775664a7b6adaa434"
    ),
    "costumes/393-halloween-2021-shiny.png": (
        "pm393.cHALLOWEEN_2021_NOEVOLVE.s.icon.png",
        "421f925fd8a0797529a09d6042e46c700d26540c"
    ),
    "costumes/426-halloween-2021.png": (
        "pm426.cHALLOWEEN_2021_NOEVOLVE.icon.png",
        "24f1d017f85fe429c8ead5b0fc64485f034a47f7"
    ),
    "costumes/426-halloween-2021-shiny.png": (
        "pm426.cHALLOWEEN_2021_NOEVOLVE.s.icon.png",
        "ac5464c1b4c038569b69b860f9703191de85d872"
    )
}

# Verified extra Halloween / fall costumes, including normal/shiny, female and
# size-specific sprites. Each PNG must match its immutable Git blob SHA-1.
COSTUME_FILES.update({
    "costumes/pm131.fCOSTUME_2020.icon.png": ("pm131.fCOSTUME_2020.icon.png", "5a31f44c62b38f8b248e656a7b243ee0fef0a061"),
    "costumes/pm131.fCOSTUME_2020.s.icon.png": ("pm131.fCOSTUME_2020.s.icon.png", "d4a06211d31c5e32652706cca816ccd6c010f946"),
    "costumes/pm172.cHALLOWEEN_2017.icon.png": ("pm172.cHALLOWEEN_2017.icon.png", "1ef1af062e4fb67116e642dc69251a8e16e357c9"),
    "costumes/pm172.cHALLOWEEN_2017.s.icon.png": ("pm172.cHALLOWEEN_2017.s.icon.png", "0e86d83af22d7e49f2f4a0a1e9a484c371fdb111"),
    "costumes/pm216.cHALLOWEEN_2025.icon.png": ("pm216.cHALLOWEEN_2025.icon.png", "1fb58be21efc25d19042c1c1af776aa3714310e4"),
    "costumes/pm216.cHALLOWEEN_2025.s.icon.png": ("pm216.cHALLOWEEN_2025.s.icon.png", "cf374b7ec6a3553c29ecaf5ccdb334bbc36ae5d4"),
    "costumes/pm217.cHALLOWEEN_2025.g2.icon.png": ("pm217.cHALLOWEEN_2025.g2.icon.png", "1135ae9e2a52ac9ea82295a4f7072bbfa9b40a29"),
    "costumes/pm217.cHALLOWEEN_2025.g2.s.icon.png": ("pm217.cHALLOWEEN_2025.g2.s.icon.png", "a95598934fccd76c90878bcee10b9fa87eab6733"),
    "costumes/pm217.cHALLOWEEN_2025.icon.png": ("pm217.cHALLOWEEN_2025.icon.png", "23b9025c320babb4a4b354a863a3283f5d7df5ad"),
    "costumes/pm217.cHALLOWEEN_2025.s.icon.png": ("pm217.cHALLOWEEN_2025.s.icon.png", "5656bc4c35040e1c4f26e2508e5cd843e6c14e25"),
    "costumes/pm25.cHALLOWEEN_2017.g2.icon.png": ("pm25.cHALLOWEEN_2017.g2.icon.png", "75a368d70dd037aad1f39da376ed76620df7352e"),
    "costumes/pm25.cHALLOWEEN_2017.g2.s.icon.png": ("pm25.cHALLOWEEN_2017.g2.s.icon.png", "77002db06d4afd3d7ca1702881e8e8d729ddc3a0"),
    "costumes/pm25.cHALLOWEEN_2017.icon.png": ("pm25.cHALLOWEEN_2017.icon.png", "f22b0b65aed29758c449b8e6511ff859c819f9cc"),
    "costumes/pm25.cHALLOWEEN_2017.s.icon.png": ("pm25.cHALLOWEEN_2017.s.icon.png", "820c0f7c1c1729e0b90878223e96aef753c7c13a"),
    "costumes/pm25.cHALLOWEEN_2021_NOEVOLVE.g2.icon.png": ("pm25.cHALLOWEEN_2021_NOEVOLVE.g2.icon.png", "224086abba088cce786cd428c38d60206465b15d"),
    "costumes/pm25.cHALLOWEEN_2021_NOEVOLVE.g2.s.icon.png": ("pm25.cHALLOWEEN_2021_NOEVOLVE.g2.s.icon.png", "d736080149fe218ce6077de2d0576af02c4eef91"),
    "costumes/pm25.cHALLOWEEN_2021_NOEVOLVE.icon.png": ("pm25.cHALLOWEEN_2021_NOEVOLVE.icon.png", "5e4e96b15cfe4f0f53b051e2559562befb0e67c2"),
    "costumes/pm25.cHALLOWEEN_2021_NOEVOLVE.s.icon.png": ("pm25.cHALLOWEEN_2021_NOEVOLVE.s.icon.png", "b23ab862eee002873d49b4e2e83576064962d553"),
    "costumes/pm25.fCOSTUME_2020.g2.icon.png": ("pm25.fCOSTUME_2020.g2.icon.png", "7983ae271a85b46d41373dca52226a587f7951e4"),
    "costumes/pm25.fCOSTUME_2020.g2.s.icon.png": ("pm25.fCOSTUME_2020.g2.s.icon.png", "82777be5dea2ba7ad2fc40d29bd65f40bee96255"),
    "costumes/pm25.fCOSTUME_2020.icon.png": ("pm25.fCOSTUME_2020.icon.png", "04e897279de6f4c5a9400933e2df241770330a7a"),
    "costumes/pm25.fCOSTUME_2020.s.icon.png": ("pm25.fCOSTUME_2020.s.icon.png", "c0bb892e1cdbd0b6e2001b7fb47fd9ce8c8de953"),
    "costumes/pm25.fHALLOWEEN_2026.g2.icon.png": ("pm25.fHALLOWEEN_2026.g2.icon.png", "81de00a92d60481468941d04ec7516a12dee1486"),
    "costumes/pm25.fHALLOWEEN_2026.g2.s.icon.png": ("pm25.fHALLOWEEN_2026.g2.s.icon.png", "cc09741021149dc398a754acf30a4602a6522107"),
    "costumes/pm25.fHALLOWEEN_2026.icon.png": ("pm25.fHALLOWEEN_2026.icon.png", "50f5fd939858de9f378c84fb5397d70f34be7cd4"),
    "costumes/pm25.fHALLOWEEN_2026.s.icon.png": ("pm25.fHALLOWEEN_2026.s.icon.png", "058826dd8eb23cc73bc0c62849afaba4be13ee0a"),
    "costumes/pm26.cHALLOWEEN_2017.g2.icon.png": ("pm26.cHALLOWEEN_2017.g2.icon.png", "1135ce8656510dc3e829f112c2813310a069d6f6"),
    "costumes/pm26.cHALLOWEEN_2017.g2.s.icon.png": ("pm26.cHALLOWEEN_2017.g2.s.icon.png", "529e5a535650ab941eb4be32e42150e0793cab32"),
    "costumes/pm26.cHALLOWEEN_2017.icon.png": ("pm26.cHALLOWEEN_2017.icon.png", "c455f4bbe73acdc8f4829c4129935b6af4f6f3ee"),
    "costumes/pm26.cHALLOWEEN_2017.s.icon.png": ("pm26.cHALLOWEEN_2017.s.icon.png", "0c88d5a2895ad1e5b4ca961689685414252db585"),
    "costumes/pm302.fCOSTUME_2020.icon.png": ("pm302.fCOSTUME_2020.icon.png", "07fd542c209b04fe266ebd81831aaee6f298100d"),
    "costumes/pm302.fCOSTUME_2020.s.icon.png": ("pm302.fCOSTUME_2020.s.icon.png", "488aa3034cbe55523bd51a88402d5c55df234153"),
    "costumes/pm355.cFALL_2022_NOEVOLVE.icon.png": ("pm355.cFALL_2022_NOEVOLVE.icon.png", "22b4d6656db5690f2c86c326dec0e48b87ecaa20"),
    "costumes/pm355.cFALL_2022_NOEVOLVE.s.icon.png": ("pm355.cFALL_2022_NOEVOLVE.s.icon.png", "ea57d856adf6ddb3877b1d6c6fe21d249ae67fa6"),
    "costumes/pm356.cFALL_2022_NOEVOLVE.icon.png": ("pm356.cFALL_2022_NOEVOLVE.icon.png", "638a270361efa6d609b02356d39909646ee2a468"),
    "costumes/pm356.cFALL_2022_NOEVOLVE.s.icon.png": ("pm356.cFALL_2022_NOEVOLVE.s.icon.png", "ce28884be8ae95b8ec4a04441049c339d7351790"),
    "costumes/pm359.cFALL_2022_NOEVOLVE.icon.png": ("pm359.cFALL_2022_NOEVOLVE.icon.png", "0105ec5f5f8821969b7837d67a16219a17c545dd"),
    "costumes/pm359.cFALL_2022_NOEVOLVE.s.icon.png": ("pm359.cFALL_2022_NOEVOLVE.s.icon.png", "2c3f80311c51b015019c4f2dfd943c9544f37417"),
    "costumes/pm37.cFALL_2022.icon.png": ("pm37.cFALL_2022.icon.png", "500de38d2600b77bf2f4d5776b7e064c1e791f41"),
    "costumes/pm37.cFALL_2022.s.icon.png": ("pm37.cFALL_2022.s.icon.png", "51d1768e53bc584064747f8ec522f832a5cdad4d"),
    "costumes/pm38.cFALL_2022.icon.png": ("pm38.cFALL_2022.icon.png", "876e2ea1c48d763177a5859fe51f2ccada11395b"),
    "costumes/pm38.cFALL_2022.s.icon.png": ("pm38.cFALL_2022.s.icon.png", "3a043b63b30ed3defba8dc838e2ff8666fadaa44"),
    "costumes/pm393.cHALLOWEEN_2021_NOEVOLVE.icon.png": ("pm393.cHALLOWEEN_2021_NOEVOLVE.icon.png", "8b32f8f2b1fc8a9cc664ad3775664a7b6adaa434"),
    "costumes/pm393.cHALLOWEEN_2021_NOEVOLVE.s.icon.png": ("pm393.cHALLOWEEN_2021_NOEVOLVE.s.icon.png", "421f925fd8a0797529a09d6042e46c700d26540c"),
    "costumes/pm426.cHALLOWEEN_2021_NOEVOLVE.icon.png": ("pm426.cHALLOWEEN_2021_NOEVOLVE.icon.png", "24f1d017f85fe429c8ead5b0fc64485f034a47f7"),
    "costumes/pm426.cHALLOWEEN_2021_NOEVOLVE.s.icon.png": ("pm426.cHALLOWEEN_2021_NOEVOLVE.s.icon.png", "ac5464c1b4c038569b69b860f9703191de85d872"),
    "costumes/pm477.cFALL_2022_NOEVOLVE.icon.png": ("pm477.cFALL_2022_NOEVOLVE.icon.png", "abe02987bda5f02d492f7cc10c0a81a03115128c"),
    "costumes/pm477.cFALL_2022_NOEVOLVE.s.icon.png": ("pm477.cFALL_2022_NOEVOLVE.s.icon.png", "fa93ecb273183cffc433b485d20bcfc097f30f64"),
    "costumes/pm50.cFALL_2022.icon.png": ("pm50.cFALL_2022.icon.png", "19aa5a0511f8a75325c348a46723b0aa05ed75c5"),
    "costumes/pm50.cFALL_2022.s.icon.png": ("pm50.cFALL_2022.s.icon.png", "4652dc9eaf3011e7e54410ba10e8a67a9e544a60"),
    "costumes/pm51.cFALL_2022.icon.png": ("pm51.cFALL_2022.icon.png", "686aa20a83b4dc15d329364cd0ac4de769d770dd"),
    "costumes/pm51.cFALL_2022.s.icon.png": ("pm51.cFALL_2022.s.icon.png", "a55c4cb71bcca47f62a5e354437406c72b51ba17"),
    "costumes/pm710.fAVERAGE.cFALL_2022.icon.png": ("pm710.fAVERAGE.cFALL_2022.icon.png", "d4d73191902fdfbcec643fe61822dfd01c1fec7e"),
    "costumes/pm710.fAVERAGE.cFALL_2022.s.icon.png": ("pm710.fAVERAGE.cFALL_2022.s.icon.png", "70a38dccb355a9b7b149b5a617e05acc62845788"),
    "costumes/pm710.fLARGE.cFALL_2022.icon.png": ("pm710.fLARGE.cFALL_2022.icon.png", "162f8274b54b98de94a4f1c181d633199b8159d3"),
    "costumes/pm710.fLARGE.cFALL_2022.s.icon.png": ("pm710.fLARGE.cFALL_2022.s.icon.png", "919db809ab9b4963d4d16a71e0389c7728bbe0cd"),
    "costumes/pm710.fSMALL.cFALL_2022.icon.png": ("pm710.fSMALL.cFALL_2022.icon.png", "e89623c759d3cea57259bb97e01ac4e205aea78c"),
    "costumes/pm710.fSMALL.cFALL_2022.s.icon.png": ("pm710.fSMALL.cFALL_2022.s.icon.png", "75e679cdd15cf020d47c1aed8f76e46ea0990889"),
    "costumes/pm710.fSUPER.cFALL_2022.icon.png": ("pm710.fSUPER.cFALL_2022.icon.png", "7e990e48887ae25fa002bccd5ae0d9298a8b3020"),
    "costumes/pm710.fSUPER.cFALL_2022.s.icon.png": ("pm710.fSUPER.cFALL_2022.s.icon.png", "811f6a4ecd50e0fd80dbca1788e9ee12c23071ba"),
    "costumes/pm711.fAVERAGE.cFALL_2022.icon.png": ("pm711.fAVERAGE.cFALL_2022.icon.png", "d5605fbaa653faff4e1338f71206abb08eea9cf1"),
    "costumes/pm711.fAVERAGE.cFALL_2022.s.icon.png": ("pm711.fAVERAGE.cFALL_2022.s.icon.png", "e538fc006365c52e3468c922fe604db1824307d5"),
    "costumes/pm711.fLARGE.cFALL_2022.icon.png": ("pm711.fLARGE.cFALL_2022.icon.png", "a055d18365fe94fd23ac92168ac0277cef9b8fee"),
    "costumes/pm711.fLARGE.cFALL_2022.s.icon.png": ("pm711.fLARGE.cFALL_2022.s.icon.png", "2e9adfeb98b1014c44d1cf955a5c5687010a6de5"),
    "costumes/pm711.fSMALL.cFALL_2022.icon.png": ("pm711.fSMALL.cFALL_2022.icon.png", "84a06706c42c72e2f27dd9e14000e597c62dc146"),
    "costumes/pm711.fSMALL.cFALL_2022.s.icon.png": ("pm711.fSMALL.cFALL_2022.s.icon.png", "045e122a7d661105d6fe09971297983c8e71c6ed"),
    "costumes/pm711.fSUPER.cFALL_2022.icon.png": ("pm711.fSUPER.cFALL_2022.icon.png", "b5f726541b1c08b85ed785db2538d60fe3e2f4b0"),
    "costumes/pm711.fSUPER.cFALL_2022.s.icon.png": ("pm711.fSUPER.cFALL_2022.s.icon.png", "a9e1ce53c7a349d05460bd4b196eb4cadec38e82"),
    "costumes/pm714.cHALLOWEEN_2025.icon.png": ("pm714.cHALLOWEEN_2025.icon.png", "ec42778e5891c0025101d9c6383edf55cbc72d6c"),
    "costumes/pm714.cHALLOWEEN_2025.s.icon.png": ("pm714.cHALLOWEEN_2025.s.icon.png", "ffc417cc1fff5d4496b65c838bfac9b942482b9e"),
    "costumes/pm715.cHALLOWEEN_2025.icon.png": ("pm715.cHALLOWEEN_2025.icon.png", "543ef0279d1c71335f1bf0171ce25f8f03a8e76e"),
    "costumes/pm715.cHALLOWEEN_2025.s.icon.png": ("pm715.cHALLOWEEN_2025.s.icon.png", "6b86ce983b1c62859e52dbe70c854059da736d48"),
    "costumes/pm854.fA_HALLOWEEN_2026_01.icon.png": ("pm854.fA_HALLOWEEN_2026_01.icon.png", "2f56800f1803e50ef67255876b56d11b7305e677"),
    "costumes/pm854.fA_HALLOWEEN_2026_01.s.icon.png": ("pm854.fA_HALLOWEEN_2026_01.s.icon.png", "f783c13104c967a0d9d3ecb0b659980e21b22ea6"),
    "costumes/pm854.fP_HALLOWEEN_2026_01.icon.png": ("pm854.fP_HALLOWEEN_2026_01.icon.png", "6582dda0e6681b6b70004a558d3ccee351bf12dc"),
    "costumes/pm854.fP_HALLOWEEN_2026_01.s.icon.png": ("pm854.fP_HALLOWEEN_2026_01.s.icon.png", "26c89d08687725ec76cf4a8e3c4ba9b5127ffae2"),
    "costumes/pm855.fA_HALLOWEEN_2026_01.icon.png": ("pm855.fA_HALLOWEEN_2026_01.icon.png", "cc586909775175263220bf14b89e35c54b991d41"),
    "costumes/pm855.fA_HALLOWEEN_2026_01.s.icon.png": ("pm855.fA_HALLOWEEN_2026_01.s.icon.png", "185a68655b448c9effe0142adb8857d9bc8c834f"),
    "costumes/pm855.fP_HALLOWEEN_2026_01.icon.png": ("pm855.fP_HALLOWEEN_2026_01.icon.png", "07a147a4f5ab57f9b15285cf8bb149af7daeeeeb"),
    "costumes/pm855.fP_HALLOWEEN_2026_01.s.icon.png": ("pm855.fP_HALLOWEEN_2026_01.s.icon.png", "1b8c1064a5c0ea99eec31b9b07b220ae52fc952d"),
    "costumes/pm901.cHALLOWEEN_2025.icon.png": ("pm901.cHALLOWEEN_2025.icon.png", "ff9a0ab4a198d58f6adb65c75839b0153d362516"),
    "costumes/pm901.cHALLOWEEN_2025.s.icon.png": ("pm901.cHALLOWEEN_2025.s.icon.png", "950065518650ef1db58be679d311e0e96a8dfde6"),
    "costumes/pm94.cFALL_2022_NOEVOLVE.icon.png": ("pm94.cFALL_2022_NOEVOLVE.icon.png", "de08f642f1ded8c84f17d7bc327d6d34cddcb719"),
    "costumes/pm94.cFALL_2022_NOEVOLVE.s.icon.png": ("pm94.cFALL_2022_NOEVOLVE.s.icon.png", "d9d3a5c1dcbbef17ac206f7e03c33542737d0a99"),
    "costumes/pm94.fCOSTUME_2020.icon.png": ("pm94.fCOSTUME_2020.icon.png", "79d61a9bd9b4ee0ac4db095a1a1db42507c58652"),
    "costumes/pm94.fCOSTUME_2020.s.icon.png": ("pm94.fCOSTUME_2020.s.icon.png", "404b4259bae47346e6abab069eeb118229c7f807"),
})

# Verified Pokémon variety ID 10174 from PokéAPI. Pin the source commit:
# never use a mutable branch for regional-form identity or shiny color.
FORM_SOURCE_COMMIT = "d8c2fb78563e28ad7b3abe938cf6e79998d04e90"
FORM_SOURCE_ROOT = ("https://raw.githubusercontent.com/PokeAPI/sprites/"
                    + FORM_SOURCE_COMMIT + "/sprites/pokemon/")
FORM_FILES = {
    "forms/zigzagoon-galar.png": "10174.png",
    "forms/zigzagoon-galar-shiny.png": "shiny/10174.png",
}


def verified_png(data):
    """Validate exact PNG signature and plausible IHDR without Pillow."""
    if len(data) < 33 or len(data) > MAX_BYTES:
        return False
    if data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        return False
    width, height = struct.unpack(">II", data[16:24])
    return MIN_DIMENSION <= width <= MAX_DIMENSION and MIN_DIMENSION <= height <= MAX_DIMENSION


def fetch(path):
    for source in (RAW, MIRROR):
        url = source + path
        for attempt in range(2):
            try:
                request = urllib.request.Request(url, headers={"User-Agent": "PokeSearch-LT105-offline-sprite-builder/1"})
                with urllib.request.urlopen(request, timeout=12) as response:
                    if response.status != 200:
                        break
                    content_type = response.headers.get("Content-Type", "").lower()
                    if content_type and "image/png" not in content_type:
                        break
                    data = response.read(MAX_BYTES + 1)
                if verified_png(data):
                    return data
                break
            except urllib.error.HTTPError as exc:
                if exc.code in (404, 410):
                    # Never invent missing sprites / forms.
                    return None
                if exc.code in (401, 403, 429):
                    # Respect provider limits: never circumvent authorization/throttles.
                    return None
                if exc.code < 500:
                    break
            except (urllib.error.URLError, TimeoutError, OSError):
                pass
            if attempt == 0:
                time.sleep(0.6)
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", default="app/src/main/assets/pokemon_catalog.json")
    parser.add_argument("--dest", default="app/src/main/assets/pokemon-sprites")
    parser.add_argument("--workers", type=int, default=12)
    parser.add_argument("--minimum-normal", type=int, default=950)
    args = parser.parse_args()
    catalog = json.loads(Path(args.catalog).read_text(encoding="utf-8"))
    ids = sorted({int(row[0]) for row in catalog if 1 <= int(row[0]) <= 1025})
    if len(ids) != 1025:
        raise SystemExit("Catalog changed: expected exactly 1025 verified Dex IDs")
    dest = Path(args.dest)
    base = dest / "base"
    shiny = dest / "shiny"
    base.mkdir(parents=True, exist_ok=True)
    shiny.mkdir(parents=True, exist_ok=True)
    jobs = [(dex, special, f"{'shiny/' if special else ''}{dex}.png")
            for dex in ids for special in (False, True)]
    hashes = {}
    misses = {"base": [], "shiny": []}
    def download(job):
        dex, special, relative = job
        path = (shiny if special else base) / f"{dex}.png"
        if path.exists():
            data = path.read_bytes()
            if verified_png(data):
                return dex, special, data
            path.unlink()
        return dex, special, fetch(relative)

    with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 20))) as pool:
        futures = {pool.submit(download, job): job for job in jobs}
        for index, future in enumerate(as_completed(futures), 1):
            dex, special, data = future.result()
            category = "shiny" if special else "base"
            if data is None:
                misses[category].append(dex)
            else:
                destination = (shiny if special else base) / f"{dex}.png"
                if not destination.exists():
                    destination.write_bytes(data)
                hashes[f"{category}/{dex}.png"] = hashlib.sha256(data).hexdigest()
            if index % 200 == 0:
                print(f"Offline sprites verified: {index}/{len(jobs)}", flush=True)
    # Exact extra form sprites. Fail the QA build on missing/bad bytes rather
    # than silently shipping the diamond placeholder or the wrong base form.
    form_hashes = {}
    for output, relative in FORM_FILES.items():
        url = FORM_SOURCE_ROOT + relative
        request = urllib.request.Request(
            url, headers={"User-Agent": "PokeSearch-LT119-exact-regional-sprite/1"})
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                if response.status != 200:
                    raise RuntimeError("non-200 form sprite response")
                content_type = response.headers.get("Content-Type", "").lower()
                if content_type and "image/png" not in content_type:
                    raise RuntimeError("form sprite has non-PNG content type")
                data = response.read(MAX_BYTES + 1)
        except (urllib.error.URLError, TimeoutError, OSError) as err:
            raise SystemExit(f"Cannot build exact regional form {output}: {type(err).__name__}")
        if not verified_png(data):
            raise SystemExit(f"Invalid regional form sprite: {output}")
        target = dest / output
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        form_hashes[output] = hashlib.sha256(data).hexdigest()

    # LT125: recover all 80 exact regional/seasonal PNGs from the uploaded
    # LT116 pack, but do not overwrite newer application JS/HTML or protections.
    from fetch_form_sprites import fetch_verified_forms
    form_hashes.update(fetch_verified_forms(dest))
    # All 317 previously verified forms now have exact normal/Shiny artwork
    # packaged offline as well, with no additional runtime API or permission.
    from fetch_all_verified_varieties import fetch_varieties
    form_hashes.update(fetch_varieties(dest))

    # Pin exact GO costume icons by repository commit + Git object SHA1.
    # Reject redirected HTML, mismatched bytes and missing normal/shiny art.
    costume_hashes = {}
    for output, (relative, object_id) in COSTUME_FILES.items():
        url = COSTUME_ROOT + relative
        request = urllib.request.Request(
            url, headers={"User-Agent": "PokeSearch-LT125-costume-pinner/1"})
        try:
            with urllib.request.urlopen(request, timeout=25) as response:
                if response.status != 200:
                    raise RuntimeError("non-200 costume response")
                kind = response.headers.get("Content-Type", "").lower()
                if kind and "image/png" not in kind:
                    raise RuntimeError("non-PNG costume response")
                image = response.read(MAX_BYTES + 1)
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            raise SystemExit("Missing pinned costume asset: " + output +
                             " (" + type(error).__name__ + ")")
        if not verified_png(image):
            raise SystemExit("Invalid PNG costume asset: " + output)
        actual = hashlib.sha1(b"blob " + str(len(image)).encode() +
                              bytes([0]) + image).hexdigest()
        if actual != object_id:
            raise SystemExit("Upstream costume asset changed: " + output)
        target = dest / output
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(image)
        costume_hashes[output] = hashlib.sha256(image).hexdigest()

    summary = {
        "schema": "pokesearch-offline-sprites-v1",
        "formSourceCommit": FORM_SOURCE_COMMIT,
        "costumeSourceCommit": COSTUME_SOURCE_COMMIT,
        "costumes": dict(sorted(costume_hashes.items())),
        "forms": dict(sorted(form_hashes.items())),
        "source": "PokeAPI/sprites master - exact Dex/variant PNG only",
        "dexCount": len(ids),
        "baseCount": len(ids) - len(misses["base"]),
        "shinyCount": len(ids) - len(misses["shiny"]),
        "missing": {key: sorted(value) for key, value in misses.items()},
        "sha256": dict(sorted(hashes.items())),
    }
    (dest / "manifest.json").write_text(json.dumps(summary, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    print("Sprite bundle:", summary["baseCount"], "normal;",
          summary["shinyCount"], "shiny;",
          sum((dest / category / f"{dex}.png").stat().st_size for category in ("base", "shiny")
              for dex in ids if (dest / category / f"{dex}.png").exists()), "bytes")
    if summary["baseCount"] < args.minimum_normal:
        raise SystemExit(f"Insufficient verified base sprites ({summary['baseCount']} < {args.minimum_normal}): refusing incomplete build")


if __name__ == "__main__":
    main()
