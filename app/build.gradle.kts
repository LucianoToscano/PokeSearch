plugins { id("com.android.application") }
android {
    namespace = "com.lucianotoscano.pokesearchoverlay"
    compileSdk = 36
    defaultConfig {
        // Separate distribution identity: avoids signature conflicts with previous alpha APKs.
        applicationId = "com.lucianotoscano.pokesearch"
        minSdk = 26
        targetSdk = 33
        versionCode = 51
        versionName = "0.51-beta"
    }
    // Sideloaded beta: keep tested overlay behavior on target 32. Play Store publishing needs a separate target SDK migration.
    lint { disable += "ExpiredTargetSdkVersion" }
    val releaseStore = System.getenv("POKE_RELEASE_KEYSTORE")
    if (!releaseStore.isNullOrBlank()) {
        signingConfigs {
            create("privateTestRelease") {
                storeFile = file(releaseStore)
                storePassword = System.getenv("POKE_RELEASE_STORE_PASSWORD")
                keyAlias = System.getenv("POKE_RELEASE_KEY_ALIAS")
                keyPassword = System.getenv("POKE_RELEASE_KEY_PASSWORD")
            }
        }
    }
    buildTypes {
        getByName("release") {
            if (!releaseStore.isNullOrBlank()) signingConfig = signingConfigs.getByName("privateTestRelease")
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

// Generate the same official launcher artwork as a circular transparent PNG.
val createRoundIcon by tasks.registering(Exec::class) {
    val original = file("src/main/res/drawable-nodpi/ic_launcher.png")
    val output = file("src/main/res/drawable-nodpi/pokesearch_round.png")
    val adaptive = file("src/main/res/drawable-nodpi/pokesearch_adaptive_foreground.png")
    inputs.file(original)
    inputs.file("scripts/RoundIcon.java")
    outputs.files(output, adaptive)
    // Generate both Android adaptive and legacy fallback icons only on a future build.
    // Do not run Gradle or generate APKs until the user explicitly authorizes it.
    commandLine("java", "-Djava.awt.headless=true", file("scripts/RoundIcon.java").absolutePath,
        original.absolutePath, output.absolutePath, adaptive.absolutePath)
}
tasks.matching { it.name == "preBuild" }.configureEach { dependsOn(createRoundIcon) }
