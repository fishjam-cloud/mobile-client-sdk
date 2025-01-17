// swift-tools-version:5.5
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "FishjamClient",
    platforms: [
        .iOS(.v13)
    ],
    products: [
        // Products define the executables and libraries a package produces, and make them visible to other packages.
        .library(
            name: "FishjamClient",
            targets: ["FishjamClient"])
    ],
    dependencies: [
        .package(name: "WebRTC", url: "https://github.com/webrtc-sdk/Specs.git", .exact("114.5735.08")),
        .package(
            name: "SwiftProtobuf", url: "https://github.com/apple/swift-protobuf.git",
            .upToNextMajor(from: "1.18.0")),
        .package(url: "https://github.com/daltoniam/Starscream.git", from: "4.0.0"),
        .package(
            name: "Mockingbird", url: "https://github.com/birdrides/mockingbird.git",
            .upToNextMinor(from: "0.20.0")),
        .package(
            name: "Promises", url: "https://github.com/google/promises.git", .upToNextMajor(from: "2.0.0")
        ),
        .package(url: "https://github.com/apple/swift-log.git", .upToNextMajor(from: "1.4.2")),
        .package(url: "https://github.com/apple/swift-docc-plugin", from: "1.0.0"),

    ],
    targets: [
        // Targets are the basic building blocks of a package. A target can define a module or a test suite.
        // Targets can depend on other targets in this package, and on products in packages this package depends on.
        .target(
            name: "FishjamClient",
            dependencies: [
                "WebRTC", "SwiftProtobuf", "Promises",
                .product(name: "Starscream", package: "Starscream"),
                .product(name: "FBLPromises", package: "Promises"),
                .product(name: "Logging", package: "swift-log"),
            ],
            path: "Sources"),
        .testTarget(name: "FishjamClientTests", dependencies: ["FishjamClient", "Mockingbird"]),
    ]
)
