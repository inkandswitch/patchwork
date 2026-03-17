import AppIntents
import Foundation

/// "Share to Patchwork" — receives shared content and sends it to Patchwork.
/// This can be used as both a Shortcut action and backs the Share Extension.
@available(iOS 16.0, macOS 13.0, *)
struct ShareToPatchworkIntent: AppIntent {
    static var title: LocalizedStringResource = "Share to Patchwork"
    static var description = IntentDescription(
        "Send text, URLs, or other content to Patchwork.",
        categoryName: "Patchwork"
    )
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Text")
    var text: String?

    @Parameter(title: "URL")
    var url: String?

    @Parameter(title: "Title")
    var title: String?

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        var parts: [String] = []
        if let text = text { parts.append("text: \(jsString(text))") }
        if let url = url { parts.append("url: \(jsString(url))") }
        if let title = title { parts.append("title: \(jsString(title))") }

        let code = """
        window.dispatchEvent(new CustomEvent("patchwork:share-raw", {
            detail: { \(parts.joined(separator: ", ")) }
        }));
        return "shared";
        """

        let requestUrl = URL(string: "http://localhost:3030/eval")!
        var request = URLRequest(url: requestUrl)
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

    private func jsString(_ s: String) -> String {
        let escaped = s
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "\\r")
        return "\"\(escaped)\""
    }
}
