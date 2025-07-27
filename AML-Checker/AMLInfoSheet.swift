import SwiftUI
import UIKit

// MARK: - Модель для AML-информации
struct AMLInfo: Identifiable {
    let id = UUID()
    let title: String
    let value: String
    let riskLevel: RiskLevel
    let description: String
    
    enum RiskLevel: String {
        case low = "Низкий"
        case medium = "Средний"
        case high = "Высокий"
        
        var color: Color {
            switch self {
            case .low: return .green
            case .medium: return .yellow
            case .high: return .red
            }
        }
    }
}

// MARK: - Мок-данные для теста
let mockAMLInfo: [AMLInfo] = [
    AMLInfo(title: "Страна происхождения", value: "США", riskLevel: .medium, description: "Средний риск по стране происхождения адреса."),
    AMLInfo(title: "Связь с санкциями", value: "Нет", riskLevel: .low, description: "Связей с санкционными адресами не обнаружено."),
    AMLInfo(title: "Обнаружены миксеры", value: "Да", riskLevel: .high, description: "Обнаружено взаимодействие с миксерами. Высокий риск."),
    AMLInfo(title: "Объем транзакций", value: "$12,000", riskLevel: .medium, description: "Средний объём транзакций за последние 30 дней."),
    AMLInfo(title: "Связь с даркнетом", value: "Нет", riskLevel: .low, description: "Связей с даркнет-рынками не обнаружено.")
]

// MARK: - Панель действий (копировать/скачать)
struct AMLActionBar: View {
    let textToCopy: String
    var body: some View {
        HStack(spacing: 16) {
            CopyButton(textToCopy: textToCopy)
            DownloadPDFButton(textToExport: textToCopy)
        }
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Кнопка копирования
struct CopyButton: View {
    let textToCopy: String
    @State private var isCopied = false
    var body: some View {
        Button(action: {
            UIPasteboard.general.string = textToCopy
            withAnimation {
                isCopied = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                withAnimation {
                    isCopied = false
                }
            }
        }) {
            HStack(spacing: 8) {
                Image(systemName: isCopied ? "checkmark" : "doc.on.doc")
                    .foregroundColor(isCopied ? .green : .appAccent)
                    .animation(.easeInOut, value: isCopied)
                ZStack {
                    Text("Копировать")
                        .opacity(isCopied ? 0 : 1)
                        .foregroundColor(.appAccent)
                    Text("Скопировано!")
                        .opacity(isCopied ? 1 : 0)
                        .foregroundColor(.green)
                }
                .animation(.easeInOut, value: isCopied)
            }
            .frame(minWidth: 150)
        }
        .disabled(isCopied)
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Кнопка скачивания PDF
struct DownloadPDFButton: View {
    let textToExport: String
    var body: some View {
        Button(action: {
            // TODO: Реализовать экспорт в PDF
        }) {
            HStack {
                Image(systemName: "arrow.down.doc")
                Text("Скачать PDF")
            }
        }
    }
}

// MARK: - Модальное окно с AML-информацией
struct AMLInfoSheet: View {
    // Binding для управления показом sheet (опционально)
    @Binding var showSheet: Bool
    @Environment(\.dismiss) private var dismiss
    @State private var isLoading: Bool = true
    @State private var amlInfo: [AMLInfo] = []
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    VStack(spacing: 16) {
                        ProgressView()
                        Text("Загрузка данных...")
                            .foregroundColor(.appSecondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    VStack(spacing: 0) {
                        List(amlInfo) { info in
                            VStack(alignment: .leading, spacing: 6) {
                                HStack {
                                    Text(info.title)
                                        .font(.headline)
                                    Spacer()
                                    Text(info.value)
                                        .font(.subheadline)
                                        .foregroundColor(info.riskLevel.color)
                                        .bold()
                                }
                                Text(info.description)
                                    .font(.footnote)
                                    .foregroundColor(.appSecondary)
                            }
                            .padding(.vertical, 4)
                        }
                        .listStyle(InsetGroupedListStyle())
                        AMLActionBar(textToCopy: AMLInfoCopyAdapter.makeCopyText(from: amlInfo))
                    }
                }
            }
            .navigationTitle("AML-проверка")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Закрыть") {
                        // Закрываем sheet через биндинг или dismiss
                        showSheet = false
                        dismiss()
                    }
                }
            }
         
                
            
        }
        .onAppear {
            isLoading = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            
                amlInfo = mockAMLInfo
                isLoading = false
            }
        }
    }
}

// MARK: - Превью для SwiftUI
#Preview {
    AMLInfoSheet(showSheet: .constant(true))
} 
