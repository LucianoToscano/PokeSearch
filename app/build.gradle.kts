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

// Generate the same official launcher artwork as a circular transparent PNG.
val createRoundIcon by tasks.registering(Exec::class) {
    val original = file("src/main/res/drawable-nodpi/ic_launcher.png")
    val output = file("src/main/res/drawable-nodpi/pokesearch_round.png")
    inputs.file(original)
    inputs.file("scripts/RoundIcon.java")
    outputs.file(output)
    commandLine("java", file("scripts/RoundIcon.java").absolutePath,
        original.absolutePath, output.absolutePath)
}
tasks.matching { it.name == "preBuild" }.configureEach { dependsOn(createRoundIcon) }
