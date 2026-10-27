import java.security.MessageDigest
plugins { id("com.android.application") }

// Independent, anonymous LT54 counters; no google-services plugin required
// because FirebaseStats initializes the named app using public Android config.
dependencies {
    implementation("androidx.work:work-runtime:2.10.2")
    implementation("androidx.core:core:1.15.0")
    implementation(platform("com.google.firebase:firebase-bom:34.19.0"))
    implementation("com.google.firebase:firebase-auth")
    implementation("com.google.firebase:firebase-database")
    implementation("com.google.firebase:firebase-functions")
}

// Stable internal-test signing is optional for local development, but mandatory
// for the CI distribution workflow. Never store the keystore or passwords in Git.
val testVersionCode = System.getenv("POKE_TEST_VERSION_CODE")?.let { value ->
    val parsed = value.toIntOrNull()
        ?: throw org.gradle.api.GradleException("POKE_TEST_VERSION_CODE must be numeric")
    if (parsed !in 52..2_100_000_000)
        throw org.gradle.api.GradleException("POKE_TEST_VERSION_CODE is outside the allowed upgrade range")
    parsed
}
// Monotonic Android versionCode exceeds earlier 2.00 (52140) and 0.51
// (53142) APKs, while the visible version stays on this 0.51 branch.
val testVersionLabel=System.getenv("POKE_TEST_VERSION_LABEL")?.let { value ->
    val parsed=value.toIntOrNull()
        ?: throw org.gradle.api.GradleException("POKE_TEST_VERSION_LABEL must be numeric")
    if(parsed !in 51000..2_100_000_000)
        throw org.gradle.api.GradleException("Invalid signed 0.51 version label")
    parsed
}
// Public fingerprint of permanent test-signing certificate (not a secret).
val publicVersionName = System.getenv("POKE_TEST_PUBLIC_VERSION")?.trim()?.takeIf { it.isNotEmpty() }
// Public names strictly follow 0.00.99 -> 0.01.00 (two digits per group).
// Do not silently accept historical malformed 0.00.100+ labels on new builds.
if (publicVersionName != null && !Regex("0\\.\\d{2}\\.\\d{2}").matches(publicVersionName))
    throw org.gradle.api.GradleException("Invalid public PokeSearch version name")
val officialTestCertificateSha256 = "34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e"
val releaseCertificateSha256 = System.getenv("POKE_RELEASE_CERT_SHA256")?.trim()?.lowercase() ?: ""
if (releaseCertificateSha256.isNotEmpty() && !Regex("[0-9a-f]{64}").matches(releaseCertificateSha256))
    throw org.gradle.api.GradleException("POKE_RELEASE_CERT_SHA256 must contain 64 hexadecimal characters")
val checkedAssetNames = listOf("dock.html", "overlay.html", "detail.html",
    "probe.js", "login_entry.js", "shiny_login.js", "release_notes.json")
val assetChecksums = checkedAssetNames.joinToString(";") { name ->
    val bytes = file("src/main/assets/$name").readBytes()
    val hash = MessageDigest.getInstance("SHA-256").digest(bytes)
        .joinToString("") { "%02x".format(it.toInt() and 0xff) }
    "$name=$hash"
}
val testKeyFile = System.getenv("POKE_TEST_KEYSTORE")
val testStorePassword = System.getenv("POKE_TEST_STORE_PASSWORD")
val testKeyAlias = System.getenv("POKE_TEST_KEY_ALIAS")
val testKeyPassword = System.getenv("POKE_TEST_KEY_PASSWORD")
val testSigningFields = listOf(testKeyFile, testStorePassword, testKeyAlias, testKeyPassword)
val testSigningComplete = testSigningFields.all { !it.isNullOrBlank() }
val testSigningRequired = System.getenv("POKE_TEST_SIGNING_REQUIRED") == "true"
val controlledDistribution = System.getenv("POKE_CONTROLLED_DISTRIBUTION") == "true"
if (controlledDistribution && (System.getenv("POKE_RELEASE_KEYSTORE").isNullOrBlank() ||
        releaseCertificateSha256 != officialTestCertificateSha256))
    throw org.gradle.api.GradleException("Controlled APK requires the verified permanent release signer")
