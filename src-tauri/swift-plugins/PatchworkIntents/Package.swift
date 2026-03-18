// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "PatchworkIntents",
    platforms: [.iOS(.v16), .macOS(.v13)],
    products: [
        .library(name: "PatchworkIntents", targets: ["PatchworkIntents"]),
    ],
    targets: [
        .target(name: "PatchworkIntents", path: "Sources"),
    ]
)
