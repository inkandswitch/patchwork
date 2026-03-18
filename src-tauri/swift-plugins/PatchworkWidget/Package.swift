// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "PatchworkWidget",
    platforms: [.macOS(.v14)],
    products: [
        .library(name: "PatchworkWidget", targets: ["PatchworkWidget"]),
    ],
    targets: [
        .target(name: "PatchworkWidget", path: "Sources"),
    ]
)
