import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Configuration Intent

/// Users choose a document URL and tool ID when configuring the widget.
@available(macOS 14.0, *)
struct PatchworkDocumentIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Patchwork Document"
    static var description = IntentDescription("Display a Patchwork document with a specific tool.")

    @Parameter(title: "Document URL", description: "The automerge URL of the document (e.g. automerge:abc123)")
    var documentUrl: String

    @Parameter(title: "Tool ID", description: "The tool to render the document with")
    var toolId: String

    @Parameter(title: "Title", default: "Patchwork")
    var displayTitle: String
}

// MARK: - Timeline Entry

struct PatchworkEntry: TimelineEntry {
    let date: Date
    let title: String
    let content: String
    let isError: Bool
}

// MARK: - Timeline Provider

@available(macOS 14.0, *)
struct PatchworkProvider: AppIntentTimelineProvider {
    typealias Intent = PatchworkDocumentIntent
    typealias Entry = PatchworkEntry

    func placeholder(in context: Context) -> PatchworkEntry {
        PatchworkEntry(date: .now, title: "Patchwork", content: "Loading...", isError: false)
    }

    func snapshot(for configuration: PatchworkDocumentIntent, in context: Context) async -> PatchworkEntry {
        PatchworkEntry(date: .now, title: configuration.displayTitle, content: "Preview", isError: false)
    }

    func timeline(for configuration: PatchworkDocumentIntent, in context: Context) async -> Timeline<PatchworkEntry> {
        let entry = await fetchContent(for: configuration)
        // Refresh every 5 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 5, to: .now)!
        return Timeline(entries: [entry], policy: .after(nextUpdate))
    }

    private func fetchContent(for config: PatchworkDocumentIntent) async -> PatchworkEntry {
        let code = """
        const handle = await window.patchwork.repo.find("\(jsEscape(config.documentUrl))");
        const doc = handle.doc();
        return JSON.stringify({
            title: doc?.["@patchwork"]?.title || doc?.title || "\(jsEscape(config.displayTitle))",
            content: JSON.stringify(doc, null, 2)?.substring(0, 500) || "empty"
        });
        """

        do {
            let url = URL(string: "http://localhost:3030/eval")!
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.httpBody = code.data(using: .utf8)
            request.timeoutInterval = 10

            let (data, response) = try await URLSession.shared.data(for: request)
            let httpResponse = response as! HTTPURLResponse

            guard httpResponse.statusCode == 200 else {
                let error = String(data: data, encoding: .utf8) ?? "HTTP \(httpResponse.statusCode)"
                return PatchworkEntry(date: .now, title: config.displayTitle, content: error, isError: true)
            }

            let resultStr = String(data: data, encoding: .utf8) ?? ""
            // The eval endpoint wraps the result in JSON.stringify, so we need to parse it
            if let jsonData = resultStr.data(using: .utf8),
               let parsed = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
                let title = parsed["title"] as? String ?? config.displayTitle
                let content = parsed["content"] as? String ?? resultStr
                return PatchworkEntry(date: .now, title: title, content: content, isError: false)
            }

            return PatchworkEntry(date: .now, title: config.displayTitle, content: resultStr, isError: false)
        } catch {
            return PatchworkEntry(
                date: .now,
                title: config.displayTitle,
                content: "Patchwork not running",
                isError: true
            )
        }
    }

    private func jsEscape(_ s: String) -> String {
        s.replacingOccurrences(of: "\\", with: "\\\\")
         .replacingOccurrences(of: "\"", with: "\\\"")
         .replacingOccurrences(of: "\n", with: "\\n")
    }
}

// MARK: - Widget Views

@available(macOS 14.0, *)
struct PatchworkWidgetView: View {
    let entry: PatchworkEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: "doc.text")
                    .foregroundStyle(.secondary)
                Text(entry.title)
                    .font(.headline)
                    .lineLimit(1)
            }

            if entry.isError {
                Text(entry.content)
                    .font(.caption)
                    .foregroundStyle(.red)
            } else {
                Text(entry.content)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(nil)
            }

            Spacer(minLength: 0)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

// MARK: - Widget Definition

@available(macOS 14.0, *)
struct PatchworkDocWidget: Widget {
    let kind = "com.inkandswitch.patchwork.widget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind,
            intent: PatchworkDocumentIntent.self,
            provider: PatchworkProvider()
        ) { entry in
            PatchworkWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Patchwork Document")
        .description("Pin a Patchwork document to your desktop.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Widget Bundle

@available(macOS 14.0, *)
@main
struct PatchworkWidgetBundle: WidgetBundle {
    var body: some Widget {
        PatchworkDocWidget()
    }
}
