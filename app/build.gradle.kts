plugins { id("com.android.application") }

val keyFile = System.getenv("POKE_TEST_KEYSTORE")
val keyStorePass = System.getenv("POKE_TEST_STORE_PASSWORD")
val testAlias = System.getenv("POKE_TEST_KEY_ALIAS")
val keyPass = System.getenv("POKE_TEST_KEY_PASSWORD")
val signingReady = listOf(keyFile,keyStorePass,testAlias,keyPass).all { !it.isNullOrBlank() }
if (System.getenv("POKE_TEST_SIGNING_REQUIRED") == "true" && !signingReady) {
    throw GradleException("Assinatura permanente obrigatória: secrets da chave ausentes.")
}
if (signingReady && !file(keyFile!!).isFile) {
    throw GradleException("Arquivo privado da chave permanente não encontrado.")
}
val buildCode = System.getenv("POKE_TEST_VERSION_CODE")?.toIntOrNull() ?: 53000
if (buildCode < 53000) throw GradleException("versionCode deve ser >= 53000.")

android {
    namespace = "com.lucianotoscano.pokesearchoverlay"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.lucianotoscano.pokesearch"
        minSdk = 26
        targetSdk = 33
        versionCode = buildCode
        versionName = "3.00-zero.test.$buildCode"
    }
    lint { disable += "ExpiredTargetSdkVersion" }
    if (signingReady) {
        signingConfigs {
            create("permanentTest") {
                storeFile = file(keyFile!!)
                storePassword = keyStorePass
                keyAlias = testAlias
                keyPassword = keyPass
            }
        }
    }
    buildTypes {
        getByName("debug") {
            if (signingReady) signingConfig = signingConfigs.getByName("permanentTest")
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
        getByName("release") {
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

// Mesmo ícone-base e mesmo gerador da versão anterior.
val generateOfficialIcon by tasks.registering(Exec::class) {
    val source = file("src/main/res/drawable-nodpi/ic_launcher.png")
    val round = file("src/main/res/drawable-nodpi/pokesearch_round.png")
    val adaptive = file("src/main/res/drawable-nodpi/pokesearch_adaptive_foreground.png")
    inputs.files(source, file("scripts/RoundIcon.java"))
    outputs.files(round, adaptive)
    commandLine("java", "-Djava.awt.headless=true", file("scripts/RoundIcon.java").absolutePath,
        source.absolutePath, round.absolutePath, adaptive.absolutePath)
}
tasks.matching { it.name == "preBuild" }.configureEach { dependsOn(generateOfficialIcon) }
