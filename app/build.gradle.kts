plugins { id("com.android.application") }
android {
    namespace = "com.lucianotoscano.pokesearchoverlay"
    compileSdk = 36
    defaultConfig {
        // Separate distribution identity: avoids signature conflicts with previous alpha APKs.
        applicationId = "com.lucianotoscano.pokesearch"
        minSdk = 26
        targetSdk = 33
        versionCode = 37
        versionName = "0.37-teste"
    }
    // Sideloaded beta: keep tested overlay behavior on target 32. Play Store publishing needs a separate target SDK migration.
    lint { disable += "ExpiredTargetSdkVersion" }
    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            isShrinkResources = false
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

// Generate a real circular transparent PNG from the existing approved logo.
// Runs before Android resources are merged; no new illustration or replacement artwork.
val createRoundIcon by tasks.registering {
    val source = file("src/main/res/drawable-nodpi/ic_launcher.png")
    val target = file("src/main/res/drawable-nodpi/pokesearch_round.png")
    inputs.file(source)
    outputs.file(target)
    doLast {
        val original = javax.imageio.ImageIO.read(source)
            ?: error("Original PokeSearch PNG was not found or could not be decoded")
        val pixels = 192
        val round = java.awt.image.BufferedImage(pixels, pixels, java.awt.image.BufferedImage.TYPE_INT_ARGB)
        val g = round.createGraphics()
        try {
            g.setRenderingHint(java.awt.RenderingHints.KEY_INTERPOLATION,
                java.awt.RenderingHints.VALUE_INTERPOLATION_BICUBIC)
            g.setRenderingHint(java.awt.RenderingHints.KEY_ANTIALIASING,
                java.awt.RenderingHints.VALUE_ANTIALIAS_ON)
            g.clip = java.awt.geom.Ellipse2D.Double(0.0, 0.0, pixels.toDouble(), pixels.toDouble())
            g.drawImage(original, 0, 0, pixels, pixels, null)
        } finally { g.dispose() }
        target.parentFile.mkdirs()
        check(javax.imageio.ImageIO.write(round, "png", target)) { "Unable to write round PNG" }
    }
}
tasks.matching { it.name == "preBuild" }.configureEach { dependsOn(createRoundIcon) }
