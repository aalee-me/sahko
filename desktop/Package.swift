// swift-tools-version: 5.9
import PackageDescription
let package = Package(name: "SahkoDesktop", platforms: [.macOS(.v13)], products: [.executable(name: "SahkoDesktop", targets: ["SahkoDesktop"])], targets: [.target(name: "SahkoCore"), .executableTarget(name: "SahkoDesktop", dependencies: ["SahkoCore"]), .testTarget(name: "SahkoCoreTests", dependencies: ["SahkoCore"])])
