import java.util.Base64

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

/**
 * Dart defines passed with --dart-define / --dart-define-from-file arrive here as
 * a comma-separated list of base64-encoded KEY=VALUE pairs. Only APP_ENV
 * (config/<env>.json) is read, to pick the network security config: cleartext
 * HTTP is allowed for `dev` only (LAN backend), never for staging/prod.
 * A build without APP_ENV is treated as prod (no cleartext).
 */
val dartDefines: Map<String, String> =
    (project.findProperty("dart-defines") as String?)
        ?.split(",")
        ?.filter { it.isNotBlank() }
        ?.map { String(Base64.getDecoder().decode(it), Charsets.UTF_8) }
        ?.filter { it.contains("=") }
        ?.associate { it.substringBefore("=") to it.substringAfter("=") }
        ?: emptyMap()

val appEnv: String = dartDefines["APP_ENV"] ?: "prod"
val allowCleartext: Boolean = appEnv == "dev"

android {
    namespace = "com.example.nexa_mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // The application id stays the scaffold default until the APK distribution /
        // signing decision is made (nexa_mobile/CLAUDE.md §2, TBD — Phase 12/14).
        applicationId = "com.example.nexa_mobile"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName

        manifestPlaceholders["networkSecurityConfig"] =
            if (allowCleartext) "@xml/network_security_config_dev" else "@xml/network_security_config"
        manifestPlaceholders["usesCleartextTraffic"] = allowCleartext.toString()
    }

    buildTypes {
        release {
            // Release signing is not configured on purpose: APK distribution is still
            // TBD (nexa_mobile/CLAUDE.md §2). Signing with the debug keys for now,
            // so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