// A local, read-only scrapbook demo may be visible in the explicitly signed QA
// candidate only. Ordinary Release builds default to false, regardless of prefs.
// Moderated online QA is a distinct opt-in; no ordinary release receives these writes.
val scrapbookStage1Qa = System.getenv("POKE_SCRAPBOOK_STAGE1_QA") == "true" &&
    System.getenv("POKE_SCRAPBOOK_QA_ACK") == "stage1-readonly" &&
    !System.getenv("POKE_RELEASE_KEYSTORE").isNullOrBlank() &&
    releaseCertificateSha256 == officialTestCertificateSha256 &&
    testVersionCode != null && testVersionCode >= 54299
val scrapbookOnlineQa = scrapbookStage1Qa &&
    System.getenv("POKE_SCRAPBOOK_ONLINE_QA") == "true" &&
    System.getenv("POKE_SCRAPBOOK_ONLINE_ACK") == "read-only-moderation-pending" &&
    testVersionCode != null && testVersionCode >= 54301
if ((testSigningRequired || testSigningFields.any { !it.isNullOrBlank() }) && !testSigningComplete)
    throw org.gradle.api.GradleException("Stable test signing is incomplete; configure the protected CI secrets")
if (testSigningRequired && testVersionLabel == null)
    throw org.gradle.api.GradleException("Signed builds require a version label")
if (testSigningRequired && testVersionCode == null)
    throw org.gradle.api.GradleException("Signed test builds require a monotonically increasing versionCode")
if (testSigningComplete && !file(testKeyFile!!).isFile)
    throw org.gradle.api.GradleException("The protected test keystore was not restored")

android {
    buildFeatures { buildConfig = true }
    namespace = "com.lucianotoscano.pokesearchoverlay"
    compileSdk = 36
    defaultConfig {
        // Separate distribution identity: avoids signature conflicts with previous alpha APKs.
        applicationId = "com.lucianotoscano.pokesearch"
        minSdk = 26
        targetSdk = 33
        buildConfigField("String", "EXPECTED_SIGNING_CERT_SHA256", "\"\"")
        buildConfigField("String", "EXPECTED_ASSET_SHA256", "\"$assetChecksums\"")
        buildConfigField("boolean", "SCRAPBOOK_STAGE1_QA", "false")
        buildConfigField("boolean", "SCRAPBOOK_ONLINE_QA", "false")
        buildConfigField("boolean", "CONTROLLED_DISTRIBUTION", "false")
        versionCode = testVersionCode ?: 51
        versionName = if (testVersionCode != null) (publicVersionName ?: "0.51-beta.test.${testVersionLabel ?: testVersionCode}") else "0.51-beta"
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
    if (testSigningComplete) {
        signingConfigs {
            create("persistentTestDebug") {
                storeFile = file(testKeyFile!!)
                storePassword = testStorePassword
                keyAlias = testKeyAlias
                keyPassword = testKeyPassword
            }
        }
    }
    buildTypes {
        getByName("debug") {
            if (testSigningComplete) {
                signingConfig = signingConfigs.getByName("persistentTestDebug")
                isMinifyEnabled = true
                isShrinkResources = true
                proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
                buildConfigField("String", "EXPECTED_SIGNING_CERT_SHA256",
                    "\"$officialTestCertificateSha256\"")
            }
        }
        getByName("release") {
            buildConfigField("boolean", "CONTROLLED_DISTRIBUTION", "$controlledDistribution")
            // True ONLY in this isolated signed QA workflow. Never on public Releases.
            buildConfigField("boolean", "SCRAPBOOK_STAGE1_QA",
                if (scrapbookStage1Qa) "true" else "false")
            buildConfigField("boolean", "SCRAPBOOK_ONLINE_QA",
                if (scrapbookOnlineQa) "true" else "false")
            buildConfigField("String", "EXPECTED_SIGNING_CERT_SHA256",
                "\"$releaseCertificateSha256\"")
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

tasks.matching { it.name == "preReleaseBuild" }.configureEach {
    doFirst {
        if (System.getenv("POKE_RELEASE_KEYSTORE").isNullOrBlank() || releaseCertificateSha256.isEmpty())
            throw org.gradle.api.GradleException("Release signing and POKE_RELEASE_CERT_SHA256 are required")
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
