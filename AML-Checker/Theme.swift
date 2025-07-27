import SwiftUI

// MARK: - Цвета приложения (Apple best practices)
extension Color {
    static let appBackground = Color(.systemBackground) // Системный фон
    static let appPrimary = Color(.label) // Основной текст
    static let appSecondary = Color(.secondaryLabel) // Второстепенный текст
    static let appAccent = Color.accentColor // Акцентный цвет (из Assets)
    // Можно добавить свои цвета через Assets.xcassets и использовать здесь
}

// MARK: - Шрифты приложения (Apple best practices)
extension Font {
    static let appTitle = Font.title.bold() // Заголовок
    static let appBody = Font.body // Обычный текст
    static let appButton = Font.headline.bold() // Кнопки
} 