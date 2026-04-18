plugins {
    java
    id("com.gradleup.shadow") version "9.0.0-beta12"
}

group = "de.mcstatsbot"
version = "1.0.0"

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

repositories {
    mavenCentral()
    maven("https://repo.papermc.io/repository/maven-public/")
    maven("https://repo.dmulloy2.net/repository/public/")
}

dependencies {
    compileOnly("io.papermc.paper:paper-api:1.21.1-R0.1-SNAPSHOT")

    implementation("org.xerial:sqlite-jdbc:3.46.1.0")
    implementation("com.zaxxer:HikariCP:5.1.0")
}

tasks {
    shadowJar {
        archiveClassifier.set("")
        relocate("com.zaxxer.hikari", "de.mcstatsbot.libs.hikari")

        mergeServiceFiles()

        manifest {
            attributes["Main-Class"] = "de.mcstatsbot.MCStatsBot"
        }
    }

    build {
        dependsOn(shadowJar)
    }

    processResources {
        val props = mapOf("version" to version)
        inputs.properties(props)
        filesMatching("plugin.yml") {
            expand(props)
        }
    }

    compileJava {
        options.encoding = "UTF-8"
        options.release.set(21)
    }
}
