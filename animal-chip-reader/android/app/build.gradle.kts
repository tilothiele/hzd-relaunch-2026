plugins {
	id("com.android.application")
	id("org.jetbrains.kotlin.android")
	id("org.jetbrains.kotlin.plugin.compose")
	id("org.jetbrains.kotlin.plugin.serialization")
}

android {
	namespace = "de.hzd.animalchipreader"
	compileSdk = 34

	defaultConfig {
		applicationId = "de.hzd.animalchipreader"
		minSdk = 26
		targetSdk = 34
		versionCode = 1
		versionName = "1.0.0"
		testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
	}

	buildTypes {
		release {
			isMinifyEnabled = false
			proguardFiles(
				getDefaultProguardFile("proguard-android-optimize.txt"),
				"proguard-rules.pro",
			)
		}
	}

	compileOptions {
		sourceCompatibility = JavaVersion.VERSION_17
		targetCompatibility = JavaVersion.VERSION_17
	}

	kotlinOptions {
		jvmTarget = "17"
	}

	buildFeatures {
		compose = true
	}

	packaging {
		resources {
			excludes += "/META-INF/{AL2.0,LGPL2.1}"
		}
	}
}

dependencies {
	val composeBom = platform("androidx.compose:compose-bom:2024.06.00")
	implementation(composeBom)
	implementation("androidx.compose.ui:ui")
	implementation("androidx.compose.ui:ui-tooling-preview")
	implementation("androidx.compose.material3:material3")
	implementation("androidx.compose.material:material-icons-extended")
	debugImplementation("androidx.compose.ui:ui-tooling")

	implementation("androidx.core:core-ktx:1.13.1")
	implementation("androidx.activity:activity-compose:1.9.1")
	implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")
	implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.4")
	implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.4")
	implementation("androidx.navigation:navigation-compose:2.7.7")
	implementation("androidx.datastore:datastore-preferences:1.1.1")
	implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.1")
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

	testImplementation("junit:junit:4.13.2")
	testImplementation("com.google.truth:truth:1.4.4")
}

tasks.register<Exec>("installOnEmulator") {
	group = "install"
	description = "Installiert die Debug-APK ohne Incremental-Session (Workaround für API-34-Emulator)."
	dependsOn("assembleDebug")
	val adb = android.sdkDirectory.resolve("platform-tools/adb")
	val apk = layout.buildDirectory.file("outputs/apk/debug/app-debug.apk")
	commandLine(
		adb.absolutePath,
		"install",
		"-r",
		"-t",
		"--no-incremental",
		apk.get().asFile.absolutePath,
	)
}
