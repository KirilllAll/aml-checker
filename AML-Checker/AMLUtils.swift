import Foundation

// MARK: - Адаптер для подготовки текста AMLInfo к копированию
struct AMLInfoCopyAdapter {
    /// Формирует строку для копирования из массива AMLInfo
    static func makeCopyText(from amlInfo: [AMLInfo]) -> String {
   
        amlInfo.map { "\($0.title): \($0.value) (\($0.riskLevel.rawValue)) — \($0.description)" }
            .joined(separator: "\n")
    }
} 
