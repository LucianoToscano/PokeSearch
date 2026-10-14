plugins { id("com.android.application") }
android {
    namespace = "com.lucianotoscano.pokesearchoverlay"
    compileSdk = 36
    defaultConfig {
        // Separate distribution identity: avoids signature conflicts with previous alpha APKs.
        applicationId = "com.lucianotoscano.pokesearch"
        minSdk = 26
        targetSdk = 33
        versionCode = 36
        versionName = "0.36-teste"
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
