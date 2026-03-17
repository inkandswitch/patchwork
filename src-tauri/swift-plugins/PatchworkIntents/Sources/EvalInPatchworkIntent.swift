import AppIntents
import Foundation

/// "Eval in Patchwork" — an Apple Shortcut that sends JavaScript code
/// to the running Patchwork app and returns the result.
///
/// Usage from Shortcuts:
///   1. Add "Eval in Patchwork" action
///   2. Pass JS code as input
///   3. Get the result back as text
///
/// This works by POSTing to the local Patchwork HTTP server at localhost:3030/eval,
/// which forwards the code to the webview and returns the result.
@available(iOS 16.0, macOS 13.0, *)
struct EvalInPatchworkIntent: AppIntent {
    static var title: LocalizedStringResource = "Eval in Patchwork"
    static var description = IntentDescription(
        "Run JavaScript code inside the Patchwork app and return the result.",
        categoryName: "Patchwork"
    )
    static var openAppWhenRun: Bool = false

    @Parameter(title: "JavaScript Code")
    var code: String

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let url = URL(string: "http://localhost:3030/eval")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = code.data(using: .utf8)
        request.setValue("text/plain", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30

        let (data, response) = try await URLSession.shared.data(for: request)
        let httpResponse = response as! HTTPURLResponse

        guard httpResponse.statusCode == 200 else {
            let error = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw EvalError.failed(error)
        }

        let result = String(data: data, encoding: .utf8) ?? ""
        return .result(value: result)
    }
}

enum EvalError: Error, LocalizedError {
    case failed(String)

    var errorDescription: String? {
        switch self {
        case .failed(let message):
            return "Patchwork eval failed: \(message)"
        }
    }
}

/// "Create Document in Patchwork" — creates a new document of a given type.
@available(iOS 16.0, macOS 13.0, *)
struct CreateDocumentIntent: AppIntent {
    static var title: LocalizedStringResource = "Create Document in Patchwork"
    static var description = IntentDescription(
        "Create a new document of a specified type in Patchwork.",
        categoryName: "Patchwork"
    )
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Document Type", description: "e.g. 'markdown', 'contact'")
    var datatypeId: String

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let code = """
        const { getRegistry, createDocOfDatatype2 } = window.patchwork.plugins;
        const registry = getRegistry("patchwork:datatype");
        const loaded = await registry.load("\(datatypeId)");
        if (!loaded) throw new Error("Unknown datatype: \(datatypeId)");
        const handle = await createDocOfDatatype2(loaded, window.patchwork.repo);
        return handle.url;
        """

        let url = URL(string: "http://localhost:3030/eval")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = code.data(using: .utf8)
        request.timeoutInterval = 30

        let (data, response) = try await URLSession.shared.data(for: request)
        let httpResponse = response as! HTTPURLResponse

        guard httpResponse.statusCode == 200 else {
            let error = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw EvalError.failed(error)
        }

        let result = String(data: data, encoding: .utf8) ?? ""
        return .result(value: result)
    }
}

/// "List Patchwork Datatypes" — returns available document types.
@available(iOS 16.0, macOS 13.0, *)
struct ListDatatypesIntent: AppIntent {
    static var title: LocalizedStringResource = "List Patchwork Datatypes"
    static var description = IntentDescription(
        "List all available document types in Patchwork.",
        categoryName: "Patchwork"
    )
    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let code = """
        const { getRegistry } = window.patchwork.plugins;
        const registry = getRegistry("patchwork:datatype");
        return registry.all()
            .filter(d => !d.unlisted)
            .map(d => d.name)
            .join(", ");
        """

        let url = URL(string: "http://localhost:3030/eval")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = code.data(using: .utf8)
        request.timeoutInterval = 30

        let (data, response) = try await URLSession.shared.data(for: request)
        let httpResponse = response as! HTTPURLResponse

        guard httpResponse.statusCode == 200 else {
            let error = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw EvalError.failed(error)
        }

        let result = String(data: data, encoding: .utf8) ?? ""
        return .result(value: result)
    }
}

/// Register all Patchwork shortcuts with the system.
@available(iOS 16.0, macOS 13.0, *)
struct PatchworkShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        return [
            AppShortcut(
                intent: EvalInPatchworkIntent(),
                phrases: [
                    "Eval in \(.applicationName)",
                    "Run JavaScript in \(.applicationName)"
                ],
                shortTitle: "Eval in Patchwork",
                systemImageName: "terminal"
            ),
            AppShortcut(
                intent: CreateDocumentIntent(),
                phrases: [
                    "Create a document in \(.applicationName)",
                    "New \(.applicationName) document"
                ],
                shortTitle: "Create Document",
                systemImageName: "doc.badge.plus"
            ),
            AppShortcut(
                intent: ListDatatypesIntent(),
                phrases: [
                    "List \(.applicationName) datatypes",
                    "What can \(.applicationName) create"
                ],
                shortTitle: "List Datatypes",
                systemImageName: "list.bullet"
            ),
        ]
    }
}
